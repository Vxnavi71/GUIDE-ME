from typing import Any, Dict, List, Optional


class AIContextBuilder:
    """
    Fuses multimodal context for the AI Companion:
    - User Profile & Preferred Name
    - Big Five personality traits
    - Current stress risk band & mood
    - Active wellness and career goals
    - Transparent user-consented long-term memories
    """

    @classmethod
    def assemble_system_prompt(
        cls,
        user_name: str,
        personality_summary: Optional[str] = None,
        dominant_traits: Optional[List[str]] = None,
        current_mood_score: Optional[float] = None,
        stress_risk_band: Optional[str] = None,
        active_goals: Optional[List[str]] = None,
        active_habits: Optional[List[str]] = None,
        recent_journal_themes: Optional[List[str]] = None,
        sleep_hours: Optional[float] = None,
        screen_time_hours: Optional[float] = None,
        active_memories: Optional[List[str]] = None,
    ) -> str:
        prompt_parts = [
            "You are GUIDE ME's AI Companion, an empathetic, evidence-informed, and calm personal wellness guide.",
            f"You are speaking with {user_name}.",
            "Design Philosophy: Grounded in positive psychology, non-judgmental active listening, and sustainable calm.",
            "Rules & Tone:",
            "- Speak warmly, concisely, and with genuine curiosity. Use markdown formatting for clarity.",
            "- Never fabricate clinical or psychiatric diagnoses. You are a companion, not a medical doctor.",
            "- Validate emotions before proposing gentle micro-actions.",
            "- Maintain user agency: offer suggestions as supportive invitations rather than rigid directives.",
            "- You have access to real GuideMe platform tools: creating goals, updating goals, deleting goals, creating habits, completing habits, logging journals, logging moods, and querying metrics. When the user asks you to take any of these actions, call the matching tool.",
            "- Deleting goals or habits is a destructive action that requires user confirmation. The system will prompt the user to confirm.",
            "- If the user expresses extreme distress or thoughts of self-harm, express deep empathy and recommend immediate Indian crisis helplines: Tele-MANAS (14416), KIRAN (1800-599-0019), or 112.",
        ]

        if personality_summary:
            prompt_parts.append(f"\nUser Personality Profile:\n- Dominant Traits: {', '.join(dominant_traits or ['Balanced profile'])}")
            prompt_parts.append(f"- Psychometric Narrative: {personality_summary}")

        context_lines = []
        if current_mood_score is not None:
            context_lines.append(f"- Self-reported Mood: {current_mood_score}/10")
        if stress_risk_band:
            context_lines.append(f"- Multimodal Stress Band: {stress_risk_band}")
        if sleep_hours is not None:
            context_lines.append(f"- Recorded Sleep: {sleep_hours} hours")
        if screen_time_hours is not None:
            context_lines.append(f"- Screen Time: {screen_time_hours} hours")
        if recent_journal_themes:
            context_lines.append(f"- Recent Journal Topics/Feelings: {', '.join(recent_journal_themes)}")

        if context_lines:
            prompt_parts.append("\nToday's Wellbeing Context:\n" + "\n".join(context_lines))

        if active_habits:
            prompt_parts.append(f"\nActive Habits Tracked:\n" + "\n".join([f"- {h}" for h in active_habits]))

        if active_goals:
            prompt_parts.append(f"\nActive Goals Being Pursued:\n" + "\n".join([f"- {g}" for g in active_goals]))

        if active_memories:
            prompt_parts.append(f"\nRemembered Preferences & Context (Explicitly consented by user):\n" + "\n".join([f"- {m}" for m in active_memories]))

        return "\n".join(prompt_parts)

