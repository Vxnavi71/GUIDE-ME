import { Capacitor, registerPlugin } from '@capacitor/core';

export interface UsageStatsPluginInterface {
  hasUsagePermission(): Promise<{ granted: boolean }>;
  requestUsagePermission(): Promise<void>;
  queryDailyUsage(): Promise<{
    total_screen_time_minutes: number;
    focus_time_minutes: number;
    categories: {
      productive: number;
      communication: number;
      entertainment_distraction: number;
      utility: number;
    };
    top_apps: Array<{ package: string; duration_minutes: number }>;
    provider_mode: string;
    source: string;
  }>;
}

export interface HealthConnectPluginInterface {
  checkAvailability(): Promise<{
    available: boolean;
    status: string;
    provider: string;
    sdk_version?: number;
    supported_metrics?: string[];
  }>;
  openHealthConnectSettings(): Promise<void>;
  syncHealthData(): Promise<any>;
}

// Register native plugins with Capacitor
export const UsageStatsPlugin = registerPlugin<UsageStatsPluginInterface>('UsageStatsPlugin');
export const HealthConnectPlugin = registerPlugin<HealthConnectPluginInterface>('HealthConnectPlugin');

export class NativeBridgeService {
  public static isNativeAndroid(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  public static isWebBluetoothAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  // ==========================================
  // Digital Wellbeing (Android UsageStatsManager)
  // ==========================================
  public static async checkUsagePermission(): Promise<boolean> {
    if (!this.isNativeAndroid()) {
      return false;
    }
    try {
      const res = await UsageStatsPlugin.hasUsagePermission();
      return Boolean(res.granted);
    } catch (e) {
      console.warn('Native UsageStats check failed:', e);
      return false;
    }
  }

  public static async requestUsagePermission(): Promise<void> {
    if (!this.isNativeAndroid()) {
      throw new Error('Usage access settings are only available on Android devices.');
    }
    await UsageStatsPlugin.requestUsagePermission();
  }

  public static async fetchAndroidUsageStats(): Promise<any> {
    if (!this.isNativeAndroid()) {
      throw new Error('Android UsageStatsManager is only accessible on native Android devices.');
    }
    return UsageStatsPlugin.queryDailyUsage();
  }

  // ==========================================
  // Health Connect & Smartwatch Wearables
  // ==========================================
  public static async checkHealthConnect(): Promise<{
    available: boolean;
    status: string;
    provider: string;
    supported_metrics?: string[];
  }> {
    if (!this.isNativeAndroid()) {
      return {
        available: false,
        status: 'platform_not_supported',
        provider: 'Google Health Connect (Android Only)',
        supported_metrics: ['steps', 'heart_rate', 'sleep', 'calories_burned'],
      };
    }
    try {
      return await HealthConnectPlugin.checkAvailability();
    } catch (e) {
      return {
        available: false,
        status: 'error_checking',
        provider: 'Google Health Connect',
      };
    }
  }

  public static async openHealthConnectSettings(): Promise<void> {
    if (!this.isNativeAndroid()) {
      window.open('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata', '_blank');
      return;
    }
    await HealthConnectPlugin.openHealthConnectSettings();
  }

  public static async syncHealthConnect(): Promise<any> {
    if (!this.isNativeAndroid()) {
      throw new Error('Health Connect is only supported on Android devices.');
    }
    return await HealthConnectPlugin.syncHealthData();
  }

  // ==========================================
  // Web Bluetooth (Direct BLE Smartwatch Connection)
  // ==========================================
  public static async requestBluetoothDevice(): Promise<{ name: string; id: string }> {
    if (!this.isWebBluetoothAvailable()) {
      throw new Error('Web Bluetooth is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
    }

    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [
        { services: ['heart_rate'] },
        { services: [0x180d] }, // Standard Heart Rate Service
      ],
      optionalServices: ['battery_service', 0x180f],
    });

    return {
      name: device.name || 'Bluetooth Heart Rate Monitor',
      id: device.id,
    };
  }
}
