import base64
import io
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import numpy as np
from PIL import Image

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

logger = logging.getLogger("guideme.facial_analysis")


class FacialAnalysisEngine:
    """
    Privacy-first Facial Analysis Engine.
    Processes frame streams strictly in memory without saving raw video or images.
    Provides probabilistic expression indicators with clear scientific caveats.
    """

    MODEL_VERSION = "v1.2.0-haar-landmark-proxy"

    @classmethod
    def analyze_frame_base64(cls, base64_image_str: str) -> Dict[str, Any]:
        """
        Takes a base64 encoded image frame from the user's browser camera.
        Processes in RAM only, extracting landmark proxies and returning indicators.
        Strictly requires a real face to be present; otherwise returns face_detected=False.
        """
        # Strip header if present (e.g. data:image/jpeg;base64,...)
        if "," in base64_image_str:
            base64_image_str = base64_image_str.split(",", 1)[1]

        try:
            image_bytes = base64.b64decode(base64_image_str)
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            np_img = np.array(image)
        except Exception as exc:
            logger.warning(f"Failed to decode facial frame: {exc}")
            return cls._fallback_response("No face detected — Position your face inside the frame", status="invalid_frame")

        height, width, _ = np_img.shape
        if height < 40 or width < 40:
            return cls._fallback_response("No face detected — Low resolution or poor lighting", status="invalid_frame")

        if not OPENCV_AVAILABLE:
            return cls._fallback_response("Computer vision module unavailable", status="invalid_frame")

        try:
            gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)
            
            # luminance validation
            luminance = float(np.mean(gray))
            contrast = float(np.std(gray))
            lum_norm = min(1.0, luminance / 128.0 if luminance < 128.0 else (255.0 - luminance) / 128.0)
            cont_norm = min(1.0, contrast / 64.0)
            frame_quality = round((lum_norm + cont_norm) / 2.0, 2)
            
            if luminance < 40.0:
                return cls._fallback_response("Frame too dark", status="low_light", frame_quality=frame_quality)
            
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40))

            if len(faces) == 0:
                # Try with slightly more sensitive scaleFactor
                faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(30, 30))
                
            if len(faces) == 0:
                # Fallback to alt2 cascade
                alt2_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml")
                faces = alt2_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40))

            face_count = len(faces)
            if face_count == 0:
                return cls._fallback_response("No face detected — Position your face inside the frame", status="no_face", face_count=0, frame_quality=frame_quality)

            status_code = "multiple_faces" if face_count > 1 else "success"

            # Sort by area to pick largest face
            faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            x, y, w, h = faces[0]
            face_roi_gray = gray[y : y + h, x : x + w]

            # Lower third of face (mouth region proxy)
            mouth_region = face_roi_gray[int(h * 0.65) : h, int(w * 0.2) : int(w * 0.8)]
            # Upper third of face (brow region proxy)
            brow_region = face_roi_gray[int(h * 0.15) : int(h * 0.4), int(w * 0.25) : int(w * 0.75)]
            # Eye region proxy
            eye_region = face_roi_gray[int(h * 0.25) : int(h * 0.5), int(w * 0.15) : int(w * 0.85)]

            # Contrast variance indicates muscular contraction
            mouth_var = float(np.var(mouth_region)) if mouth_region.size > 0 else 0.0
            brow_var = float(np.var(brow_region)) if brow_region.size > 0 else 0.0
            eye_mean = float(np.mean(eye_region)) if eye_region.size > 0 else 128.0

            # Calibrate proxies dynamically from actual pixel regions
            smile_ratio = round(min(1.0, max(0.05, mouth_var / 1300.0)), 2)
            brow_furrow = round(min(1.0, max(0.05, brow_var / 1500.0)), 2)
            eye_aperture = round(min(1.0, max(0.2, eye_mean / 220.0)), 2)

            # Center offset relative to camera frame determines head stability
            face_center_x = x + w / 2.0
            face_center_y = y + h / 2.0
            norm_offset_x = abs(face_center_x - (width / 2.0)) / (width / 2.0)
            norm_offset_y = abs(face_center_y - (height / 2.0)) / (height / 2.0)
            center_deviation = (norm_offset_x + norm_offset_y) / 2.0
            head_stability = round(max(0.4, min(0.98, 1.0 - center_deviation * 0.5)), 2)

            # Confidence is scaled based on face size relative to frame
            face_area_ratio = (w * h) / float(width * height)
            confidence = round(min(0.96, max(0.72, 0.70 + face_area_ratio * 0.8)), 2)

            # Classify expression indicator probabilistically into standard emotion proxies
            if smile_ratio > 0.60 and brow_furrow < 0.40:
                detected_expression = "Smiling / Engaged"
            elif eye_aperture > 0.75 and brow_furrow < 0.35:
                detected_expression = "Surprised / Attentive"
            elif brow_furrow > 0.55 and smile_ratio < 0.30:
                detected_expression = "Tense / Brow Furrowed"
            elif brow_furrow > 0.45 and eye_aperture > 0.65:
                detected_expression = "Apprehensive / Concentrated"
            elif smile_ratio < 0.25 and brow_furrow > 0.40:
                detected_expression = "Fatigued / Low Affect"
            elif eye_aperture < 0.45:
                detected_expression = "Drowsy / Relaxed Gaze"
            else:
                detected_expression = "Calm / Neutral"

            return {
                "status": status_code,
                "face_count": face_count,
                "frame_quality": frame_quality,
                "face_detected": True,
                "detected_expression": detected_expression,
                "confidence": confidence,
                "signals": {
                    "smile_ratio": smile_ratio,
                    "brow_furrow_index": brow_furrow,
                    "eye_aperture": eye_aperture,
                    "head_pose_stability": head_stability,
                },
                "probabilistic_disclaimer": "Experimental wellbeing proxy: facial signals reflect surface muscle tone and lighting; they do NOT constitute medical diagnosis or proof of emotion.",
                "model_version": cls.MODEL_VERSION,
                "analysis_timestamp": datetime.now(timezone.utc),
            }

        except Exception as e:
            logger.warning(f"Face analysis exception: {e}")
            return cls._fallback_response("No face detected — Position your face inside the frame", status="invalid_frame")

    @classmethod
    def _fallback_response(cls, reason: str, status: str = "no_face", face_count: int = 0, frame_quality: float = 0.0) -> Dict[str, Any]:
        return {
            "status": status,
            "face_count": face_count,
            "frame_quality": frame_quality,
            "face_detected": False,
            "detected_expression": reason,
            "confidence": 0.0,
            "signals": None,
            "probabilistic_disclaimer": "Experimental wellbeing proxy: facial signals reflect surface muscle tone and lighting; they do NOT constitute medical diagnosis or proof of emotion.",
            "model_version": cls.MODEL_VERSION,
            "analysis_timestamp": datetime.now(timezone.utc),
        }
