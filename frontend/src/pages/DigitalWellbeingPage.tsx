import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Moon,
  Bell,
  Clock,
  Shield,
  Eye,
  CheckCircle,
  Sliders,
  Laptop,
  MessageSquare,
  Gamepad2,
  Wrench,
  Info,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { CircularProgressRing } from '../components/CircularProgressRing';
import { NativeBridgeService } from '../services/nativeBridge';
import { useToast } from '../components/ToastNotification';
import { RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';

export const DigitalWellbeingPage: React.FC = () => {
  const { showToast } = useToast();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [targetLimit, setTargetLimit] = useState(300);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // Android Native Integration State
  const [isAndroid, setIsAndroid] = useState(NativeBridgeService.isNativeAndroid());
  const [hasUsagePermission, setHasUsagePermission] = useState(false);
  const [syncingAndroid, setSyncingAndroid] = useState(false);

  // Manual logging form state
  const [manualScreenTime, setManualScreenTime] = useState(180);
  const [manualFocusTime, setManualFocusTime] = useState(90);
  const [manualNotifications, setManualNotifications] = useState(25);
  const [manualNightScreen, setManualNightScreen] = useState(15);
  const [manualProductive, setManualProductive] = useState(90);
  const [manualComm, setManualComm] = useState(40);
  const [manualEntertainment, setManualEntertainment] = useState(30);
  const [manualUtility, setManualUtility] = useState(20);

  useEffect(() => {
    loadWellbeing();
    if (NativeBridgeService.isNativeAndroid()) {
      setIsAndroid(true);
      NativeBridgeService.checkUsagePermission().then((granted) => {
        setHasUsagePermission(granted);
        if (granted) {
          syncFromAndroid();
        }
      });
    }
  }, []);

  const loadWellbeing = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getDigitalWellbeing();
      setData(res);
      if (res?.target_limit_minutes) {
        setTargetLimit(res.target_limit_minutes);
      }
    } catch (e) {
      console.error('Failed to load digital wellbeing:', e);
    } finally {
      setLoading(false);
    }
  };

  const syncFromAndroid = async () => {
    if (!NativeBridgeService.isNativeAndroid()) return;
    setSyncingAndroid(true);
    try {
      const stats = await NativeBridgeService.fetchAndroidUsageStats();
      const updated = await ApiService.updateDigitalWellbeing(stats);
      setData(updated);
      showToast('Successfully imported screen time from Android UsageStatsManager', 'success');
    } catch (err: any) {
      console.warn('Android UsageStats sync notice:', err);
      showToast('Could not query Android usage stats: ' + (err.message || 'Permission needed'), 'error');
    } finally {
      setSyncingAndroid(false);
    }
  };

  const handleRequestAndroidPermission = async () => {
    try {
      await NativeBridgeService.requestUsagePermission();
      showToast('Opening Android Usage Access settings. Please toggle GuideMe to Allowed and return.', 'info');
    } catch (e: any) {
      showToast(e.message || 'Unable to open usage settings.', 'error');
    }
  };

  const handleUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await ApiService.updateDigitalWellbeing({
        target_limit_minutes: targetLimit,
      });
      setData(updated);
      setShowSettings(false);
      showToast('Screen time limit updated', 'success');
    } catch (e) {
      showToast('Could not update screen time limit', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await ApiService.updateDigitalWellbeing({
        total_screen_time_minutes: manualScreenTime,
        focus_time_minutes: manualFocusTime,
        notification_count: manualNotifications,
        night_screen_minutes: manualNightScreen,
        source: 'manual',
        categories: {
          productive: manualProductive,
          communication: manualComm,
          entertainment_distraction: manualEntertainment,
          utility: manualUtility,
        },
      });
      setData(updated);
      setShowLogModal(false);
      showToast('Screen time observation saved', 'success');
    } catch (e) {
      showToast('Could not log screen time data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const hasData = data && data.total_screen_time_minutes !== null && data.total_screen_time_minutes !== undefined;
  const isConnected = data?.provider_mode === 'connected' && hasData;

  const totalMinutes = hasData ? data.total_screen_time_minutes : null;
  const limitMinutes = (data && data.target_limit_minutes) ? data.target_limit_minutes : 300;
  const screenPct = hasData ? Math.min(Math.round((totalMinutes / limitMinutes) * 100), 100) : 0;
  const totalHours = hasData ? (totalMinutes / 60).toFixed(1) : null;
  const focusHours = (hasData && data.focus_time_minutes !== null && data.focus_time_minutes !== undefined)
    ? (data.focus_time_minutes / 60).toFixed(1)
    : null;
  const limitHours = (limitMinutes / 60).toFixed(1);

  const categories = data?.categories || {};
  const hasCategories = Object.keys(categories).length > 0 && Object.values(categories).some((v: any) => v > 0);

  const totalCategoryMinutes = hasCategories
    ? (categories.productive || 0) +
      (categories.communication || 0) +
      (categories.entertainment_distraction || 0) +
      (categories.utility || 0) || 1
    : 1;

  const productivePct = hasCategories ? Math.round(((categories.productive || 0) / totalCategoryMinutes) * 100) : 0;
  const commPct = hasCategories ? Math.round(((categories.communication || 0) / totalCategoryMinutes) * 100) : 0;
  const entertainPct = hasCategories ? Math.round(((categories.entertainment_distraction || 0) / totalCategoryMinutes) * 100) : 0;
  const utilPct = hasCategories ? Math.round(((categories.utility || 0) / totalCategoryMinutes) * 100) : 0;

  const weeklyTrends = data?.weekly_trends || [];
  const hasWeeklyTrends = weeklyTrends.some((d: any) => d.total_screen_time_minutes > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-forest-950 dark:text-sage-50 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-sage-600 dark:text-sage-400" />
            <span>Digital Wellbeing & Focus Boundaries</span>
          </h1>
          <p className="text-sm text-earth-600 dark:text-sage-400 mt-1 leading-relaxed">
            Conscious screen time tracking, notification exposure monitoring, and intentional digital boundaries without synthetic approximations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isConnected ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Data Source: {data?.source === 'android_usage_stats' ? 'Android UsageStats' : 'Connected'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-earth-100 dark:bg-forest-800 border border-earth-200 dark:border-forest-700 text-[11px] font-semibold text-earth-600 dark:text-sage-400">
              <span className="w-2 h-2 rounded-full bg-earth-400"></span>
              <span>Data Mode: {isAndroid ? (hasUsagePermission ? 'Ready to Sync' : 'Permission Required') : 'Manual Mode'}</span>
            </div>
          )}

          {isAndroid && (
            <button
              onClick={hasUsagePermission ? syncFromAndroid : handleRequestAndroidPermission}
              disabled={syncingAndroid}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-900 dark:bg-forest-800 text-white text-xs font-semibold hover:bg-forest-800 dark:hover:bg-forest-700 transition-colors shadow-soft disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingAndroid ? 'animate-spin' : ''}`} />
              <span>{hasUsagePermission ? (syncingAndroid ? 'Syncing...' : 'Sync Android Usage') : 'Grant Usage Access'}</span>
            </button>
          )}

          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold transition-colors shadow-soft"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Screen Time</span>
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-earth-100 hover:bg-earth-200 dark:bg-forest-800 dark:hover:bg-forest-700 text-forest-900 dark:text-sage-200 text-xs font-semibold transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Set Limit</span>
          </button>
        </div>
      </div>

      {/* Android Permission Guidance Banner */}
      {isAndroid && !hasUsagePermission && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold text-sm">System Usage Access Required</strong>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 max-w-xl">
                To read your real daily screen time, app foreground duration, and category splits automatically on Android, GUIDE ME requires Usage Access permission.
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestAndroidPermission}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors self-start sm:self-auto flex items-center gap-1.5"
          >
            <span>Open Android Settings</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Web Platform Notice */}
      {!isAndroid && (
        <div className="p-3.5 rounded-xl bg-earth-100 dark:bg-forest-800/60 border border-earth-200 dark:border-forest-700 text-xs text-earth-700 dark:text-sage-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sage-600 flex-shrink-0" />
            <span>
              <strong>Platform Notice:</strong> Direct OS screen time integration utilizes Android UsageStatsManager on mobile. Browser environments restrict system-wide app monitoring. Manual entry mode is active below.
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold text-earth-500 dark:text-sage-400 bg-white dark:bg-forest-900 px-2 py-0.5 rounded">
            Browser Environment
          </span>
        </div>
      )}

      {/* Screen Time Limit Modal / Drawer */}
      {showSettings && (
        <div className="p-4 rounded-2xl bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div>
            <h3 className="text-xs font-bold text-forest-950 dark:text-sage-100">Adjust Daily Screen Time Limit</h3>
            <p className="text-[11px] text-earth-600 dark:text-sage-400 mt-0.5">
              Current daily boundary target is {limitHours} hours ({limitMinutes} minutes).
            </p>
          </div>
          <form onSubmit={handleUpdateLimit} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="number"
              min="60"
              max="720"
              step="15"
              value={targetLimit}
              onChange={(e) => setTargetLimit(parseInt(e.target.value) || 300)}
              className="w-24 px-3 py-1.5 text-xs rounded-xl border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
            />
            <span className="text-xs text-earth-600 dark:text-sage-400">minutes</span>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="px-3 py-1.5 rounded-xl border border-earth-300 dark:border-forest-700 text-xs text-earth-600 dark:text-sage-400 hover:bg-earth-50 dark:hover:bg-forest-800"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Manual Screen Time Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-earth-200/80 dark:border-forest-800 pb-3">
              <h2 className="text-base font-semibold text-forest-950 dark:text-sage-100 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-sage-600 dark:text-sage-400" />
                <span>Log Daily Digital Wellbeing</span>
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
                    Total Screen Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1440"
                    required
                    value={manualScreenTime}
                    onChange={(e) => setManualScreenTime(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">
                    Deep Focus Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1440"
                    required
                    value={manualFocusTime}
                    onChange={(e) => setManualFocusTime(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">
                    Notifications Received
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    required
                    value={manualNotifications}
                    onChange={(e) => setManualNotifications(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">
                    Late Night Screen Time (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="360"
                    required
                    value={manualNightScreen}
                    onChange={(e) => setManualNightScreen(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest-900 dark:text-sage-200 mb-2">
                  Category Split (minutes)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-earth-600 dark:text-sage-400 block mb-0.5">Productive</span>
                    <input
                      type="number"
                      min="0"
                      value={manualProductive}
                      onChange={(e) => setManualProductive(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-earth-600 dark:text-sage-400 block mb-0.5">Communication</span>
                    <input
                      type="number"
                      min="0"
                      value={manualComm}
                      onChange={(e) => setManualComm(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-earth-600 dark:text-sage-400 block mb-0.5">Entertainment</span>
                    <input
                      type="number"
                      min="0"
                      value={manualEntertainment}
                      onChange={(e) => setManualEntertainment(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-earth-600 dark:text-sage-400 block mb-0.5">Utility</span>
                    <input
                      type="number"
                      min="0"
                      value={manualUtility}
                      onChange={(e) => setManualUtility(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 text-xs"
                    />
                  </div>
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
                  Save Wellbeing Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Focus & Ring Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circular Progress Ring Card */}
        <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft flex flex-col items-center justify-center text-center">
          <h2 className="text-xs font-bold text-earth-500 dark:text-sage-400 uppercase tracking-wider mb-4">
            Daily Screen Time Budget
          </h2>

          <CircularProgressRing
            progress={screenPct}
            size={160}
            strokeWidth={12}
            progressColor={screenPct > 90 ? 'text-amber-500' : 'text-emerald-500'}
            centerContent={
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-forest-950 dark:text-sage-100">
                  {hasData ? `${totalHours}h` : '—'}
                </span>
                <span className="text-[11px] font-medium text-earth-500 dark:text-sage-400">
                  {hasData ? `of ${limitHours}h limit` : `Target: ${limitHours}h`}
                </span>
              </div>
            }
          />

          <div className="mt-4 flex items-center justify-between w-full max-w-xs px-2 pt-3 border-t border-earth-100 dark:border-forest-800 text-xs">
            <span className="text-earth-600 dark:text-sage-400">Capacity Used:</span>
            <span className="font-bold text-forest-900 dark:text-sage-100">
              {hasData ? `${screenPct}%` : '—'}
            </span>
          </div>

          {!hasData && (
            <p className="text-[11px] text-earth-500 dark:text-sage-400 mt-2 px-2">
              No screen time recorded today. Log device usage above to track budget.
            </p>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-earth-500 dark:text-sage-400 uppercase tracking-wider">
                Category Time Split
              </h2>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {hasCategories ? `${productivePct}% Productive` : '—'}
              </span>
            </div>

            {hasCategories ? (
              <>
                {/* Stacked Bar */}
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-earth-200 dark:bg-forest-800 mb-5">
                  <div style={{ width: `${productivePct}%` }} className="bg-emerald-500 h-full" title="Productive" />
                  <div style={{ width: `${commPct}%` }} className="bg-sky-500 h-full" title="Communication" />
                  <div style={{ width: `${entertainPct}%` }} className="bg-amber-500 h-full" title="Entertainment / Distraction" />
                  <div style={{ width: `${utilPct}%` }} className="bg-sage-400 h-full" title="Utility" />
                </div>

                {/* Legend & stats */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="text-forest-900 dark:text-sage-200 font-medium">Deep Work & Productivity</span>
                    </div>
                    <span className="font-semibold text-forest-950 dark:text-sage-100">{categories.productive || 0}m</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                      <span className="text-forest-900 dark:text-sage-200 font-medium">Communication & Teams</span>
                    </div>
                    <span className="font-semibold text-forest-950 dark:text-sage-100">{categories.communication || 0}m</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span className="text-forest-900 dark:text-sage-200 font-medium">Social & Distraction</span>
                    </div>
                    <span className="font-semibold text-forest-950 dark:text-sage-100">{categories.entertainment_distraction || 0}m</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sage-400"></span>
                      <span className="text-forest-900 dark:text-sage-200 font-medium">Utilities & Tools</span>
                    </div>
                    <span className="font-semibold text-forest-950 dark:text-sage-100">{categories.utility || 0}m</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 rounded-xl bg-earth-50 dark:bg-forest-800/40 border border-dashed border-earth-200 dark:border-forest-700 text-center my-4">
                <HelpCircle className="w-6 h-6 mx-auto mb-2 text-earth-400 dark:text-sage-500" />
                <p className="text-xs font-semibold text-forest-900 dark:text-sage-200">No category breakdown recorded</p>
                <p className="text-[11px] text-earth-500 dark:text-sage-400 mt-1">
                  Connect your device or log daily screen time with category splits to visualize focus distribution.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-earth-100 dark:border-forest-800 text-[11px] text-earth-500 dark:text-sage-400">
            {hasCategories ? (
              <>
                Ratio of intentional focus to entertainment: <strong className="text-forest-900 dark:text-sage-200">{(productivePct / (entertainPct || 1)).toFixed(1)}:1</strong>
              </>
            ) : (
              <span>Category tracking uncalibrated</span>
            )}
          </div>
        </div>

        {/* Weekly 7-Day Trend Bars */}
        <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-earth-500 dark:text-sage-400 uppercase tracking-wider">
              7-Day Screen Time Trend
            </h2>
            <span className="text-xs text-earth-500 dark:text-sage-400">Target: {limitHours}h</span>
          </div>

          {hasWeeklyTrends ? (
            <div className="flex items-end justify-between h-36 gap-2 pt-4">
              {weeklyTrends.map((day: any, idx: number) => {
                const heightPct = Math.min(Math.round(((day.total_screen_time_minutes || 0) / 360) * 100), 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-semibold text-earth-600 dark:text-sage-300">
                      {day.total_screen_time_minutes ? `${(day.total_screen_time_minutes / 60).toFixed(1)}h` : '—'}
                    </span>
                    <div className="w-full max-w-[28px] bg-earth-100 dark:bg-forest-800 rounded-t-lg overflow-hidden flex flex-col justify-end h-24">
                      {day.total_screen_time_minutes > 0 && (
                        <div
                          className={`w-full rounded-t-md transition-all ${
                            day.is_target_met ? 'bg-sage-600' : 'bg-amber-500'
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
            <div className="p-6 rounded-xl bg-earth-50 dark:bg-forest-800/40 border border-dashed border-earth-200 dark:border-forest-700 text-center my-auto">
              <Clock className="w-6 h-6 mx-auto mb-2 text-earth-400 dark:text-sage-500" />
              <p className="text-xs font-semibold text-forest-900 dark:text-sage-200">No weekly history available</p>
              <p className="text-[11px] text-earth-500 dark:text-sage-400 mt-1">
                As daily usage accumulates, your 7-day screen time trend will appear here.
              </p>
            </div>
          )}

          <div className="pt-3 mt-2 border-t border-earth-100 dark:border-forest-800 flex items-center justify-between text-[11px] text-earth-500 dark:text-sage-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sage-600"></span> In Boundary
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Near/Exceeded Limit
            </span>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 shadow-soft">
          <div className="flex items-center justify-between text-earth-500 dark:text-sage-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Screen Time</span>
            <Clock className="w-4 h-4 text-sage-600" />
          </div>
          <div className="text-2xl font-semibold text-forest-950 dark:text-sage-100">
            {hasData ? `${totalHours} hrs` : '— hrs'}
          </div>
          <div className="text-xs text-earth-500 dark:text-sage-400 mt-1">
            {hasData ? `${totalMinutes} minutes today` : 'No data recorded today'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 shadow-soft">
          <div className="flex items-center justify-between text-earth-500 dark:text-sage-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Deep Focus Time</span>
            <Eye className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-semibold text-forest-950 dark:text-sage-100">
            {focusHours !== null ? `${focusHours} hrs` : '— hrs'}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            {hasCategories ? `${productivePct}% intentional work` : 'No focus sessions logged'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 shadow-soft">
          <div className="flex items-center justify-between text-earth-500 dark:text-sage-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Notification Exposure</span>
            <Bell className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-semibold text-forest-950 dark:text-sage-100">
            {hasData && data.notification_count !== null && data.notification_count !== undefined
              ? data.notification_count
              : '—'}
          </div>
          <div className="text-xs text-earth-500 dark:text-sage-400 mt-1">
            {hasData && data.notification_count !== null
              ? (data.notification_count > 50 ? 'Interruption index: Elevated' : 'Interruption index: Healthy')
              : 'No notification sync'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 shadow-soft">
          <div className="flex items-center justify-between text-earth-500 dark:text-sage-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Late-Night Exposure</span>
            <Moon className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-semibold text-forest-950 dark:text-sage-100">
            {hasData && data.night_screen_minutes !== null && data.night_screen_minutes !== undefined
              ? `${data.night_screen_minutes} min`
              : '— min'}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            {hasData && data.night_screen_minutes !== null
              ? (data.night_screen_minutes > 30 ? 'Late exposure: Elevated' : 'Within healthy wind-down limits')
              : 'No late-night device data'}
          </div>
        </div>
      </div>

      {/* Sustainable Digital Hygiene Tips */}
      <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft">
        <h2 className="text-sm font-semibold text-forest-950 dark:text-sage-100 mb-2">
          Evidence-Based Digital Guidelines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-earth-600 dark:text-sage-300">
          <div className="p-4 rounded-xl border border-earth-200/80 dark:border-forest-800 bg-earth-50/50 dark:bg-forest-800/40">
            <strong className="block font-semibold text-forest-900 dark:text-sage-100 mb-1">
              The 20-20-20 Rule
            </strong>
            Every 20 minutes of continuous screen gazing, look at an object 20 feet away for at least 20 seconds to relax ciliary eye muscles.
          </div>
          <div className="p-4 rounded-xl border border-earth-200/80 dark:border-forest-800 bg-earth-50/50 dark:bg-forest-800/40">
            <strong className="block font-semibold text-forest-900 dark:text-sage-100 mb-1">
              Evening Blue-Light Curfew
            </strong>
            Transition to warm lighting and dim displays 45 minutes prior to sleep to safeguard natural melatonin onset.
          </div>
          <div className="p-4 rounded-xl border border-earth-200/80 dark:border-forest-800 bg-earth-50/50 dark:bg-forest-800/40">
            <strong className="block font-semibold text-forest-900 dark:text-sage-100 mb-1">
              Notification Batching
            </strong>
            Group non-urgent notifications into two scheduled review windows rather than allowing intermittent alerts throughout the day.
          </div>
        </div>
      </div>
    </div>
  );
};

