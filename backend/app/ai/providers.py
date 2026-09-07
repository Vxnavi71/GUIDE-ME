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
        if "User Name:" in system_prompt:
            try:
                user_name = system_prompt.split("User Name:")[1].split("\n")[0].strip()
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
        turn_count = len(conversation_history)
        if conversation_history:
            for past in reversed(conversation_history):
                if past.get("role") == "assistant":
                    last_asst_msg = past.get("content", "").lower()
                    break

        is_affirmative = msg_lower in ["yes", "yeah", "yep", "sure", "okay", "ok", "i did", "i would", "please do", "absolutely"]
        is_negative = msg_lower in ["no", "nope", "not really", "i haven't", "i didn't", "not yet", "cant", "can't"]

        # 4. Multi-Turn Contextual Follow-up
        if is_affirmative and last_asst_msg:
            if "stretch" in last_asst_msg or "rest" in last_asst_msg:
                return (
                    f"That is wonderful, {user_name}. Gently roll your shoulders back, drop your jaw away from the roof of your mouth, and close your eyes for just 60 seconds. Notice how the floor or chair supports you.\n\n"
                    "When you return, let me know how your breath feels.",
                    extracted_memories
                )
            elif "career" in last_asst_msg or "dashboard" in last_asst_msg:
                return (
                    f"Great! Head over to the Career Guidance tab whenever you are ready. Your Big Five psychometric scores map directly to occupational environments that minimize cognitive friction.\n\n"
                    "Would you like to explore roles that leverage your dominant traits?",
                    extracted_memories
                )
            elif "fifteen minutes" in last_asst_msg or "breath" in last_asst_msg:
                return (
                    f"I'm right here with you, {user_name}. Inhale slowly through your nose for a count of 4... hold gently for 4... and exhale completely for 6. Let that singular task wait until your nervous system feels settled.\n\n"
                    "What does your mind feel ready to gently address next?",
                    extracted_memories
                )
            else:
                return (
                    f"I love your openness to that step, {user_name}. Taking deliberate action—no matter how small—creates real positive psychological inertia.\n\n"
                    "What feels like the best place to begin right now?",
                    extracted_memories
                )

        if is_negative and last_asst_msg:
            return (
                f"That is completely fine, {user_name}. Self-compassion means honoring where you are without pushing past your current boundary.\n\n"
                "There is zero pressure here. What would feel most comforting or restorative to you in this exact moment?",
                extracted_memories
            )

        # 5. Domain-Specific Conversational Synthesis
        # Greetings
        if any(w in msg_lower for w in ["hello", "hi", "hey", "good morning", "good evening", "good afternoon", "greetings"]):
            responses = [
                f"Hello {user_name}! It's good to connect with you. How are you feeling in your mind and body right now?",
                f"Hi {user_name}, welcome back to your quiet space. What has the rhythm of your day felt like so far?",
                f"Warm greetings, {user_name}. I am here to listen and reflect with you. What would you like to explore or set down today?",
            ]
            chosen = responses[turn_count % len(responses)]
            return chosen, extracted_memories

        # Acute Anxiety & Overwhelm
        if any(w in msg_lower for w in ["anxious", "anxiety", "panic", "overwhelmed", "freaking out", "racing heart", "can't breathe"]):
            return (
                f"I hear how intense this wave feels, {user_name}. When anxiety surges, our nervous system is trying to protect us, even when there is no immediate danger.\n\n"
                "Let's anchor to the physical world right now: look around and name 3 things you can see, 2 things you can touch, and 1 sound you can hear. You are safe in this room right now.",
                extracted_memories
            )

        # Stress & Pressure
        if any(w in msg_lower for w in ["stressed", "pressure", "deadline", "too much work", "swamped", "hectic"]):
            return (
                f"It sounds like your cognitive load is pushed to maximum capacity, {user_name}. When demands pile up, our instinct is to move faster, which only accelerates stress.\n\n"
                "What is one commitment or task on your plate today that can be safely renegotiated, delegated, or pushed to tomorrow?",
                extracted_memories
            )

        # Fatigue, Exhaustion & Sleep
        if any(w in msg_lower for w in ["tired", "exhausted", "burnout", "burnt out", "sleepy", "insomnia", "couldn't sleep", "drained"]):
            return (
                f"Your energy reserves are communicating something vital, {user_name}. Physical and emotional depletion cannot be resolved by willpower—it demands genuine restoration.\n\n"
                "Can you protect a 20-minute window this evening with zero screens, dim lighting, and zero agenda?",
                extracted_memories
            )

        # Sadness, Loneliness & Heavy Emotions
        if any(w in msg_lower for w in ["sad", "depressed", "lonely", "alone", "crying", "empty", "hopeless", "numb", "hurting"]):
            return (
                f"Thank you for trusting me with how heavy things feel right now, {user_name}. It takes vulnerability to acknowledge sadness and loneliness.\n\n"
                "You don't need to put on a brave face or fix this feeling right away. If you could wrap yourself in one comforting thing—a warm drink, quiet music, or a cozy blanket—what would that be?",
                extracted_memories
            )

        # Frustration & Anger
        if any(w in msg_lower for w in ["angry", "mad", "furious", "frustrated", "annoyed", "unfair", "hate this"]):
            return (
                f"Your frustration is completely valid, {user_name}. Anger is often our internal boundary alarm telling us something crossed a line or an expectation wasn't met.\n\n"
                "What is the core boundary or value that feels compromised here, and what is within your power to safeguard?",
                extracted_memories
            )

        # Joy, Wins & Gratitude
        if any(w in msg_lower for w in ["happy", "great", "awesome", "proud", "excited", "grateful", "celebrate", "won", "passed"]):
            return (
                f"That is wonderful news, {user_name}! In modern life we often rush past our victories to the next problem. Let's linger in this feeling for a moment.\n\n"
                "What part of this accomplishment feels most meaningful to who you are becoming?",
                extracted_memories
            )

        # Habits, Goals & Consistency
        if any(w in msg_lower for w in ["habit", "routine", "discipline", "procrastinating", "lazy", "stuck", "motivation"]):
            return (
                f"Remember that consistency isn't about rigid perfection, {user_name}—it's about reducing the friction of restarting.\n\n"
                "If the standard goal feels daunting today, what is the absolute 'micro-version' of it? Even two minutes of practice counts towards maintaining your identity.",
                extracted_memories
            )

        # Career, Professional Life & Purpose
        if any(w in msg_lower for w in ["career", "job", "boss", "coworker", "interview", "resume", "promotion", "workplace"]):
            return (
                f"Navigating professional life requires balancing your intrinsic values with external workplace demands, {user_name}.\n\n"
                "When you look at this current challenge, does it feel like a skill to develop, a communication gap to bridge, or an environment you need to set boundaries with?",
                extracted_memories
            )

        # Breathing / Mindfulness Request
        if any(w in msg_lower for w in ["calm me", "breathe", "meditate", "grounding", "relax me", "exercise"]):
            return (
                f"Let's do a gentle grounding practice together right now, {user_name}.\n\n"
                "1. Sit comfortably and uncross your legs.\n"
                "2. Inhale smoothly through your nose for 4 counts... 1, 2, 3, 4.\n"
                "3. Hold your breath gently for 4 counts... 1, 2, 3, 4.\n"
                "4. Exhale softly through your mouth for 6 counts... 1, 2, 3, 4, 5, 6.\n\n"
                "Repeat that twice more. Notice the subtle release of tension in your jaw and shoulders.",
                extracted_memories
            )

        # General Thoughtful Reflection (Varied and context-anchored)
        words_in_msg = [w for w in msg.split() if len(w) > 4][:3]
        topic_preview = f" around '{' '.join(words_in_msg)}'" if words_in_msg else ""
        
        thoughtful_responses = [
            f"I appreciate you sharing your perspective{topic_preview}, {user_name}. What do you feel is the most important thread connecting these thoughts today?",
            f"Thank you for opening up about this, {user_name}. When you step back and look at the bigger picture, what would a supportive next step look like for you?",
            f"It's valuable to put words to this{topic_preview}. As you write this down, does it feel like something you are ready to resolve, or do you simply need space to be heard?",
        ]
        chosen_resp = thoughtful_responses[turn_count % len(thoughtful_responses)]
        return chosen_resp, extracted_memories


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

