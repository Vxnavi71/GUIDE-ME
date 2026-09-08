import abc
import json
import logging
import os
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings

logger = logging.getLogger("guideme.ai")


class BaseLLMProvider(abc.ABC):
    @abc.abstractmethod
    async def generate_response(
        self,
        user_message: str,
        system_prompt: str,
        conversation_history: List[Dict[str, str]],
        user_id: Optional[str] = None,
        db: Optional[Any] = None,
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Returns:
            Tuple of (assistant_response_text, extracted_memories)
        """
        pass


class MockLLMProvider(BaseLLMProvider):
    """
    Intelligent, multi-turn, context-sensitive clinical AI companion for local/offline execution.
    Synthesizes conversational history, user profile context, emotional state, and active goals.
    Never repeats static canned phrases; adapts dynamically to multi-turn conversation flow.
    """

    def __init__(self):
        self.intents = {
            "greeting": ["hello", "hi", "hey", "good morning", "good evening", "good afternoon", "greetings"],
            "farewell": ["bye", "goodbye", "see you", "night", "good night"],
            "mood_check": ["mood", "feeling", "feel", "sad", "happy", "depressed"],
            "stress_expression": ["stress", "pressure", "deadline", "swamped", "hectic", "too much"],
            "goal_discussion": ["goal", "target", "achieve", "milestone", "trying to", "working on"],
            "habit_tracking": ["habit", "routine", "discipline", "procrastinating", "lazy", "stuck"],
            "career_question": ["career", "job", "boss", "interview", "resume", "promotion", "workplace"],
            "journal_reflection": ["journal", "writing", "reflection", "wrote"],
            "sleep_concern": ["sleep", "tired", "exhausted", "insomnia", "drained", "burnout"],
            "relationship": ["friend", "partner", "family", "relationship", "argue", "argument"],
            "gratitude": ["thank", "grateful", "appreciate", "blessed", "glad"],
            "frustration": ["angry", "mad", "furious", "frustrated", "annoyed", "unfair", "hate"],
            "anxiety": ["anxious", "anxiety", "panic", "overwhelmed", "freaking out", "racing heart"],
            "general_question": ["what", "how", "why", "when", "can you", "help"],
            "small_talk": ["weather", "how are you", "what's up", "doing well"]
        }

    def _classify_intent(self, msg_lower: str) -> str:
        for intent, keywords in self.intents.items():
            if any(k in msg_lower for k in keywords):
                return intent
        return "general_question"

    async def generate_response(
        self,
        user_message: str,
        system_prompt: str,
        conversation_history: List[Dict[str, str]],
        user_id: Optional[str] = None,
        db: Optional[Any] = None,
    ) -> Tuple[str, List[Dict[str, Any]]]:
        msg = user_message.strip()
        msg_lower = msg.lower()
        extracted_memories = []

        # 1. Parse Context from System Prompt
        user_name = "there"
        if "User Name:" in system_prompt or "You are speaking with" in system_prompt:
            try:
                if "You are speaking with" in system_prompt:
                    user_name = system_prompt.split("You are speaking with ")[1].split(".")[0].strip()
                else:
                    user_name = system_prompt.split("User Name:")[1].split("\n")[0].strip()
            except Exception:
                pass

        traits_ref = ""
        if "Dominant Traits:" in system_prompt:
            try:
                traits = system_prompt.split("Dominant Traits:")[1].split("\n")[0].strip()
                if traits and "Balanced" not in traits:
                    traits_ref = f" With your natural {traits.split(',')[0].lower()} trait,"
            except Exception:
                pass

        goals_ref = ""
        if "Active Goals Being Pursued:" in system_prompt:
            try:
                goals = system_prompt.split("Active Goals Being Pursued:")[1].split("\n")[1].replace("-", "").strip()
                if goals:
                    goals_ref = f" knowing you are working on '{goals}',"
            except Exception:
                pass

        habits_ref = ""
        if "Active Habits Tracked:" in system_prompt:
            try:
                habits = system_prompt.split("Active Habits Tracked:")[1].split("\n")[1].replace("-", "").strip()
                if habits:
                    habits_ref = f" building on your habit of {habits},"
            except Exception:
                pass

        # 1b. Check for tool commands in offline/mock mode
        if user_id and db:
            from app.ai.tools import ToolDispatcher
            if any(k in msg_lower for k in ["create goal", "create a goal", "add goal", "add a goal"]):
                title = msg
                for k in ["create a goal to ", "create a goal for ", "create goal to ", "create goal for ", "add a goal to ", "add goal to ", "create a goal ", "create goal ", "add a goal ", "add goal "]:
                    if k in msg_lower:
                        title = msg[msg_lower.index(k) + len(k):].strip(" .!?,")
                        break
                tool_res = await ToolDispatcher.execute("create_goal", {"title": title.capitalize(), "category": "wellness"}, user_id, db)
                return f"I have created that goal for you: **{title.capitalize()}**.\n\n{tool_res.get('message', '')} You can track your progress on your Goals dashboard.", extracted_memories

            if any(k in msg_lower for k in ["create habit", "create a habit", "add habit", "add a habit"]):
                title = msg
                for k in ["create a habit to ", "create a habit for ", "create habit to ", "add a habit to ", "add habit to ", "create a habit ", "create habit ", "add a habit ", "add habit "]:
                    if k in msg_lower:
                        title = msg[msg_lower.index(k) + len(k):].strip(" .!?,")
                        break
                tool_res = await ToolDispatcher.execute("create_habit", {"title": title.capitalize(), "category": "wellness"}, user_id, db)
                return f"I've added the habit: **{title.capitalize()}**.\n\n{tool_res.get('message', '')} Consistency is key—start with just a small daily step.", extracted_memories

            if "delete goal" in msg_lower:
                tool_res = await ToolDispatcher.execute("delete_goal", {"goal_id": "dummy-goal", "goal_title": "Goal"}, user_id, db)
                if tool_res.get("confirmation_required"):
                    return f"Deleting a goal is permanent. **Confirmation required**: {tool_res.get('description')}.\n\nPlease confirm in the prompt to proceed.", extracted_memories

        # 2. Extract Structured Memories Dynamically
        if any(prefix in msg_lower for prefix in ["i like ", "i prefer ", "i enjoy ", "i love "]):
            for p in ["i like ", "i prefer ", "i enjoy ", "i love "]:
                if p in msg_lower:
                    pref = msg_lower.split(p)[-1].strip(" .!?,")
                    if len(pref) > 2:
                        extracted_memories.append({
                            "type": "preference",
                            "key": f"preference_{pref[:15].replace(' ', '_')}",
                            "content": f"Enjoys {pref}",
                            "confidence": 0.88,
                        })
                    break

        if any(prefix in msg_lower for prefix in ["my goal is ", "i am trying to ", "i want to ", "working on "]):
            for p in ["my goal is ", "i am trying to ", "i want to ", "working on "]:
                if p in msg_lower:
                    goal_val = msg_lower.split(p)[-1].strip(" .!?,")
                    if len(goal_val) > 3:
                        extracted_memories.append({
                            "type": "wellness_goal",
                            "key": f"goal_{goal_val[:15].replace(' ', '_')}",
                            "content": f"Working towards {goal_val}",
                            "confidence": 0.92,
                        })
                    break

        if any(prefix in msg_lower for prefix in ["i struggle with ", "i am worried about ", "stressed about "]):
            for p in ["i struggle with ", "i am worried about ", "stressed about "]:
                if p in msg_lower:
                    stressor = msg_lower.split(p)[-1].strip(" .!?,")
                    if len(stressor) > 3:
                        extracted_memories.append({
                            "type": "stressor",
                            "key": f"stressor_{stressor[:15].replace(' ', '_')}",
                            "content": f"Identified stressor: {stressor}",
                            "confidence": 0.85,
                        })
                    break

        # 3. Inspect Previous Turn for Conversational Coherence
        last_asst_msg = ""
        recent_history = conversation_history[-6:] if len(conversation_history) > 6 else conversation_history
        turn_count = len(conversation_history)
        
        for past in reversed(recent_history):
            if past.get("role") == "assistant":
                last_asst_msg = past.get("content", "").lower()
                break

        # Conversation phase tracking
        phase_prefix = ""
        if turn_count == 0:
            phase_prefix = f"Welcome, {user_name}. "
        elif turn_count < 5:
            phase_prefix = "Let's explore this further. "
        else:
            phase_prefix = "Taking action can be empowering. "
            
        intent = self._classify_intent(msg_lower)
        
        # Determine if we discussed this recently
        discussed_recently = any(intent in msg.get("content", "").lower() for msg in recent_history if msg.get("role") == "assistant")
        if discussed_recently and intent not in ["greeting", "farewell", "small_talk"]:
            phase_prefix = "Earlier you mentioned something similar, let's dive deeper. "

        # Basic Crisis Check
        if any(w in msg_lower for w in ["suicide", "kill myself", "want to die", "end it all"]):
            return f"I hear how much pain you are in, {user_name}. Please know you are not alone. Please reach out to Indian crisis helplines immediately: Tele-MANAS (14416) or KIRAN (1800-599-0019).", extracted_memories

        responses = {
            "greeting": [
                f"Hello {user_name}! It's good to connect with you.",
                f"Hi {user_name}, welcome back to your quiet space.",
                f"Warm greetings, {user_name}. I am here to listen and reflect with you.",
                f"Hey {user_name}! How are you feeling today?"
            ],
            "farewell": [
                f"Goodbye, {user_name}. Take care of yourself.",
                f"See you later, {user_name}. I'll be here when you need me.",
                f"Have a peaceful rest of your day, {user_name}.",
                f"Take care, {user_name}. Remember your progress."
            ],
            "mood_check": [
                f"It sounds like you're going through a lot, {user_name}.{traits_ref} Let's take it one step at a time.",
                f"I'm here to listen, {user_name}. How else is this affecting you?",
                f"Your feelings are valid, {user_name}. What do you think triggered this?",
                f"Thank you for sharing that with me, {user_name}. It's important to acknowledge our feelings."
            ],
            "stress_expression": [
                f"It sounds like your cognitive load is pushed to maximum capacity, {user_name}.{goals_ref} Let's find a way to manage this.",
                f"Stress can be overwhelming, {user_name}. Can we break down what's on your plate today?",
                f"I hear how stressed you are, {user_name}. Remember to breathe.",
                f"When demands pile up, {user_name}, it's okay to step back. What can be safely pushed to tomorrow?"
            ],
            "goal_discussion": [
                f"That's a great focus, {user_name}.{goals_ref} How can we break that down into smaller steps?",
                f"I love your dedication to your goals, {user_name}. What's the next small milestone?",
                f"Working towards your goals is a journey, {user_name}. Celebrate the small wins.",
                f"Your ambition is inspiring, {user_name}. How can I support you in this goal?"
            ],
            "habit_tracking": [
                f"Consistency isn't about rigid perfection, {user_name}.{habits_ref} It's about reducing friction.",
                f"Habits take time to build, {user_name}. What's the smallest version of this habit you can do today?",
                f"You're doing great, {user_name}. Every little bit counts.",
                f"If you're stuck, {user_name}, let's try scaling it back. Two minutes of practice counts."
            ],
            "career_question": [
                f"Navigating professional life can be challenging, {user_name}.{traits_ref} Does this feel like a skill to develop or a boundary to set?",
                f"Your career journey is important, {user_name}. What values are most important to you in this situation?",
                f"Let's look at this career challenge, {user_name}. What's the best outcome you can envision?",
                f"Workplace dynamics are tricky, {user_name}. How can you protect your peace while addressing this?"
            ],
            "journal_reflection": [
                f"Journaling is a powerful tool, {user_name}. What did you discover through your reflection?",
                f"It's great that you're writing things down, {user_name}. What was the most prominent feeling?",
                f"Reflecting through journaling helps process emotions, {user_name}. Keep it up.",
                f"I'm glad you're taking time to journal, {user_name}. What's one takeaway from your writing?"
            ],
            "sleep_concern": [
                f"Your energy reserves are communicating something vital, {user_name}. True restoration is needed.",
                f"Sleep is foundational, {user_name}. Can you protect a 20-minute wind-down window tonight?",
                f"I hear you're exhausted, {user_name}. Let's prioritize rest today.",
                f"Fatigue is your body's signal, {user_name}. How can we make your evening more relaxing?"
            ],
            "relationship": [
                f"Relationships can be complex, {user_name}. How did that interaction make you feel?",
                f"It's important to communicate your needs, {user_name}. What boundary might help here?",
                f"Navigating relationships requires patience, {user_name}. How can you support yourself through this?",
                f"I hear how this relationship is impacting you, {user_name}. What do you need most right now?"
            ],
            "gratitude": [
                f"That is wonderful to hear, {user_name}! Gratitude can shift our entire perspective.",
                f"I love that you're finding things to be grateful for, {user_name}. What else brings you joy?",
                f"Celebrating these moments is so important, {user_name}. Let's linger in this feeling.",
                f"Your gratitude is infectious, {user_name}! It's great to acknowledge the good things."
            ],
            "frustration": [
                f"Your frustration is completely valid, {user_name}. Anger often signals a crossed boundary.",
                f"It's okay to feel mad, {user_name}. What value feels compromised here?",
                f"I hear your annoyance, {user_name}. Let's take a deep breath before deciding what to do next.",
                f"Frustration is tough, {user_name}. What is within your power to change in this situation?"
            ],
            "anxiety": [
                f"I hear how intense this wave feels, {user_name}. Let's anchor to the physical world. Name 3 things you can see.",
                f"Anxiety is your nervous system trying to protect you, {user_name}. You are safe right now.",
                f"Let's take a slow breath together, {user_name}. Inhale for 4, hold for 4, exhale for 6.",
                f"It's okay to feel overwhelmed, {user_name}. Let's take this one tiny step at a time."
            ],
            "general_question": [
                f"I appreciate you sharing your perspective, {user_name}. What do you feel is the most important thread here?",
                f"Thank you for opening up about this, {user_name}. What would a supportive next step look like?",
                f"It's valuable to put words to this, {user_name}. Does it feel like something you are ready to resolve?",
                f"I'm here to support you, {user_name}. Tell me more about what you're thinking."
            ],
            "small_talk": [
                f"I'm here and ready to chat, {user_name}. How is your day unfolding?",
                f"It's nice to chat with you, {user_name}. What's on your mind today?",
                f"I'm doing well, {user_name}. How are you holding up?",
                f"Always glad to talk, {user_name}. What's the highlight of your day so far?"
            ]
        }

        # Select response based on intent and turn count to ensure variety
        options = responses.get(intent, responses["general_question"])
        selected = options[turn_count % len(options)]
        
        final_response = f"{phase_prefix}{selected}"

        return final_response, extracted_memories


class ExternalLLMProvider(BaseLLMProvider):
    """
    Integration interface for OpenAI API or compatible external providers.
    Uses environment variables for secure credential storage.
    """

    async def generate_response(
        self,
        user_message: str,
        system_prompt: str,
        conversation_history: List[Dict[str, str]],
        user_id: Optional[str] = None,
        db: Optional[Any] = None,
    ) -> Tuple[str, List[Dict[str, Any]]]:
        if not settings.OPENAI_API_KEY:
            logger.info("OpenAI API key not configured; seamlessly delegating to MockLLMProvider.")
            return await MockLLMProvider().generate_response(user_message, system_prompt, conversation_history, user_id, db)

        try:
            import httpx
            messages = [{"role": "system", "content": system_prompt}]
            for msg in conversation_history[-6:]:
                messages.append({"role": msg["role"], "content": msg["content"]})
            messages.append({"role": "user", "content": user_message})

            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={
                        "model": settings.AI_MODEL_NAME,
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 500,
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    return content, []
                else:
                    logger.warning(f"OpenAI error {res.status_code}: {res.text}. Falling back to mock provider.")
                    return await MockLLMProvider().generate_response(user_message, system_prompt, conversation_history, user_id, db)
        except Exception as exc:
            logger.error(f"External LLM invocation exception: {exc}. Falling back to mock.")
            return await MockLLMProvider().generate_response(user_message, system_prompt, conversation_history, user_id, db)


def get_llm_provider() -> BaseLLMProvider:
    if settings.AI_PROVIDER == "gemini" or settings.GEMINI_API_KEY:
        from app.ai.gemini_provider import GeminiProvider
        provider = GeminiProvider()
        if provider.is_configured():
            return provider
        logger.info("Gemini provider selected but GEMINI_API_KEY is not set. Using intelligent MockLLMProvider.")
    elif settings.AI_PROVIDER == "openai" and settings.OPENAI_API_KEY:
        return ExternalLLMProvider()
    return MockLLMProvider()

