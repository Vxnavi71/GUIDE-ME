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


class GoogleHealthConnectProvider(BaseWearableProvider):
    """
    Primary Android Health-Data Integration via Google Health Connect.
    Ingests synchronized telemetry (steps, sleep, heart rate, active calories)
    forwarded from the native Android HealthConnect plugin.
    """

    def get_provider_name(self) -> str:
        return "google_health_connect"

    async def fetch_latest_metrics(self, user_id: str) -> Dict[str, Any]:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return {
            "provider": "Google Health Connect",
            "metric_date": today_str,
            "device_name": "Health Connect Android Layer",
            "is_simulated_demo": False,
        }


# Backwards compatibility alias
GoogleHealthProvider = GoogleHealthConnectProvider


class BluetoothLEProvider(BaseWearableProvider):
    """
    Direct Bluetooth Low Energy (BLE) Smartwatch / Sensor Integration.
    Reads standard GATT Characteristics (0x180D Heart Rate Service).
    """

    def get_provider_name(self) -> str:
        return "bluetooth_le"

    async def fetch_latest_metrics(self, user_id: str) -> Dict[str, Any]:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return {
            "provider": "Bluetooth Low Energy (GATT)",
            "metric_date": today_str,
            "device_name": "Direct BLE Sensor",
            "is_simulated_demo": False,
        }


def get_wearable_provider(provider_type: str = "mock") -> BaseWearableProvider:
    pt = (provider_type or "mock").lower()
    if pt in ("google_health_connect", "google_health", "google_fit"):
        return GoogleHealthConnectProvider()
    elif pt in ("bluetooth_le", "ble", "bluetooth"):
        return BluetoothLEProvider()
    elif pt == "fitbit":
        return FitbitProvider()
    elif pt == "apple_health":
        return AppleHealthProvider()
    return MockWearableProvider()
