"""
Multimodal Signal Normalization Pipeline.
Prepares disparate sensor, self-report, and digital metrics into unified scale.
"""
from typing import Dict, Any, List
import numpy as np


class SignalNormalizer:
    @staticmethod
    def min_max_scale(val: float, min_val: float, max_val: float) -> float:
        if max_val <= min_val:
            return 0.5
        scaled = (val - min_val) / (max_val - min_val)
        return float(np.clip(scaled, 0.0, 1.0))

    @classmethod
    def normalize_multimodal_package(cls, raw_signals: Dict[str, Any]) -> Dict[str, float]:
        """
        Normalizes:
        - Mood (1 - 10) -> (0.0 - 1.0)
        - HRV (15 - 120 ms) -> (0.0 - 1.0)
        - Sleep (3 - 12 hours) -> (0.0 - 1.0)
        - Screen Time (0 - 720 min) -> (0.0 - 1.0)
        """
        normalized = {}
        if "mood" in raw_signals and raw_signals["mood"] is not None:
            normalized["norm_mood"] = cls.min_max_scale(raw_signals["mood"], 1.0, 10.0)

        if "hrv" in raw_signals and raw_signals["hrv"] is not None:
            normalized["norm_hrv"] = cls.min_max_scale(raw_signals["hrv"], 15.0, 120.0)

        if "sleep_hours" in raw_signals and raw_signals["sleep_hours"] is not None:
            normalized["norm_sleep"] = cls.min_max_scale(raw_signals["sleep_hours"], 3.0, 12.0)

        if "screen_time" in raw_signals and raw_signals["screen_time"] is not None:
            normalized["norm_screen"] = cls.min_max_scale(raw_signals["screen_time"], 0.0, 720.0)

        return normalized
