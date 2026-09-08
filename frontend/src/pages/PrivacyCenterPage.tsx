import React, { useState, useEffect } from 'react';
import {
  Lock,
  Download,
  Trash2,
  ShieldCheck,
  Camera,
  Brain,
  Watch,
  Keyboard,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { useToast } from '../components/ToastNotification';
import { useConsent } from '../contexts/ConsentContext';

export const PrivacyCenterPage: React.FC = () => {
  const { showToast } = useToast();
  const { updateConsent: updateGlobalConsent } = useConsent();
  const [consent, setConsent] = useState<any>({
    camera_consent: false,
    memory_consent: true,
    wearable_consent: false,
    typing_dynamics_consent: false,
    store_facial_data: false,
  });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadConsent();
  }, []);

  const loadConsent = async () => {
    try {
      const res = await ApiService.getConsent();
      setConsent(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = async (key: string) => {
    const updated = { ...consent, [key]: !consent[key] };
    setConsent(updated);
    setSaving(true);
    try {
      await ApiService.updateConsent({ [key]: updated[key] });
      try {
        await updateGlobalConsent(key as any, updated[key]);
      } catch {}
      setSavedSuccess(true);
      showToast(`${key.replace(/_/g, ' ')} permission updated.`, 'success');
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      showToast('Could not update consent setting.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await ApiService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guideme_personal_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Personal data exported successfully.', 'success');
    } catch (e) {
      showToast('Could not export personal data.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      confirm(
        'WARNING: This will permanently delete your account, journals, personality assessments, and all associated data. This action is irreversible. Proceed?'
      )
    ) {
      try {
        await ApiService.deleteAccount();
        showToast('Your account and personal data have been completely erased.', 'info');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1200);
      } catch (e) {
        showToast('Could not delete account.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-forest-950 dark:text-sage-100 flex items-center gap-2">
          <Lock className="w-5 h-5 text-sage-600 dark:text-sage-400" />
          <span>Privacy & Data Sovereignty Center</span>
        </h1>
        <p className="text-xs text-earth-600 dark:text-sage-400 mt-0.5">
          You own your biological and mental wellness data. Control granular permissions, export your complete archive, or purge your account.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Privacy preferences updated and saved.</span>
        </div>
      )}

      {/* Consent Toggles Grid */}
      <div className="bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-forest-950 dark:text-sage-100">
          Granular Feature & Sensor Permissions
        </h2>

        <div className="divide-y divide-earth-100 dark:divide-forest-800">
          {/* Camera Consent */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Camera className="w-4 h-4 text-sage-600 mt-0.5" />
              <div>
                <strong className="block text-xs font-semibold text-forest-900 dark:text-sage-100">
                  Camera Access & Facial Landmark Analysis
                </strong>
                <span className="text-[11px] text-earth-500 dark:text-sage-400">
                  Enables in-memory video frame landmark estimation. Frames are never stored to disk or database.
                </span>
              </div>
            </div>
            <button
              onClick={() => handleToggle('camera_consent')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                consent.camera_consent ? 'bg-sage-600' : 'bg-earth-300 dark:bg-forest-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  consent.camera_consent ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Store Facial Data (Off by default) */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-amber-500 mt-0.5" />
              <div>
                <strong className="block text-xs font-semibold text-forest-900 dark:text-sage-100">
                  Store Raw Facial Images
                </strong>
                <span className="text-[11px] text-earth-500 dark:text-sage-400">
                  Strictly disabled by default for privacy preservation. Even when enabled, GUIDE ME enforces ephemeral processing.
                </span>
              </div>
            </div>
            <button
              onClick={() => handleToggle('store_facial_data')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                consent.store_facial_data ? 'bg-sage-600' : 'bg-earth-300 dark:bg-forest-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  consent.store_facial_data ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* AI Memory */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Brain className="w-4 h-4 text-indigo-500 mt-0.5" />
              <div>
                <strong className="block text-xs font-semibold text-forest-900 dark:text-sage-100">
                  AI Companion Personalization & Memory
                </strong>
                <span className="text-[11px] text-earth-500 dark:text-sage-400">
                  Allows the companion to remember your explicit preferences. You can inspect or delete memories anytime.
                </span>
              </div>
            </div>
            <button
              onClick={() => handleToggle('memory_consent')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                consent.memory_consent ? 'bg-sage-600' : 'bg-earth-300 dark:bg-forest-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  consent.memory_consent ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Wearable Sync */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Watch className="w-4 h-4 text-emerald-500 mt-0.5" />
              <div>
                <strong className="block text-xs font-semibold text-forest-900 dark:text-sage-100">
                  Wearable Physiological Signal Sync
                </strong>
                <span className="text-[11px] text-earth-500 dark:text-sage-400">
                  Synchronizes resting HR, sleep duration, and HRV autonomic indicators for personal baseline calculations.
                </span>
              </div>
            </div>
            <button
              onClick={() => handleToggle('wearable_consent')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                consent.wearable_consent ? 'bg-sage-600' : 'bg-earth-300 dark:bg-forest-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  consent.wearable_consent ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Typing Dynamics */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Keyboard className="w-4 h-4 text-sage-600 mt-0.5" />
              <div>
                <strong className="block text-xs font-semibold text-forest-900 dark:text-sage-100">
                  Typing Cadence & Rhythm Dynamics
                </strong>
                <span className="text-[11px] text-earth-500 dark:text-sage-400">
                  Measures typing hesitation and backspace cadence to correlate with personal baseline cognitive load.
                </span>
              </div>
            </div>
            <button
              onClick={() => handleToggle('typing_dynamics_consent')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                consent.typing_dynamics_consent ? 'bg-sage-600' : 'bg-earth-300 dark:bg-forest-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  consent.typing_dynamics_consent ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Data Portability & Account Purge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Data */}
        <div className="bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-forest-950 dark:text-sage-100 mb-1 flex items-center gap-2">
              <Download className="w-4 h-4 text-sage-600" />
              <span>Full Data Export (Portability)</span>
            </h3>
            <p className="text-xs text-earth-600 dark:text-sage-300 mt-1 leading-relaxed">
              Download your entire digital wellness archive including journals, NLP reflections, mood logs, and goals in standard JSON format.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-earth-100 dark:border-forest-800">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Generating JSON Package...' : 'Download JSON Archive'}</span>
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="bg-white dark:bg-forest-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200 mb-1 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Permanent Account & Data Erasure</span>
            </h3>
            <p className="text-xs text-rose-800/80 dark:text-rose-300 mt-1 leading-relaxed">
              Instantly purge your user credentials, profile, conversation messages, memories, and health records across all database tables.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-rose-100 dark:border-rose-900/40">
            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Permanently Delete My Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
