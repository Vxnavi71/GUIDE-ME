from typing import Any, Dict, List, Tuple


class OceanBigFiveEngine:
    """
    Psychometric Scoring & Interpretation Engine for the Big Five (OCEAN) Personality Inventory.
    Based on validated International Personality Item Pool (IPIP) 50-item representation.
    """

    TRAITS = [
        "openness",
        "conscientiousness",
        "extraversion",
        "agreeableness",
        "neuroticism",
    ]

    QUESTIONS_DATA = [
        # Extraversion
        {"trait": "extraversion", "text": "I am the life of the party.", "reverse": False},
        {"trait": "extraversion", "text": "I don't talk a lot.", "reverse": True},
        {"trait": "extraversion", "text": "I feel comfortable around people.", "reverse": False},
        {"trait": "extraversion", "text": "I keep in the background.", "reverse": True},
        {"trait": "extraversion", "text": "I start conversations with new acquaintances.", "reverse": False},
        {"trait": "extraversion", "text": "I have little to say in large groups.", "reverse": True},
        {"trait": "extraversion", "text": "I talk to a lot of different people at parties.", "reverse": False},
        {"trait": "extraversion", "text": "I don't like to draw attention to myself.", "reverse": True},
        {"trait": "extraversion", "text": "I don't mind being the center of attention.", "reverse": False},
        {"trait": "extraversion", "text": "I am quiet around strangers.", "reverse": True},

        # Agreeableness
        {"trait": "agreeableness", "text": "I feel little concern for others.", "reverse": True},
        {"trait": "agreeableness", "text": "I am interested in people and their stories.", "reverse": False},
        {"trait": "agreeableness", "text": "I insult or judge people quickly.", "reverse": True},
        {"trait": "agreeableness", "text": "I sympathize with others' feelings.", "reverse": False},
        {"trait": "agreeableness", "text": "I am not interested in other people's problems.", "reverse": True},
        {"trait": "agreeableness", "text": "I have a soft heart for those in need.", "reverse": False},
        {"trait": "agreeableness", "text": "I am not really interested in others.", "reverse": True},
        {"trait": "agreeableness", "text": "I take time out for others.", "reverse": False},
        {"trait": "agreeableness", "text": "I feel others' emotions deeply.", "reverse": False},
        {"trait": "agreeableness", "text": "I make people feel at ease.", "reverse": False},

        # Conscientiousness
        {"trait": "conscientiousness", "text": "I am always prepared for commitments.", "reverse": False},
        {"trait": "conscientiousness", "text": "I leave my belongings around.", "reverse": True},
        {"trait": "conscientiousness", "text": "I pay attention to details.", "reverse": False},
        {"trait": "conscientiousness", "text": "I make a mess of things when rushed.", "reverse": True},
        {"trait": "conscientiousness", "text": "I get chores and duties done right away.", "reverse": False},
        {"trait": "conscientiousness", "text": "I often forget to put things back in their proper place.", "reverse": True},
        {"trait": "conscientiousness", "text": "I like order and regular schedules.", "reverse": False},
        {"trait": "conscientiousness", "text": "I shirk my duties occasionally.", "reverse": True},
        {"trait": "conscientiousness", "text": "I follow a schedule systematically.", "reverse": False},
        {"trait": "conscientiousness", "text": "I am exacting and thorough in my work.", "reverse": False},

        # Neuroticism (Emotional Stability inverted)
        {"trait": "neuroticism", "text": "I get stressed out easily.", "reverse": False},
        {"trait": "neuroticism", "text": "I am relaxed most of the time.", "reverse": True},
        {"trait": "neuroticism", "text": "I worry about things frequently.", "reverse": False},
        {"trait": "neuroticism", "text": "I seldom feel blue or depressed.", "reverse": True},
        {"trait": "neuroticism", "text": "I am easily disturbed by sudden changes.", "reverse": False},
        {"trait": "neuroticism", "text": "I get upset easily by criticism.", "reverse": False},
        {"trait": "neuroticism", "text": "I change my mood a lot.", "reverse": False},
        {"trait": "neuroticism", "text": "I have frequent mood swings.", "reverse": False},
        {"trait": "neuroticism", "text": "I get irritated easily.", "reverse": False},
        {"trait": "neuroticism", "text": "I often feel overwhelmed by demands.", "reverse": False},

        # Openness to Experience
        {"trait": "openness", "text": "I have a rich vocabulary and love learning.", "reverse": False},
        {"trait": "openness", "text": "I have difficulty understanding abstract ideas.", "reverse": True},
        {"trait": "openness", "text": "I have a vivid imagination.", "reverse": False},
        {"trait": "openness", "text": "I am not interested in abstract or philosophical ideas.", "reverse": True},
        {"trait": "openness", "text": "I have excellent ideas and creative solutions.", "reverse": False},
        {"trait": "openness", "text": "I do not have a good imagination.", "reverse": True},
        {"trait": "openness", "text": "I am quick to understand new concepts.", "reverse": False},
        {"trait": "openness", "text": "I use difficult words and explore deep concepts.", "reverse": False},
        {"trait": "openness", "text": "I spend time reflecting on things and philosophy.", "reverse": False},
        {"trait": "openness", "text": "I am full of ideas and artistic curiosity.", "reverse": False},
    ]

    @classmethod
    def build_fallback_questions_map(cls) -> Dict[str, Dict[str, Any]]:
        """
        Mirrors the synthetic ids issued by GET /assessments/ocean/questions when no seeded
        assessment row exists, so scoring stays correct on an unseeded database.
        """
        return {
            f"q-{i + 1}": {
                "domain_trait": q["trait"],
                "reverse_scored": q["reverse"],
            }
            for i, q in enumerate(cls.QUESTIONS_DATA)
        }

    @classmethod
    def calculate_scores(
        cls,
        answers: List[Dict[str, Any]],
        questions_map: Dict[str, Dict[str, Any]],
    ) -> Dict[str, float]:
        """
        Computes trait percentages (0.0 to 100.0) from Likert scale answers (1 to 5).
        Handles reverse scoring: score = 6 - answer.
        """
        raw_sums = {t: 0 for t in cls.TRAITS}
        counts = {t: 0 for t in cls.TRAITS}

        # The questions endpoint falls back to the in-memory bank ("q-1".."q-50") whenever the
        # database has no seeded assessment. Without a matching fallback here every answer was
        # silently dropped and each trait defaulted to 50.0, so the inventory returned a flat
        # profile no matter what the user answered.
        fallback_map = cls.build_fallback_questions_map()

        for index, item in enumerate(answers):
            qid = item["question_id"]
            val = int(item["score_value"])
            q_info = questions_map.get(qid) or fallback_map.get(qid)

            # Last resort: fall back to the item's position in the canonical 50-item bank.
            if not q_info and index < len(cls.QUESTIONS_DATA):
                canonical = cls.QUESTIONS_DATA[index]
                q_info = {
                    "domain_trait": canonical["trait"],
                    "reverse_scored": canonical["reverse"],
                }

            if not q_info:
                continue

            trait = q_info["domain_trait"].lower()
            if trait not in raw_sums:
                continue

            effective_val = (6 - val) if q_info["reverse_scored"] else val
            raw_sums[trait] += effective_val
            counts[trait] += 1

        scores = {}
        for trait in cls.TRAITS:
            n = counts[trait]
            if n > 0:
                # Raw average is between 1.0 and 5.0 -> map to 0 - 100%
                avg = raw_sums[trait] / n
                pct = round(((avg - 1.0) / 4.0) * 100.0, 1)
                scores[trait] = max(0.0, min(100.0, pct))
            else:
                scores[trait] = 50.0

        return scores

    @classmethod
    def interpret_profile(cls, scores: Dict[str, float]) -> Tuple[List[str], str, List[str]]:
        """
        Generates dominant traits, personalized developmental narrative, and career pathways.
        """
        dominant = []
        descriptions = []
        careers = []

        # Openness
        o = scores.get("openness", 50.0)
        if o >= 65:
            dominant.append("High Openness")
            descriptions.append("You demonstrate strong intellectual curiosity, creativity, and appetite for novel perspectives.")
            careers.extend(["Design Architect", "Creative Director", "Data Science Researcher", "Strategic Consultant"])
        elif o <= 35:
            descriptions.append("You prefer pragmatic, proven methodologies and concrete, practical solutions.")
            careers.extend(["Operations Specialist", "Financial Analyst", "Logistics Coordinator"])
        else:
            descriptions.append("You balance practical realism with an openness to exploring new innovations.")

        # Conscientiousness
        c = scores.get("conscientiousness", 50.0)
        if c >= 65:
            dominant.append("High Conscientiousness")
            descriptions.append("You display high persistence, systematic planning, and meticulous attention to excellence.")
            careers.extend(["Technical Program Manager", "Systems Architect", "Lead Developer", "Clinical Specialist"])
        elif c <= 35:
            descriptions.append("You are spontaneous and flexible, excelling in dynamic, evolving environments.")
            careers.extend(["Agile Coach", "Creative Entrepreneur", "Crisis Responder"])
        else:
            descriptions.append("You maintain solid reliability while remaining adaptable to fluid priorities.")

        # Extraversion
        e = scores.get("extraversion", 50.0)
        if e >= 65:
            dominant.append("High Extraversion")
            descriptions.append("You derive energy from interpersonal collaboration, leadership, and group dialogue.")
            careers.extend(["Team Lead", "Product Manager", "Client Solutions Executive"])
        elif e <= 35:
            dominant.append("Introverted Focus")
            descriptions.append("You recharge through introspective focus, deep solitary concentration, and quiet spaces.")
            careers.extend(["Core Engine Developer", "Quantitative Researcher", "Specialist Writer"])
        else:
            descriptions.append("You adapt smoothly between collaborative group settings and independent deep work.")

        # Agreeableness
        a = scores.get("agreeableness", 50.0)
        if a >= 65:
            dominant.append("High Agreeableness")
            descriptions.append("You naturally cultivate psychological safety, empathetic support, and cooperative consensus.")
            careers.extend(["People Operations", "Healthcare Advocate", "Community Director"])
        elif a <= 35:
            descriptions.append("You are candid, competitive, and challenge assumptions without being deterred by consensus.")
            careers.extend(["Quality Assurance Lead", "Security Auditor", "Arbitrator"])
        else:
            descriptions.append("You balance cordial empathy with necessary constructive candor.")

        # Neuroticism (Emotional Reactivity)
        n = scores.get("neuroticism", 50.0)
        if n >= 65:
            dominant.append("High Emotional Sensitivity")
            descriptions.append("You possess keen emotional antennas and heightened vigilance, benefiting from structured mindfulness.")
        elif n <= 35:
            dominant.append("High Emotional Resilience")
            descriptions.append("You maintain calm stability under acute stress, anchoring teams through ambiguity.")
        else:
            descriptions.append("You experience normal situational emotional variance with healthy recovery baselines.")

        analysis_summary = " ".join(descriptions)
        # Deduplicate careers
        unique_careers = list(dict.fromkeys(careers))[:5]
        if not unique_careers:
            unique_careers = ["Product Consultant", "Systems Analyst", "UX Researcher"]

        return dominant, analysis_summary, unique_careers
