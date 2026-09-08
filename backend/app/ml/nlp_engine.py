import re
from typing import Any, Dict, List, Tuple


class NLPEmotionJournalEngine:
    """
    Modular Natural Language Processing engine for text sentiment, emotion tagging,
    cognitive thought pattern analysis, and constructive clinical reflection generation.
    """

    POSITIVE_WORDS = {
        "happy", "joy", "peace", "calm", "grateful", "gratitude", "accomplished",
        "proud", "energized", "hope", "hopeful", "excited", "content", "love",
        "loving", "clarity", "progress", "growth", "relaxed", "serene", "thriving",
        "inspired", "balanced", "confident", "supported", "optimistic", "refreshed"
    }

    NEGATIVE_WORDS = {
        "sad", "exhausted", "tired", "stressed", "overwhelmed", "anxious", "anxiety",
        "depressed", "hopeless", "lonely", "angry", "furious", "frustrated",
        "fail", "failure", "failed", "hate", "scared", "fear", "dread", "stuck",
        "panicked", "burnt", "burnout", "guilty", "ashamed", "worthless", "helpless",
        "ruined", "terrible", "horrible", "awful", "bad", "worst", "painful"
    }

    DISTORTION_PATTERNS = [
        (
            "All-or-Nothing Thinking",
            [r"\balways\b", r"\bnever\b", r"\beveryone\b", r"\bno one\b", r"\bcompletely\b", r"\btotal disaster\b"],
            "Notice words like 'always' or 'never'. Life rarely operates in absolutes; consider the middle ground."
        ),
        (
            "Catastrophizing",
            [r"\bruined\b", r"\bend of the world\b", r"\bcan't handle\b", r"\bterrible\b", r"\bworst possible\b"],
            "Your mind may be anticipating the worst-case scenario. What is the most realistic or likely outcome?"
        ),
        (
            "Emotional Reasoning",
            [r"\bi feel like a failure\b", r"\bi feel stupid\b", r"\bi feel hopeless so it must be\b"],
            "Emotions are real feelings, but they are not always objective facts. Treat them as weather passing through."
        ),
        (
            "Overgeneralization",
            [r"\bnothing ever works\b", r"\bi keep messing up\b", r"\bi can never do\b"],
            "A single setback doesn't define your entire journey. Acknowledge what went well today too."
        ),
        (
            "Should / Must Demands",
            [r"\bi should have\b", r"\bi must\b", r"\bi ought to\b"],
            "Rigid 'should' statements generate unnecessary pressure. Can you replace 'I should' with 'I would prefer'?"
        ),
    ]

    @classmethod
    def analyze_text(cls, text: str) -> Dict[str, Any]:
        """
        Extracts sentiment, emotion, distortions, topics, and clinical reflection prompt.
        """
        if not text or not text.strip():
            return {
                "sentiment_score": None,
                "dominant_emotion": "No journal content to analyze",
                "cognitive_distortions": [],
                "topics": [],
                "reflection_prompt": "Start writing your journal entry to receive personalized emotional reflection and cognitive insights.",
                "recommended_action": None,
            }

        cleaned = text.lower()
        # Use a regex that captures words with apostrophes and length >= 2 to include "no"
        words = re.findall(r"\b[a-z']{2,}\b", cleaned)

        pos_hits = 0
        neg_hits = 0
        negation_words = {"not", "no", "never", "neither", "nor", "don't", "doesn't", "didn't", "can't", "won't", "isn't", "aren't", "wasn't", "weren't"}

        for i, w in enumerate(words):
            if w in cls.POSITIVE_WORDS or w in cls.NEGATIVE_WORDS:
                is_negated = any(words[j] in negation_words for j in range(max(0, i - 3), i))
                if w in cls.POSITIVE_WORDS:
                    if is_negated:
                        neg_hits += 1
                    else:
                        pos_hits += 1
                elif w in cls.NEGATIVE_WORDS:
                    if is_negated:
                        pos_hits += 1
                    else:
                        neg_hits += 1

        total_emotional = pos_hits + neg_hits
        if total_emotional > 0:
            sentiment_score = round((pos_hits - neg_hits) / total_emotional, 2)
        else:
            sentiment_score = 0.0

        # Emotion Tagging
        if sentiment_score > 0.3:
            dominant_emotion = "contentment" if "calm" in words or "peace" in words else "joy & hope"
        elif sentiment_score < -0.3:
            if "anxious" in words or "fear" in words or "scared" in words or "overwhelmed" in words:
                dominant_emotion = "anxiety & tension"
            elif "angry" in words or "frustrated" in words:
                dominant_emotion = "frustration"
            else:
                dominant_emotion = "sadness / heaviness"
        else:
            dominant_emotion = "reflective / neutral"

        # Detect Cognitive Distortions
        detected_distortions = []
        distortion_advice = []
        for dist_name, patterns, advice in cls.DISTORTION_PATTERNS:
            for pat in patterns:
                if re.search(pat, cleaned):
                    detected_distortions.append(dist_name)
                    distortion_advice.append(advice)
                    break

        detected_distortions = list(dict.fromkeys(detected_distortions))

        # Topic Extraction
        topics = []
        if any(w in cleaned for w in ["work", "boss", "project", "deadline", "job", "career"]):
            topics.append("career & work")
        if any(w in cleaned for w in ["sleep", "tired", "health", "exercise", "body", "gym", "food"]):
            topics.append("physical health")
        if any(w in cleaned for w in ["friend", "relationship", "family", "partner", "parents"]):
            topics.append("relationships")
        if any(w in cleaned for w in ["stress", "anxious", "overwhelm", "peace", "mind"]):
            topics.append("mental state")
        if not topics:
            topics.append("daily reflection")

        # Construct Granular Emotion & Dynamic Reflection Prompt
        # Extract prominent keywords/concepts for personalizing the reflection prompt
        key_concepts = [w for w in words if len(w) > 4 and w not in cls.POSITIVE_WORDS and w not in cls.NEGATIVE_WORDS][:3]
        concept_str = f" regarding '{key_concepts[0]}'" if key_concepts else ""

        if detected_distortions:
            distortion_name = detected_distortions[0]
            reflection_prompt = f"{distortion_advice[0]} How might you reframe the thought{concept_str} with more self-compassion?"
            recommended_action = "Write down one piece of concrete counter-evidence to the thought causing tension."
        elif "anxiety" in dominant_emotion or "tension" in dominant_emotion:
            reflection_prompt = f"When tension rises{concept_str}, your nervous system is asking for safety. What is one physical anchor in your current environment that feels steady?"
            recommended_action = "Practice the 4-7-8 breathing technique: inhale for 4s, hold for 7s, exhale for 8s."
        elif "frustration" in dominant_emotion:
            reflection_prompt = f"Frustration often signals a boundary was crossed or an expectation unmet{concept_str}. What is within your direct sphere of influence right now?"
            recommended_action = "Write down 2 things you can control and 1 thing you choose to let go of today."
        elif "sadness" in dominant_emotion:
            reflection_prompt = f"It takes courage to acknowledge heaviness{concept_str}. What is one gentle act of comfort or rest you can offer yourself before this evening?"
            recommended_action = "Step away from screens for a warm cup of herbal tea or a 10-minute quiet stretch."
        elif sentiment_score > 0.4:
            reflection_prompt = f"You are experiencing genuine vitality and uplift{concept_str}. What specific intention or habit laid the groundwork for this positive state?"
            recommended_action = "Take 30 seconds to mentally bookmark this feeling as an internal anchor for challenging days."
        elif "contentment" in dominant_emotion or "calm" in words or "peace" in words:
            reflection_prompt = f"Notice this stillness{concept_str}. How does your breath feel in this moment, and how can you carry a sliver of this calm into your next task?"
            recommended_action = "Do a quick body scan from head to toe, releasing any subtle tension held in the jaw or shoulders."
        else:
            reflection_prompt = f"Reflecting on today clarifies your inner narrative{concept_str}. Looking back at what you wrote, what feels most important to remember?"
            recommended_action = "Set one mindful intention for the remainder of the day."

        return {
            "sentiment_score": sentiment_score,
            "dominant_emotion": dominant_emotion,
            "cognitive_distortions": detected_distortions,
            "topics": topics,
            "reflection_prompt": reflection_prompt,
            "recommended_action": recommended_action,
        }

