from typing import Any, Dict, List, Optional
import numpy as np


class PersonalBaselineCalculator:
    """
    Core GUIDE ME principle: Calculates personal historical baselines.
    Rather than judging against generic population standards, evaluates
    current signals against the individual's rolling history.
    """

    @staticmethod
    def calculate_deviation(current_val: float, historical_vals: List[float]) -> Dict[str, float]:
        """
        Calculates personal baseline mean, std dev, and z-score deviation.
        """
        if not historical_vals or len(historical_vals) < 2:
            return {
                "baseline_mean": round(current_val, 2),
                "baseline_std": 1.0,
                "z_score": 0.0,
                "percentage_change": 0.0,
            }

        arr = np.array(historical_vals, dtype=float)
        mean = float(np.mean(arr))
        std = float(np.std(arr))
        if std == 0:
            std = 1.0

        z_score = (current_val - mean) / std
        pct_change = ((current_val - mean) / mean * 100.0) if mean != 0 else 0.0

        return {
            "baseline_mean": round(mean, 2),
            "baseline_std": round(std, 2),
            "z_score": round(z_score, 2),
            "percentage_change": round(pct_change, 1),
        }


class StressDistressEngine:
    """
    Multimodal Stress & Distress Fusion Engine.
    Combines physiological, behavioral, self-report, and digital signals.
    Emphasizes probabilistic non-diagnostic clinical guidance.
    """

    @classmethod
    def evaluate_stress(
        cls,
        self_report_mood: Optional[float] = None,  # 1.0 (lowest) to 10.0 (highest)
        hrv_ms: Optional[float] = None,             # e.g., 20 - 100 ms
        sleep_hours: Optional[float] = None,        # e.g., 4 - 10 hrs
        screen_time_minutes: Optional[int] = None,  # e.g., 60 - 600 min
        sentiment_score: Optional[float] = None,    # -1.0 to 1.0
        backspace_rate: Optional[float] = None,     # typing hesitation proxy
        historical_stress_scores: Optional[List[float]] = None,
    ) -> Dict[str, Any]:
        """
        Calculates composite stress score (0 to 100), risk band, confidence, and evidence.
        """
        evidence: Dict[str, Any] = {}
        weighted_components = []

        # 1. Self-report mood component (weight: 0.35)
        if self_report_mood is not None:
            # Mood 10 -> stress 0; Mood 1 -> stress 100
            mood_stress = max(0.0, min(100.0, (10.0 - self_report_mood) * 11.11))
            weighted_components.append((mood_stress, 0.35))
            evidence["self_report"] = f"Self-reported mood ({self_report_mood}/10) indicates stress index of {round(mood_stress)}/100"

        # 2. Physiological HRV component (weight: 0.25)
        if hrv_ms is not None:
            # Lower HRV often corresponds with sympathetic activation / stress load
            if hrv_ms < 30:
                hrv_stress = 80.0
            elif hrv_ms < 50:
                hrv_stress = 50.0
            else:
                hrv_stress = 20.0
            weighted_components.append((hrv_stress, 0.25))
            evidence["autonomic_hrv"] = f"Heart rate variability ({hrv_ms}ms) physiological stress load: {round(hrv_stress)}/100"

        # 3. Sleep Deficit component (weight: 0.15)
        if sleep_hours is not None:
            if sleep_hours < 6.0:
                sleep_stress = min(90.0, (7.5 - sleep_hours) * 35.0 + 30.0)
            elif sleep_hours > 9.5:
                sleep_stress = 40.0
            else:
                sleep_stress = 15.0
            weighted_components.append((sleep_stress, 0.15))
            evidence["sleep_duration"] = f"Recorded sleep ({sleep_hours}h) contributes stress load of {round(sleep_stress)}/100"

        # 4. Digital Load / Screen Time component (weight: 0.15)
        if screen_time_minutes is not None:
            if screen_time_minutes > 360:  # > 6 hours
                screen_stress = min(85.0, 40.0 + (screen_time_minutes - 360) / 10.0)
            else:
                screen_stress = max(10.0, screen_time_minutes / 12.0)
            weighted_components.append((screen_stress, 0.15))
            evidence["digital_wellbeing"] = f"Screen exposure ({screen_time_minutes}m) stress load: {round(screen_stress)}/100"

        # 5. Sentiment component (weight: 0.10)
        if sentiment_score is not None:
            # -1.0 -> 100, +1.0 -> 0
            sentiment_stress = max(0.0, min(100.0, (1.0 - sentiment_score) * 50.0))
            weighted_components.append((sentiment_stress, 0.10))
            evidence["journal_sentiment"] = f"Language sentiment ({sentiment_score}) mapped to stress index: {round(sentiment_stress)}/100"

        # If no signals available, return uncalibrated state with explicit guidance
        if not weighted_components:
            return {
                "score": None,
                "confidence": 0.0,
                "risk_band": None,
                "evidence": {"status": "Not enough data yet — log mood, sleep, journal, or sync wearables to assess stress."},
                "source": "uncalibrated",
                "deviation_from_baseline": None,
                "baseline_mean": None,
                "insufficient_data": True,
                "disclaimer": "Stress scores are probabilistic estimates intended for lifestyle self-awareness, not medical diagnoses.",
            }

        total_weight = sum(w for _, w in weighted_components)
        composite_score = sum(val * w for val, w in weighted_components) / total_weight
        confidence = min(0.95, 0.50 + 0.10 * len(weighted_components))
        composite_score = round(composite_score, 1)

        # Determine Risk Band
        if composite_score < 30.0:
            risk_band = "low"
        elif composite_score < 60.0:
            risk_band = "moderate"
        elif composite_score < 80.0:
            risk_band = "elevated"
        else:
            risk_band = "critical"

        # Personal Baseline Deviation from actual historical data
        baseline_stats = PersonalBaselineCalculator.calculate_deviation(
            composite_score,
            historical_stress_scores or [],
        )

        return {
            "score": composite_score,
            "confidence": round(confidence, 2),
            "risk_band": risk_band,
            "evidence": evidence,
            "source": "multimodal",
            "deviation_from_baseline": baseline_stats["z_score"],
            "baseline_mean": baseline_stats["baseline_mean"],
            "insufficient_data": False,
            "disclaimer": "Stress scores are probabilistic estimates intended for lifestyle self-awareness, not medical diagnoses.",
        }
