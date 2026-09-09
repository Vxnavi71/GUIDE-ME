import React, { useState, useEffect } from 'react';
import {
  Watch,
  RefreshCw,
  Heart,
  Moon,
  Footprints,
  Flame,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Activity,
  Bed,
  Zap,
  Clock,
  Compass,
  PlusCircle,
  HelpCircle,
  Bluetooth,
  ExternalLink,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { CircularProgressRing } from '../components/CircularProgressRing';
import { NativeBridgeService } from '../services/nativeBridge';
import { useToast } from '../components/ToastNotification';

export const WearablesPage: React.FC = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'wearables' | 'sleep'>('wearables');
  const [metrics, setMetrics] = useState<any>(null);
  const [sleepSummary, setSleepSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // Health Connect & BLE State
  const [healthConnectInfo, setHealthConnectInfo] = useState<{
    available: boolean;
    status: string;
    provider: string;
    supported_metrics?: string[];
  }>({
    available: false,
    status: 'checking',
    provider: 'Google Health Connect',
    supported_metrics: ['steps', 'heart_rate', 'sleep', 'active_calories'],
  });
  const [bleDevice, setBleDevice] = useState<{
    name: string;
    id: string;
    heartRateBpm?: number;
    batteryPercent?: number;
    services?: string[];
    handle?: any;
  } | null>(null);
  // After a filtered scan finds nothing, the next attempt browses all nearby devices.
  const [bleBrowseAll, setBleBrowseAll] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState<Record<string, boolean>>({
    google_health_connect: false,
    bluetooth_le: false,
    fitbit: false,
    apple_health: false,
    mock: false,
  });

  // Manual logging modal form state
  const [manualSleep, setManualSleep] = useState(7.5);
  const [manualQuality, setManualQuality] = useState(80);
  const [manualRhr, setManualRhr] = useState(65);
  const [manualHrv, setManualHrv] = useState(55);
  const [manualSteps, setManualSteps] = useState(8000);
  const [manualActiveMin, setManualActiveMin] = useState(45);
  const [manualWater, setManualWater] = useState(2000);
  const [manualCalories, setManualCalories] = useState(2100);

  useEffect(() => {
    loadData();
    checkProvidersStatus();
  }, []);

  const checkProvidersStatus = async () => {
    try {
      const hc = await NativeBridgeService.checkHealthConnect();
      setHealthConnectInfo(hc);
      if (hc.available) {
        setConnectedProviders((prev) => ({ ...prev, google_health_connect: true }));
      }
      const activeConns = await ApiService.getWearableStatus().catch(() => []);
      if (activeConns && activeConns.length > 0) {
        setConnectedProviders((prev) => ({ ...prev, google_health_connect: true }));
      }
    } catch (e) {
      console.warn('Error checking wearable status:', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, sleep] = await Promise.all([
        ApiService.getWellnessMetrics().catch(() => []),
        ApiService.getSleepSummary().catch(() => null),
      ]);
      if (list && list.length > 0) {
        setMetrics(list[0]);
      } else {
        setMetrics(null);
      }
      if (sleep) {
        setSleepSummary(sleep);
      }
    } catch (e) {
      console.error('Error loading wellness metrics', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncHealthConnect = async () => {
    setSyncing(true);
    try {
      if (NativeBridgeService.isNativeAndroid()) {
        await NativeBridgeService.syncHealthConnect();
        const updated = await ApiService.syncWearables();
        setMetrics(updated);
        const updatedSleep = await ApiService.getSleepSummary();
        setSleepSummary(updatedSleep);
        setConnectedProviders((prev) => ({ ...prev, google_health_connect: true }));
        showToast('Google Health Connect telemetry synchronized successfully!', 'success');
      } else {
        const updated = await ApiService.syncWearables();
        setMetrics(updated);
        const updatedSleep = await ApiService.getSleepSummary();
        setSleepSummary(updatedSleep);
        showToast('Wearable metrics synchronized', 'success');
      }
    } catch (e: any) {
      showToast('Health Connect sync failed: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleConnectBluetooth = async (acceptAllDevices = false) => {
    if (!NativeBridgeService.isWebBluetoothAvailable()) {
      showToast(
        'Web Bluetooth is not available in this browser. Use Chrome, Edge, or Chrome on Android.',
        'error',
      );
      return;
    }

    try {
      showToast(
        acceptAllDevices
          ? 'Showing all nearby Bluetooth devices…'
          : 'Scanning for compatible Bluetooth wearables and sensors…',
        'info',
      );

      const device: any = await NativeBridgeService.requestBluetoothDevice(acceptAllDevices);
      const handle = (device as any).__device;

      // Open a genuine GATT session and read whatever the device actually exposes.
      showToast(`Connecting to ${device.name}…`, 'info');
      const session = await NativeBridgeService.connectBluetoothDevice(handle);

      if (!session.connected) {
        showToast(`Could not open a GATT connection to ${device.name}.`, 'error');
        return;
      }

      setBleDevice({
        name: session.deviceName,
        id: device.id,
        heartRateBpm: session.heartRateBpm,
        batteryPercent: session.batteryPercent,
        services: session.services,
        handle,
      });

      await ApiService.pairWearableDevice({
        provider: 'bluetooth_le',
        device_name: session.deviceName,
        device_id: device.id,
      });
      setConnectedProviders((prev) => ({ ...prev, bluetooth_le: true }));

      // Report only what the device actually returned.
      const readings: string[] = [];
      if (session.heartRateBpm !== undefined) readings.push(`${session.heartRateBpm} bpm`);
      if (session.batteryPercent !== undefined) readings.push(`battery ${session.batteryPercent}%`);
      showToast(
        readings.length
          ? `Connected to ${session.deviceName} — ${readings.join(', ')}`
          : `Connected to ${session.deviceName}. It exposes no readable heart-rate or battery characteristic.`,
        'success',
      );
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('cancelled') || msg.includes('canceled') || e?.name === 'NotFoundError') {
        // The user dismissed the chooser, or nothing matched the service filters.
        if (!acceptAllDevices) {
          setBleBrowseAll(true);
          showToast(
            'No compatible device found. Tap "Pair BLE Device" again to browse all nearby devices.',
            'info',
          );
        }
        return;
      }
      showToast(msg || 'Bluetooth pairing was not completed.', 'warning');
    }
  };

  const handleDisconnectBluetooth = async () => {
    try {
      if (bleDevice?.handle) NativeBridgeService.disconnectBluetoothDevice(bleDevice.handle);
      await ApiService.disconnectWearable('bluetooth_le');
    } catch {
      // Disconnecting locally is enough if the server call fails.
    }
    setBleDevice(null);
    setConnectedProviders((prev) => ({ ...prev, bluetooth_le: false }));
    showToast('Bluetooth device disconnected.', 'info');
  };

  const handleToggleProvider = async (providerId: string, providerName: string) => {
    if (providerId === 'google_health_connect') {
      if (!NativeBridgeService.isNativeAndroid()) {
        NativeBridgeService.openHealthConnectSettings();
        showToast('Health Connect is an Android system service.', 'info');
        return;
      }
      await handleSyncHealthConnect();
      return;
    }

    if (providerId === 'bluetooth_le') {
      if (connectedProviders.bluetooth_le) {
        await handleDisconnectBluetooth();
      } else {
        await handleConnectBluetooth(bleBrowseAll);
        setBleBrowseAll(false);
      }
      return;
    }

    const isCurrentlyConnected = connectedProviders[providerId];
    try {
      if (isCurrentlyConnected) {
        await ApiService.disconnectWearable(providerId);
        setConnectedProviders((prev) => ({ ...prev, [providerId]: false }));
        showToast(`Disconnected ${providerName}.`, 'info');
      } else {
        await ApiService.pairWearableDevice({
          provider: providerId,
          device_name: providerName,
        });
        setConnectedProviders((prev) => ({ ...prev, [providerId]: true }));
        showToast(`Connected to ${providerName}.`, 'success');
      }
    } catch (err: any) {
      showToast(`Could not update ${providerName} connection.`, 'error');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const updated = await ApiService.syncWearables();
      setMetrics(updated);
      const updatedSleep = await ApiService.getSleepSummary();
      setSleepSummary(updatedSleep);
      showToast('Sensor hub synchronized with latest physiological readings.', 'success');
    } catch (e) {
      showToast('Could not synchronize wearable device.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dist = Number((manualSteps * 0.00075).toFixed(1));
      const payload = {
        device_name: 'Manual Health Entry',
        sleep_hours: manualSleep,
        sleep_quality_score: manualQuality,
        resting_heart_rate: manualRhr,
        hrv_ms: manualHrv,
        step_count: manualSteps,
        active_minutes: manualActiveMin,
        water_intake_ml: manualWater,
        calories_burned: manualCalories,
        distance_km: dist,
        sleep_stages: {
          deep: Number((manualSleep * 0.22).toFixed(1)),
          rem: Number((manualSleep * 0.24).toFixed(1)),
          light: Number((manualSleep * 0.46).toFixed(1)),
          awake: Number((manualSleep * 0.08).toFixed(1)),
        },
      };
      await ApiService.logWellnessMetric(payload);
      setShowLogModal(false);
      await loadData();
      showToast('Biometric observation saved successfully.', 'success');
    } catch (e) {
      showToast('Could not save biometric record.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const hasMetrics = metrics !== null && metrics !== undefined;
  const hasSleep = sleepSummary && sleepSummary.sleep_hours !== null && sleepSummary.sleep_hours !== undefined;

  const providers = [
    {
      id: 'google_health_connect',
      name: 'Google Health Connect (Primary Android)',
      desc: 'Unified Android health data layer. Reads steps, heart rate, sleep stages, and active energy from Pixel Watch, Galaxy Watch, Xiaomi, etc.',
      status: connectedProviders.google_health_connect ? 'Connected (System Integrated)' : (healthConnectInfo.available ? 'Available (Click to Sync)' : 'Requires Android Health Connect'),
      isPrimary: true,
      actionLabel: connectedProviders.google_health_connect ? 'Sync Telemetry' : 'Connect / Sync',
      supportedMetrics: ['Steps', 'Resting HR', 'Sleep Stages', 'Active Calories'],
    },
    {
      id: 'bluetooth_le',
      name: 'Direct Bluetooth LE Smartwatch / HRM',
      desc: 'Pairs any Bluetooth LE device exposing standard GATT fitness services (heart rate, battery, cycling/running cadence, fitness machine). Reads live values directly from the device.',
      status: connectedProviders.bluetooth_le
        ? [
            bleDevice?.name || 'BLE device',
            bleDevice?.heartRateBpm !== undefined ? `${bleDevice.heartRateBpm} bpm` : null,
            bleDevice?.batteryPercent !== undefined ? `${bleDevice.batteryPercent}%` : null,
          ]
            .filter(Boolean)
            .join(' · ')
        : bleBrowseAll
          ? 'Tap again to browse all devices'
          : 'Ready to Pair',
      isPrimary: false,
      actionLabel: connectedProviders.bluetooth_le ? 'Disconnect' : 'Pair BLE Device',
      supportedMetrics: ['Live Heart Rate', 'RR-Intervals'],
    },
    {
      id: 'fitbit',
      name: 'Fitbit Web API',
      desc: 'Cloud OAuth 2.0 synchronization for Fitbit Sense, Versa, and Charge series.',
      status: connectedProviders.fitbit ? 'Connected (Cloud Paired)' : 'Ready for OAuth',
      isPrimary: false,
      actionLabel: connectedProviders.fitbit ? 'Disconnect' : 'Connect Fitbit',
      supportedMetrics: ['Steps', 'Resting HR', 'Sleep', 'Active Minutes'],
    },
    {
      id: 'apple_health',
      name: 'Apple HealthKit',
      desc: 'Ingestion of Apple Watch sleep stages, steps, and heart rate variability metrics on iOS devices.',
      status: connectedProviders.apple_health ? 'Connected' : 'iOS Platform Layer',
      isPrimary: false,
      actionLabel: connectedProviders.apple_health ? 'Disconnect' : 'Pair Apple Watch',
      supportedMetrics: ['Steps', 'Sleep Stages', 'Active Calories'],
    },
    {
      id: 'mock',
      name: 'BioSensor Simulator (Offline Fallback)',
      desc: 'Physiological simulator with realistic HRV, steps & sleep architecture for demonstration and testing.',
      status: hasMetrics ? 'Simulator Synchronized' : 'Offline Sandbox Ready',
      isPrimary: false,
      actionLabel: 'Run Simulator Sync',
      supportedMetrics: ['All Simulated Channels'],
    },
  ];

  // Daily goals used only to scale the activity rings. A ring shows an em dash rather than 0%
  // when the underlying metric is absent, so an unsynced device never looks like a bad day.
  const STEP_GOAL = 10000;
  const ACTIVE_MINUTE_GOAL = 30;
  const CALORIE_GOAL = 2200;

  const ringValue = (raw: any) => (hasMetrics && raw !== null && raw !== undefined ? Number(raw) : null);

  const stepsVal = ringValue(metrics?.step_count);
  const activeVal = ringValue(metrics?.active_minutes);
  const caloriesVal = ringValue(metrics?.calories_burned);

  const activityRings = [
    {
      label: 'Steps',
      color: 'text-sage-600 dark:text-sage-400',
      gradientTo: 'text-emerald-400',
      pct: stepsVal !== null ? Math.min(100, (stepsVal / STEP_GOAL) * 100) : 0,
      display: stepsVal !== null ? stepsVal.toLocaleString() : '—',
      goalLabel: `of ${STEP_GOAL.toLocaleString()}`,
      caption:
        stepsVal !== null
          ? `${Math.round((stepsVal / STEP_GOAL) * 100)}% of daily goal`
          : 'No step data yet',
    },
    {
      label: 'Active Minutes',
      color: 'text-amber-500 dark:text-amber-400',
      gradientTo: 'text-orange-400',
      pct: activeVal !== null ? Math.min(100, (activeVal / ACTIVE_MINUTE_GOAL) * 100) : 0,
      display: activeVal !== null ? `${activeVal}m` : '—',
      goalLabel: `of ${ACTIVE_MINUTE_GOAL}m`,
      caption:
        activeVal !== null
          ? activeVal >= ACTIVE_MINUTE_GOAL
            ? 'Daily target reached'
            : `${ACTIVE_MINUTE_GOAL - activeVal}m to target`
          : 'No activity data yet',
    },
    {
      label: 'Energy Burn',
      color: 'text-rose-500 dark:text-rose-400',
      gradientTo: 'text-clay-400',
      pct: caloriesVal !== null ? Math.min(100, (caloriesVal / CALORIE_GOAL) * 100) : 0,
      display: caloriesVal !== null ? `${Math.round(caloriesVal)}` : '—',
      goalLabel: `of ${CALORIE_GOAL} kcal`,
      caption: caloriesVal !== null ? 'Basal + active burn' : 'No energy data yet',
    },
  ];

  const sleepHours = hasSleep ? sleepSummary.sleep_hours : (hasMetrics && metrics.sleep_hours ? metrics.sleep_hours : null);
  const targetSleep = (sleepSummary && sleepSummary.target_sleep_hours) ? sleepSummary.target_sleep_hours : 8.0;
  const sleepPct = sleepHours ? Math.min(Math.round((sleepHours / targetSleep) * 100), 100) : 0;

  const stages = (sleepSummary && sleepSummary.stages && Object.keys(sleepSummary.stages).length > 0)
    ? sleepSummary.stages
    : (hasMetrics && metrics.sleep_stages ? metrics.sleep_stages : null);

  const hasStages = stages !== null && stages !== undefined && Object.keys(stages).length > 0;
  const totalStageHours = hasStages
    ? (stages.deep || 0) + (stages.rem || 0) + (stages.light || 0) + (stages.awake || 0) || 1
    : 1;

  const deepPct = hasStages ? Math.round(((stages.deep || 0) / totalStageHours) * 100) : 0;
  const remPct = hasStages ? Math.round(((stages.rem || 0) / totalStageHours) * 100) : 0;
  const lightPct = hasStages ? Math.round(((stages.light || 0) / totalStageHours) * 100) : 0;
  const awakePct = hasStages ? Math.round(((stages.awake || 0) / totalStageHours) * 100) : 0;

  const sleepTrends = sleepSummary?.trend_7d || [];
  const hasSleepTrends = sleepTrends.some((d: any) => d.sleep_hours !== null && d.sleep_hours > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-forest-950 dark:text-sage-50 flex items-center gap-2">
            <Watch className="w-5 h-5 text-sage-600 dark:text-sage-400" />
            <span>Wearables & Sleep Architecture Hub</span>
          </h1>
          <p className="text-sm text-earth-600 dark:text-sage-400 mt-1 leading-relaxed">
            Real-time synchronization of autonomic recovery, restorative sleep stages, and movement vitality without synthetic fallbacks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="bg-earth-100 dark:bg-forest-800/60 p-1 rounded-xl flex items-center gap-1 border border-earth-200 dark:border-forest-700">
            <button
              onClick={() => setActiveTab('wearables')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'wearables'
                  ? 'bg-white dark:bg-forest-900 text-forest-950 dark:text-sage-100 shadow-soft'
                  : 'text-earth-600 dark:text-sage-400 hover:text-forest-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
              <span>Biometric Sync</span>
            </button>
            <button
              onClick={() => setActiveTab('sleep')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'sleep'
                  ? 'bg-white dark:bg-forest-900 text-forest-950 dark:text-sage-100 shadow-soft'
                  : 'text-earth-600 dark:text-sage-400 hover:text-forest-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Sleep Analysis</span>
            </button>
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-earth-100 hover:bg-earth-200 dark:bg-forest-800 dark:hover:bg-forest-700 text-forest-900 dark:text-sage-200 text-xs font-semibold transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Biometrics</span>
          </button>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold transition-colors shadow-soft disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Sensors...' : 'Sync Sensor Hub'}</span>
          </button>
        </div>
      </div>

      {/* Manual Biometrics Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-earth-200/80 dark:border-forest-800 pb-3">
              <h2 className="text-base font-semibold text-forest-950 dark:text-sage-100 flex items-center gap-2">
                <Watch className="w-5 h-5 text-sage-600 dark:text-sage-400" />
                <span>Log Biometric & Sleep Observation</span>
              </h2>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-earth-400 hover:text-earth-600 dark:text-sage-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">
                    Sleep Duration (hours)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="24"
                    required
                    value={manualSleep}
                    onChange={(e) => setManualSleep(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">
                    Sleep Quality Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={manualQuality}
                    onChange={(e) => setManualQuality(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">
                    Resting Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="200"
                    required
                    value={manualRhr}
                    onChange={(e) => setManualRhr(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">
                    HRV (ms)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    required
                    value={manualHrv}
                    onChange={(e) => setManualHrv(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">
                    Daily Steps
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    required
                    value={manualSteps}
                    onChange={(e) => setManualSteps(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">
                    Active Exercise (mins)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="720"
                    required
                    value={manualActiveMin}
                    onChange={(e) => setManualActiveMin(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">
                    Water Intake (ml)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    required
                    value={manualWater}
                    onChange={(e) => setManualWater(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">
                    Calories Burned (kcal)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    required
                    value={manualCalories}
                    onChange={(e) => setManualCalories(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-earth-100 dark:border-forest-800">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-earth-300 dark:border-forest-700 text-xs font-medium text-earth-700 dark:text-sage-300 hover:bg-earth-50 dark:hover:bg-forest-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold shadow-soft transition-colors"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 1: Wearables Hub */}
      {activeTab === 'wearables' && (
        <div className="space-y-6">
          {/* Daily activity rings — the at-a-glance summary above the detailed readouts */}
          <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-xs font-bold text-earth-500 dark:text-sage-400 uppercase tracking-wider">
                Today at a Glance
              </h2>
              <span className="text-[11px] text-earth-500 dark:text-sage-400">
                {hasMetrics ? 'Against your daily goals' : 'Sync a device to populate'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 justify-items-center">
              {activityRings.map((ring) => (
                <div key={ring.label} className="flex flex-col items-center text-center">
                  <CircularProgressRing
                    progress={ring.pct}
                    size={136}
                    strokeWidth={11}
                    progressColor={ring.color}
                    gradientTo={ring.gradientTo}
                    glow
                    centerContent={
                      <div className="flex flex-col items-center">
                        <span className="text-xl font-bold text-forest-950 dark:text-sage-100 tabular-nums">
                          {ring.display}
                        </span>
                        <span className="text-[10px] font-medium text-earth-500 dark:text-sage-400">
                          {ring.goalLabel}
                        </span>
                      </div>
                    }
                  />
                  <div className="mt-3">
                    <div className="text-sm font-semibold text-forest-900 dark:text-sage-100">{ring.label}</div>
                    <div className="text-[11px] text-earth-500 dark:text-sage-400">{ring.caption}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6 Biometric Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 shadow-soft">
              <div className="flex items-center justify-between text-earth-500 dark:text-sage-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Heart Rate Variability</span>
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-semibold text-forest-950 dark:text-sage-100">
                {hasMetrics && metrics.hrv_ms !== null && metrics.hrv_ms !== undefined ? `${metrics.hrv_ms} ms` : '— ms'}
              </div>
              <div className="text-xs text-earth-500 dark:text-sage-400 mt-1">
                {hasMetrics && metrics.hrv_ms !== null ? 'Balanced Parasympathetic Tone' : 'No sensor connected'}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 shadow-soft">
              <div className="flex items-center justify-between text-earth-500 dark:text-sage-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Resting Heart Rate</span>
                <Activity className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-semibold text-forest-950 dark:text-sage-100">
                {hasMetrics && metrics.resting_heart_rate !== null && metrics.resting_heart_rate !== undefined
                  ? `${metrics.resting_heart_rate} bpm`
                  : '— bpm'}
              </div>
              <div className="text-xs text-earth-500 dark:text-sage-400 mt-1">
                {hasMetrics && metrics.resting_heart_rate !== null ? 'Calibrated nocturnal basal rhythm' : 'Awaiting baseline'}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 shadow-soft">
              <div className="flex items-center justify-between text-earth-500 dark:text-sage-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Daily Steps & Distance</span>
                <Footprints className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-semibold text-forest-950 dark:text-sage-100">
                {hasMetrics && metrics.step_count !== null && metrics.step_count !== undefined
                  ? metrics.step_count.toLocaleString()
                  : '—'}
              </div>
              <div className="text-xs text-earth-500 dark:text-sage-400 mt-1">
                {hasMetrics && metrics.distance_km !== null && metrics.distance_km !== undefined
                  ? `${metrics.distance_km} km covered today`
                  : '0 km covered today'}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 shadow-soft">
              <div className="flex items-center justify-between text-earth-500 dark:text-sage-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Active Exercise Zone</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-semibold text-forest-950 dark:text-sage-100">
                {hasMetrics && metrics.active_minutes !== null && metrics.active_minutes !== undefined
                  ? `${metrics.active_minutes} mins`
                  : '— mins'}
              </div>
              <div className="text-xs text-earth-500 dark:text-sage-400 mt-1">
                {hasMetrics && metrics.active_minutes !== null
                  ? (metrics.active_minutes >= 30 ? 'Target achieved (≥30m)' : 'Below 30m target')
                  : 'No activity logged'}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 shadow-soft">
              <div className="flex items-center justify-between text-earth-500 dark:text-sage-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Total Energy Output</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-semibold text-forest-950 dark:text-sage-100">
                {hasMetrics && metrics.calories_burned !== null && metrics.calories_burned !== undefined
                  ? `${metrics.calories_burned} kcal`
                  : '— kcal'}
              </div>
              <div className="text-xs text-earth-500 dark:text-sage-400 mt-1">
                {hasMetrics && metrics.calories_burned !== null ? 'Basal metabolic + active burn' : 'Energy burn unmeasured'}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 shadow-soft">
              <div className="flex items-center justify-between text-earth-500 dark:text-sage-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Hydration Log</span>
                <Compass className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-semibold text-forest-950 dark:text-sage-100">
                {hasMetrics && metrics.water_intake_ml !== null && metrics.water_intake_ml !== undefined
                  ? `${metrics.water_intake_ml} ml`
                  : '— ml'}
              </div>
              <div className="text-xs text-earth-500 dark:text-sage-400 mt-1">
                {hasMetrics && metrics.water_intake_ml !== null ? 'Hydration tracked' : 'No intake logged'}
              </div>
            </div>
          </div>

          {/* Provider Architecture Section */}
          <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft">
            <h2 className="text-sm font-semibold text-forest-950 dark:text-sage-100 mb-1">
              Connected Wearable Providers & Sensor Integrations
            </h2>
            <p className="text-xs text-earth-600 dark:text-sage-400 mb-4">
              GUIDE ME provides seamless biometric integration. Connect external wearables or click "Sync Sensor Hub" to poll sensor data.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                    p.isPrimary
                      ? 'border-sage-300 dark:border-forest-700 bg-sage-50/40 dark:bg-forest-800/60 shadow-soft'
                      : 'border-earth-200/80 dark:border-forest-800 bg-earth-50/50 dark:bg-forest-800/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-forest-900 dark:text-sage-100 flex items-center gap-1.5">
                        {p.id === 'bluetooth_le' && <Bluetooth className="w-3.5 h-3.5 text-blue-500" />}
                        <span>{p.name}</span>
                      </h3>
                      {p.isPrimary && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage-600 text-white">
                          Primary Android
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-earth-600 dark:text-sage-300 mt-1 max-w-sm">{p.desc}</p>

                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {p.supportedMetrics?.map((m: string, mIdx: number) => (
                        <span
                          key={mIdx}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-earth-100 dark:bg-forest-700 text-earth-700 dark:text-sage-300"
                        >
                          ✓ {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-earth-100 dark:border-forest-700/60">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        p.status.includes('Connected')
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-earth-100 dark:bg-forest-700 text-earth-700 dark:text-sage-300'
                      }`}
                    >
                      {p.status}
                    </span>

                    <button
                      onClick={() => handleToggleProvider(p.id, p.name)}
                      disabled={syncing}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs ${
                        p.status.includes('Connected')
                          ? 'bg-earth-200 dark:bg-forest-700 hover:bg-earth-300 dark:hover:bg-forest-600 text-forest-900 dark:text-sage-200'
                          : 'bg-sage-600 hover:bg-sage-700 text-white'
                      }`}
                    >
                      <span>{p.actionLabel}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Dedicated Sleep Analysis */}
      {activeTab === 'sleep' && (
        <div className="space-y-6">
          {/* Top Row: Sleep Ring & Stages Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Circular Sleep Ring Card */}
            <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft flex flex-col items-center justify-center text-center">
              <h2 className="text-xs font-bold text-earth-500 dark:text-sage-400 uppercase tracking-wider mb-4">
                Last Night Sleep Duration
              </h2>

              <CircularProgressRing
                progress={sleepPct}
                size={168}
                strokeWidth={13}
                progressColor="text-indigo-500"
                gradientTo="text-sky-400"
                glow
                centerContent={
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold text-forest-950 dark:text-sage-100">
                      {sleepHours !== null ? `${sleepHours}h` : '—'}
                    </span>
                    <span className="text-[11px] font-medium text-earth-500 dark:text-sage-400">
                      {sleepHours !== null ? `of ${targetSleep}h goal` : `Goal: ${targetSleep}h`}
                    </span>
                  </div>
                }
              />

              <div className="mt-4 flex items-center justify-between w-full max-w-xs px-2 pt-3 border-t border-earth-100 dark:border-forest-800 text-xs">
                <span className="text-earth-600 dark:text-sage-400">Quality Score:</span>
                <span className="font-bold text-forest-900 dark:text-sage-100">
                  {hasSleep && sleepSummary?.sleep_quality_score !== null && sleepSummary?.sleep_quality_score !== undefined
                    ? `${sleepSummary.sleep_quality_score}%`
                    : '—'}
                </span>
              </div>

              {!hasSleep && (
                <p className="text-[11px] text-earth-500 dark:text-sage-400 mt-2 px-2">
                  No sleep records detected. Click "Sync Sensor Hub" or log sleep manually.
                </p>
              )}
            </div>

            {/* Sleep Stages Architecture */}
            <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold text-earth-500 dark:text-sage-400 uppercase tracking-wider">
                    Sleep Stage Breakdown
                  </h2>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {hasStages ? `${stages.deep || 0}h Deep (${deepPct}%)` : '—'}
                  </span>
                </div>

                {hasStages ? (
                  <>
                    {/* Stacked Bar */}
                    <div className="w-full h-3 rounded-full overflow-hidden flex bg-earth-200 dark:bg-forest-800 mb-5">
                      <div style={{ width: `${deepPct}%` }} className="bg-indigo-700 h-full" title="Deep Sleep" />
                      <div style={{ width: `${remPct}%` }} className="bg-indigo-500 h-full" title="REM Sleep" />
                      <div style={{ width: `${lightPct}%` }} className="bg-sky-400 h-full" title="Light Sleep" />
                      <div style={{ width: `${awakePct}%` }} className="bg-amber-400 h-full" title="Awake / Restless" />
                    </div>

                    {/* Legend */}
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-700"></span>
                          <span className="text-forest-900 dark:text-sage-200 font-medium">Deep Slow-Wave Sleep</span>
                        </div>
                        <span className="font-semibold text-forest-950 dark:text-sage-100">{stages.deep || 0} hrs</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                          <span className="text-forest-900 dark:text-sage-200 font-medium">REM Emotional Processing</span>
                        </div>
                        <span className="font-semibold text-forest-950 dark:text-sage-100">{stages.rem || 0} hrs</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                          <span className="text-forest-900 dark:text-sage-200 font-medium">Light Restorative Sleep</span>
                        </div>
                        <span className="font-semibold text-forest-950 dark:text-sage-100">{stages.light || 0} hrs</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                          <span className="text-forest-900 dark:text-sage-200 font-medium">Awake / Micro-Arousals</span>
                        </div>
                        <span className="font-semibold text-forest-950 dark:text-sage-100">{stages.awake || 0} hrs</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 rounded-xl bg-earth-50 dark:bg-forest-800/40 border border-dashed border-earth-200 dark:border-forest-700 text-center my-4">
                    <HelpCircle className="w-6 h-6 mx-auto mb-2 text-earth-400 dark:text-sage-500" />
                    <p className="text-xs font-semibold text-forest-900 dark:text-sage-200">No sleep architecture logged</p>
                    <p className="text-[11px] text-earth-500 dark:text-sage-400 mt-1">
                      Deep, REM, and light sleep stages require wearable polysomnography or sensor sync.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-earth-100 dark:border-forest-800 text-[11px] text-earth-500 dark:text-sage-400">
                {hasStages ? (
                  <>
                    Restorative Slow-Wave + REM Ratio: <strong className="text-forest-900 dark:text-sage-200">{deepPct + remPct}%</strong> of total rest
                  </>
                ) : (
                  <span>Sleep stages uncalibrated</span>
                )}
              </div>
            </div>

            {/* Sleep Consistency & Stress Relationship */}
            <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-earth-500 dark:text-sage-400 tracking-wider">
                  Consistency & Stress Buffer
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-forest-950 dark:text-sage-100">
                    {hasSleep && sleepSummary?.consistency_percentage !== null && sleepSummary?.consistency_percentage !== undefined
                      ? `${sleepSummary.consistency_percentage}%`
                      : '—'}
                  </span>
                  {hasSleep && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Circadian Harmony</span>
                  )}
                </div>
                <p className="text-xs text-earth-600 dark:text-sage-300 leading-relaxed mt-3">
                  {sleepSummary?.stress_correlation_note ||
                    'No sleep data logged yet. Connect a wearable device or log your sleep to receive recovery insights.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-earth-100 dark:border-forest-800 text-[11px] text-earth-500 dark:text-sage-400">
                Optimal Wake Window: <strong className="text-forest-900 dark:text-sage-200">{hasSleep ? '07:00 - 07:30 AM' : '—'}</strong>
              </div>
            </div>
          </div>

          {/* 7-Day Sleep Duration Trend */}
          <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-earth-500 dark:text-sage-400 uppercase tracking-wider">
                7-Day Sleep Duration Trend
              </h2>
              <span className="text-xs text-earth-500 dark:text-sage-400">Target: 7.5h - 8.5h</span>
            </div>

            {hasSleepTrends ? (
              <div className="flex items-end justify-between h-40 gap-3 pt-4">
                {sleepTrends.map((day: any, idx: number) => {
                  const heightPct = Math.min(Math.round(((day.sleep_hours || 0) / 10.0) * 100), 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-semibold text-earth-600 dark:text-sage-300">
                        {day.sleep_hours !== null ? `${day.sleep_hours}h` : '—'}
                      </span>
                      <div className="w-full max-w-[36px] bg-earth-100 dark:bg-forest-800 rounded-t-xl overflow-hidden flex flex-col justify-end h-28">
                        {day.sleep_hours !== null && day.sleep_hours > 0 && (
                          <div
                            className={`w-full rounded-t-lg transition-all ${
                              day.target_met ? 'bg-indigo-600' : 'bg-amber-500'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-earth-500 dark:text-sage-400">
                        {day.day_name}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-earth-50 dark:bg-forest-800/40 border border-dashed border-earth-200 dark:border-forest-700 text-center my-4">
                <Moon className="w-7 h-7 mx-auto mb-2 text-earth-400 dark:text-sage-500" />
                <p className="text-xs font-semibold text-forest-900 dark:text-sage-200">No 7-day sleep records available</p>
                <p className="text-[11px] text-earth-500 dark:text-sage-400 mt-1">
                  Log sleep nightly or connect your smart watch to visualize your restorative sleep progression.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


