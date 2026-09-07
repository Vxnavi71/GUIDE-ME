from typing import Any, Dict, List, Optional


class RecommendationEngine:
    """
    Intelligent Recommendation Engine.
    Fuses multimodal wellness, digital screen loads, stress deviation, and personality traits.
    """

    @classmethod
    def generate_recommendations(
        cls,
        stress_risk_band: str = "moderate",
        sleep_hours: float = 7.0,
        screen_time_minutes: int = 240,
        dominant_traits: Optional[List[str]] = None,
        active_goal_count: int = 2,
    ) -> List[Dict[str, Any]]:
        recs = []

        # 1. Stress-specific intervention
        if stress_risk_band in ["elevated", "critical"]:
            recs.append({
                "category": "mindfulness",
                "title": "4-7-8 Parasympathetic Reset",
                "description": "Engage in four rounds of 4-7-8 rhythmic breathing to stimulate vagal tone and ease acute tension.",
                "reason": f"Your current stress index is in the {stress_risk_band} band.",
                "evidence": {"risk_band": stress_risk_band, "recommended_duration": "4 minutes"},
                "priority": "high",
                "confidence": 0.94,
                "action_url": "/dashboard/stress",
            })
        else:
            recs.append({
                "category": "mindfulness",
                "title": "Daily Reflection Pause",
                "description": "Take 3 minutes at midday to check in with your emotional baseline and physical posture.",
                "reason": "Maintaining consistent preventative self-awareness preserves emotional stability.",
                "evidence": {"preventative_wellness": True},
                "priority": "low",
                "confidence": 0.88,
                "action_url": "/dashboard/journal",
            })

        # 2. Digital screen load intervention
        if screen_time_minutes > 300:
            recs.append({
                "category": "digital_wellbeing",
                "title": "20-20-20 Visual Rest & Screen Curfew",
                "description": "Every 20 minutes, gaze 20 feet away for 20 seconds. Institute an evening screen curfew 45m before sleep.",
                "reason": f"Digital screen time reached {round(screen_time_minutes / 60, 1)} hours today.",
                "evidence": {"screen_time_minutes": screen_time_minutes, "threshold": 300},
                "priority": "medium",
                "confidence": 0.91,
                "action_url": "/dashboard/digital-wellbeing",
            })

        # 3. Sleep hygiene
        if sleep_hours < 6.5:
            recs.append({
                "category": "sleep",
                "title": "Prioritize Circadian Recovery",
                "description": "Tonight, dim overhead lights 1 hour before bed and avoid caffeine after 2:00 PM.",
                "reason": f"Recorded sleep duration was {sleep_hours}h, below optimal regenerative range.",
                "evidence": {"sleep_hours": sleep_hours, "target_hours": 7.5},
                "priority": "high",
                "confidence": 0.93,
                "action_url": "/dashboard/wellness",
            })

        # 4. Personality-aligned career/growth suggestion
        traits = dominant_traits or []
        if any("Openness" in t for t in traits):
            recs.append({
                "category": "career",
                "title": "Cross-Disciplinary Exploration",
                "description": "Spend 20 minutes exploring an emerging domain outside your daily tasks to fuel your creative openness.",
                "reason": "High Openness thrives on intellectual novelty and creative synthesis.",
                "evidence": {"trait": "High Openness"},
                "priority": "medium",
                "confidence": 0.86,
                "action_url": "/dashboard/career",
            })
        elif any("Conscientiousness" in t for t in traits):
            recs.append({
                "category": "focus",
                "title": "Structured Milestone Breakdown",
                "description": "Group your weekly objectives into three high-leverage deliverables to optimize workflow.",
                "reason": "High Conscientiousness benefits from organized systematic progress.",
                "evidence": {"trait": "High Conscientiousness"},
                "priority": "medium",
                "confidence": 0.89,
                "action_url": "/dashboard/goals",
            })

        # 5. Goal momentum
        if active_goal_count == 0:
            recs.append({
                "category": "wellness",
                "title": "Define an Intentional Micro-Goal",
                "description": "Select one modest, meaningful daily habit to build self-efficacy.",
                "reason": "Setting clear personal intentions enhances daily purpose and satisfaction.",
                "evidence": {"active_goal_count": 0},
                "priority": "low",
                "confidence": 0.82,
                "action_url": "/dashboard/goals",
            })

        return recs
