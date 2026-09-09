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
  /**
   * Standard GATT services we can read from. Filtering on a broad set of services (rather than
   * heart rate alone) is what lets arbitrary compatible wearables show up in the chooser instead
   * of only heart-rate straps.
   */
  private static readonly BLE_SERVICES: Array<string | number> = [
    'heart_rate', // 0x180D
    'battery_service', // 0x180F
    'device_information', // 0x180A
    'fitness_machine', // 0x1826
    'running_speed_and_cadence', // 0x1814
    'cycling_speed_and_cadence', // 0x1816
    'health_thermometer', // 0x1809
    'pulse_oximeter', // 0x1822
  ];

  /**
   * Opens the browser's device chooser. Devices advertising any recognised fitness service are
   * offered first; if the user finds nothing there they can retry in "all devices" mode, which
   * still only exposes services we explicitly request.
   *
   * The chooser is shown by the browser and requires an explicit user selection — this cannot
   * silently pair anything.
   */
  public static async requestBluetoothDevice(
    acceptAllDevices = false,
  ): Promise<{ name: string; id: string }> {
    if (!this.isWebBluetoothAvailable()) {
      throw new Error(
        'Web Bluetooth is not supported by this browser. Chrome, Edge or Android Chrome are required (Safari and Firefox do not implement it).',
      );
    }

    const options: Record<string, unknown> = acceptAllDevices
      ? { acceptAllDevices: true, optionalServices: this.BLE_SERVICES }
      : {
          filters: this.BLE_SERVICES.map((service) => ({ services: [service] })),
          optionalServices: this.BLE_SERVICES,
        };

    const device = await (navigator as any).bluetooth.requestDevice(options);

    return {
      name: device.name || 'Unnamed BLE device',
      id: device.id,
      // Keep the live handle so the caller can open a real GATT session.
      ...(device ? { __device: device } : {}),
    } as { name: string; id: string };
  }

  /**
   * Opens a real GATT connection and reads what the device actually exposes. Returns only values
   * the device reported — absent characteristics come back undefined rather than invented.
   */
  public static async connectBluetoothDevice(deviceHandle: any): Promise<{
    connected: boolean;
    deviceName: string;
    heartRateBpm?: number;
    batteryPercent?: number;
    services: string[];
  }> {
    if (!deviceHandle?.gatt) {
      throw new Error('This device does not expose a GATT server and cannot be read.');
    }

    const server = await deviceHandle.gatt.connect();
    const discovered: string[] = [];
    let heartRateBpm: number | undefined;
    let batteryPercent: number | undefined;

    // Heart rate: subscribe briefly and take the first real measurement.
    try {
      const hrService = await server.getPrimaryService('heart_rate');
      discovered.push('heart_rate');
      const hrChar = await hrService.getCharacteristic('heart_rate_measurement');
      heartRateBpm = await new Promise<number | undefined>((resolve) => {
        const timeout = setTimeout(() => resolve(undefined), 6000);
        const onChange = (event: any) => {
          const value = event.target.value as DataView;
          // Per the GATT Heart Rate Measurement spec, bit 0 of the flags byte selects
          // an 8-bit (0) or 16-bit (1) BPM value.
          const flags = value.getUint8(0);
          const bpm = flags & 0x01 ? value.getUint16(1, true) : value.getUint8(1);
          clearTimeout(timeout);
          hrChar.removeEventListener('characteristicvaluechanged', onChange);
          resolve(bpm);
        };
        hrChar.addEventListener('characteristicvaluechanged', onChange);
        hrChar.startNotifications().catch(() => {
          clearTimeout(timeout);
          resolve(undefined);
        });
      });
    } catch {
      // Device does not expose heart rate; leave undefined.
    }

    try {
      const batteryService = await server.getPrimaryService('battery_service');
      discovered.push('battery_service');
      const batteryChar = await batteryService.getCharacteristic('battery_level');
      const value = await batteryChar.readValue();
      batteryPercent = value.getUint8(0);
    } catch {
      // Device does not expose battery level; leave undefined.
    }

    return {
      connected: Boolean(server.connected),
      deviceName: deviceHandle.name || 'Unnamed BLE device',
      heartRateBpm,
      batteryPercent,
      services: discovered,
    };
  }

  public static disconnectBluetoothDevice(deviceHandle: any): void {
    try {
      if (deviceHandle?.gatt?.connected) {
        deviceHandle.gatt.disconnect();
      }
    } catch {
      // Already disconnected or handle is stale.
    }
  }
}
