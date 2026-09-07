import abc
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class BaseWearableProvider(abc.ABC):
    @abc.abstractmethod
    async def fetch_latest_metrics(self, user_id: str) -> Dict[str, Any]:
        pass

    @abc.abstractmethod
    def get_provider_name(self) -> str:
        pass


class MockWearableProvider(BaseWearableProvider):
    """
    Simulated physiological and wearable provider.
    Explicitly labels all generated values as demonstration data.
    """

    def get_provider_name(self) -> str:
        return "mock_wearable"

    async def fetch_latest_metrics(self, user_id: str) -> Dict[str, Any]:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return {
            "provider": "DEMO MOCK WEARABLE",
            "metric_date": today_str,
            "sleep_hours": 7.4,
            "sleep_quality_score": 82.0,
            "resting_heart_rate": 64.0,
            "hrv_ms": 54.0,
            "step_count": 8240,
            "active_minutes": 42,
            "water_intake_ml": 2200,
            "calories_burned": 2180,
            "distance_km": 5.8,
            "sleep_stages": {
                "deep": 1.6,
                "rem": 1.9,
                "light": 3.4,
                "awake": 0.5,
            },
            "is_simulated_demo": True,
            "device_name": "BioSensor Simulator Pro",
        }


class FitbitProvider(BaseWearableProvider):
    """
    Interface for Fitbit Web API integration (OAuth 2.0 PKCE).
    Requires FITBIT_CLIENT_ID and user authorization token.
    """

    def __init__(self, client_id: str = "", client_secret: str = ""):
        self.client_id = client_id
        self.client_secret = client_secret

    def get_provider_name(self) -> str:
        return "fitbit"

    async def fetch_latest_metrics(self, user_id: str) -> Dict[str, Any]:
        # Production adapter would make authorized HTTP calls to api.fitbit.com/1.2/user/-/sleep
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return {
            "provider": "Fitbit Web API (Interface Ready)",
            "metric_date": today_str,
            "sleep_hours": 7.1,
            "sleep_quality_score": 79.0,
            "resting_heart_rate": 66.0,
            "hrv_ms": 48.0,
            "step_count": 7650,
            "active_minutes": 35,
            "water_intake_ml": 1800,
            "is_simulated_demo": True,
            "device_name": "Fitbit Sense 2",
        }


class AppleHealthProvider(BaseWearableProvider):
    """
    Interface for Apple HealthKit export data ingestion.
    """

    def get_provider_name(self) -> str:
        return "apple_health"

    async def fetch_latest_metrics(self, user_id: str) -> Dict[str, Any]:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return {
            "provider": "Apple HealthKit (Interface Ready)",
            "metric_date": today_str,
            "sleep_hours": 7.6,
            "sleep_quality_score": 85.0,
            "resting_heart_rate": 62.0,
            "hrv_ms": 58.0,
            "step_count": 9100,
            "active_minutes": 45,
            "water_intake_ml": 2400,
            "is_simulated_demo": True,
            "device_name": "Apple Watch Ultra",
        }


class GoogleHealthProvider(BaseWearableProvider):
    """
    Interface for Google Health Connect Android API.
    """

    def get_provider_name(self) -> str:
        return "google_fit"

    async def fetch_latest_metrics(self, user_id: str) -> Dict[str, Any]:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return {
            "provider": "Google Health Connect (Interface Ready)",
            "metric_date": today_str,
            "sleep_hours": 7.2,
            "sleep_quality_score": 80.0,
            "resting_heart_rate": 65.0,
            "hrv_ms": 50.0,
            "step_count": 8000,
            "active_minutes": 38,
            "water_intake_ml": 2000,
            "is_simulated_demo": True,
            "device_name": "Pixel Watch 3",
        }


def get_wearable_provider(provider_type: str = "mock") -> BaseWearableProvider:
    if provider_type == "fitbit":
        return FitbitProvider()
    elif provider_type == "apple_health":
        return AppleHealthProvider()
    elif provider_type == "google_fit":
        return GoogleHealthProvider()
    return MockWearableProvider()
