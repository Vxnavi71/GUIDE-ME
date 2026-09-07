import re
from typing import Any, Dict, List, Tuple


class SafetyGuardrailEngine:
    """
    Clinical Safety Guardrail Layer.
    Detects critical crisis signals, self-harm risks, and enforces responsible AI boundaries.
    """

    CRISIS_PATTERNS = [
        r"\bsuicid",
        r"\bkill myself\b",
        r"\bend my life\b",
        r"\bwant to die\b",
        r"\bbetter off dead\b",
        r"\bself[- ]harm\b",
        r"\bhurt myself\b",
        r"\bno reason to live\b",
        r"\bcan't go on anymore\b",
    ]

    MEDICAL_DIAGNOSIS_PATTERNS = [
        r"\bdo i have bipolar\b",
        r"\bdiagnose me\b",
        r"\bwhat medication should i take\b",
        r"\bprescribe me\b",
        r"\bam i schizophrenic\b",
    ]

    @classmethod
    def evaluate_message_safety(cls, text: str) -> Dict[str, Any]:
        cleaned = text.lower()

        # 1. Critical Crisis Check
        for pat in cls.CRISIS_PATTERNS:
            if re.search(pat, cleaned):
                return {
                    "is_crisis": True,
                    "severity": "critical",
                    "reason": "Explicit crisis / self-harm indicators detected",
                    "intervention_text": (
                        "I am so sorry you are going through such profound pain right now. "
                        "Because your safety and life are deeply precious, please connect immediately with free, confidential crisis support:\n"
                        "• Tele-MANAS (Govt of India 24/7 Mental Health): Call 14416 or 1800-891-4416\n"
                        "• KIRAN Mental Health Helpline: Call 1800-599-0019 (24/7 Toll-Free)\n"
                        "• Vandrevala Foundation Helpline: Call +91 9999 666 555 (24/7 Free Support)\n"
                        "• National Emergency Services: Call 112\n"
                        "• AASRA Crisis Line: Call +91 98204 66726 (24/7)\n"
                        "• NIMHANS Mental Health Helpline: Call 080-46110007\n\n"
                        "Please reach out to a trusted loved one, doctor, or emergency services right now. You do not have to carry this alone."
                    ),
                }

        # 2. Medical Diagnosis Attempt Check
        for pat in cls.MEDICAL_DIAGNOSIS_PATTERNS:
            if re.search(pat, cleaned):
                return {
                    "is_crisis": False,
                    "is_medical_inquiry": True,
                    "severity": "advisory",
                    "reason": "Attempted clinical diagnostic request",
                    "intervention_text": (
                        "As an AI wellness companion, I cannot provide psychiatric or medical diagnoses, nor can I prescribe treatments. "
                        "I encourage you to speak with a licensed physician or clinical mental health professional for formal diagnostic guidance."
                    ),
                }

        return {
            "is_crisis": False,
            "is_medical_inquiry": False,
            "severity": "normal",
            "reason": "Message passed safety guardrails.",
            "intervention_text": None,
        }
