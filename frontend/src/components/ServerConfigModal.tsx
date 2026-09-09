import React, { useState, useEffect } from 'react';
import { Server, Wifi, CheckCircle2, AlertCircle, RefreshCw, X, Save } from 'lucide-react';
import { ApiService } from '../services/api';

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(ApiService.getApiBaseUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await ApiService.testConnection(url.trim());
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ ok: false, message: e?.message || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    ApiService.setCustomApiBaseUrl(url.trim());
    onClose();
    // Reload if needed to reinitialize queries
    window.location.reload();
  };

  const handleReset = () => {
    ApiService.setCustomApiBaseUrl('');
    setUrl(ApiService.getApiBaseUrl());
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-earth-200/80 dark:border-forest-800 flex items-center justify-between bg-earth-50/60 dark:bg-forest-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sage-100 dark:bg-forest-800 flex items-center justify-center text-sage-700 dark:text-sage-300">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-forest-950 dark:text-sage-100">Backend Server Connection</h3>
              <p className="text-[11px] text-earth-500 dark:text-sage-400">Configure host for cross-device APK use</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-earth-400 hover:text-forest-900 dark:hover:text-sage-200 hover:bg-earth-100 dark:hover:bg-forest-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-forest-900 dark:text-sage-200 mb-1">
              Backend API Server URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setTestResult(null);
              }}
              placeholder="https://guide-me-kja5.onrender.com/api/v1"
              className="w-full px-3 py-2 text-xs rounded-xl border border-earth-300 dark:border-forest-700 bg-earth-50/50 dark:bg-forest-800 text-forest-950 dark:text-sage-100 outline-none focus:ring-2 focus:ring-sage-500 font-mono"
            />
            <p className="text-[10px] text-earth-400 dark:text-sage-400 mt-1">
              • Production Cloud Backend: <code>https://guide-me-kja5.onrender.com/api/v1</code>
            </p>
          </div>

          {/* Test connection result */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                testResult.ok
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              )}
              <div>
                <p className="font-semibold text-xs">{testResult.ok ? 'Connection Verified' : 'Connection Failed'}</p>
                <p className="text-[11px] opacity-90">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] text-earth-500 dark:text-sage-400 hover:text-forest-900 dark:hover:text-sage-200 underline"
            >
              Reset to Default
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !url.trim()}
                className="px-3 py-2 rounded-xl border border-earth-300 dark:border-forest-700 hover:bg-earth-100 dark:hover:bg-forest-800 text-forest-900 dark:text-sage-200 font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-3.5 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-soft"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save & Apply</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
