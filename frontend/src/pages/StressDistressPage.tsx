import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Heart,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  CheckCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  Smile,
  X,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { useToast } from '../components/ToastNotification';

export const StressDistressPage: React.FC = () => {
  const { showToast } = useToast();
  const [stressData, setStressData] = useState<any>(null);
  const [recentMoods, setRecentMoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [showDistressModal, setShowDistressModal] = useState(false);
  const [distressTrigger, setDistressTrigger] = useState('');
  const [distressSymptoms, setDistressSymptoms] = useState<string[]>([]);
  const [distressSubmitted, setDistressSubmitted] = useState(false);

  // Mood Pulse Check-In State
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [moodScore, setMoodScore] = useState<number>(7.0);
  const [energyLevel, setEnergyLevel] = useState<string>('moderate');
  const [moodTags, setMoodTags] = useState<string[]>(['calm']);
  const [moodNote, setMoodNote] = useState<string>('');
  const [submittingMood, setSubmittingMood] = useState(false);

  useEffect(() => {
    const loadStress = async () => {
      try {
        const [latestStress, moods] = await Promise.allSettled([
          ApiService.getLatestStress(),
          ApiService.listMoods(),
        ]);
        if (latestStress.status === 'fulfilled' && latestStress.value) {
          setStressData(latestStress.value);
        } else {
          const evaluated = await ApiService.evaluateStress();
          setStressData(evaluated);
        }
        if (moods.status === 'fulfilled') {
          setRecentMoods(moods.value || []);
        }
      } catch (err) {
        console.error('Failed to load stress data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStress();
  }, []);

  const handleSaveMood = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingMood(true);
    try {
      const valence = Number(((moodScore - 5.5) / 4.5).toFixed(2));
      const arousal = energyLevel === 'high' ? 0.8 : energyLevel === 'low' ? 0.3 : 0.5;
      await ApiService.logMood({
        score: Number(moodScore),
        valence,
        arousal,
        energy_level: energyLevel,
        tags: moodTags,
        note: moodNote.trim() || undefined,
      });
      showToast(`Mood Pulse (${moodScore}/10) logged successfully!`, 'success');
      setShowMoodModal(false);
      setMoodNote('');
      const updatedMoods = await ApiService.listMoods().catch(() => []);
      setRecentMoods(updatedMoods);
      const evaluated = await ApiService.evaluateStress().catch(() => null);
      if (evaluated) setStressData(evaluated);
    } catch (err) {
      showToast('Could not record Mood Pulse.', 'error');
    } finally {
      setSubmittingMood(false);
    }
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const res = await ApiService.evaluateStress();
      setStressData(res);
      showToast('Stress assessment recalculated.', 'success');
    } catch (e) {
      showToast('Could not evaluate current stress.', 'error');
    } finally {
      setEvaluating(false);
    }
  };

  const handleReportDistress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.reportDistress({
        risk_level: 'moderate',
        triggers: [distressTrigger],
        symptoms: distressSymptoms,
      });
      setDistressSubmitted(true);
      showToast('Distress report recorded.', 'success');
    } catch (e) {
      showToast('Could not submit distress report.', 'error');
    }
  };

  const toggleSymptom = (s: string) => {
    setDistressSymptoms((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  const hasScore = stressData && stressData.score !== null && stressData.score !== undefined;
  const scoreVal = hasScore ? Math.round(stressData.score) : null;
  const isUncalibrated = !hasScore || stressData?.risk_band === 'uncalibrated' || stressData?.insufficient_data;

  // Gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = hasScore
    ? circumference - (circumference * Math.min(Math.max(scoreVal || 0, 0), 100)) / 100
    : circumference;

  const getRiskColor = (band?: string) => {
    switch (band) {
      case 'low':
        return {
          stroke: '#10b981',
          bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'moderate':
        return {
          stroke: '#f59e0b',
          bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 'elevated':
        return {
          stroke: '#f97316',
          bg: 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        };
      case 'critical':
        return {
          stroke: '#e11d48',
          bg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        };
      default:
        return {
          stroke: '#94a3b8',
          bg: 'bg-earth-100 dark:bg-forest-800 text-earth-700 dark:text-sage-300 border-earth-200 dark:border-forest-700',
        };
    }
  };

  const riskStyle = getRiskColor(stressData?.risk_band);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-forest-950 dark:text-sage-50 flex items-center gap-2">
            <Activity className="w-5 h-5 text-sage-600 dark:text-sage-400" />
            <span>Stress & Distress Multi-Signal Monitor</span>
          </h1>
          <p className="text-sm text-earth-600 dark:text-sage-400 mt-1 leading-relaxed">
            Evaluates physiological autonomic tone, digital screen exposure, and personal baseline deviation without synthetic approximations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowMoodModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shadow-soft"
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Log Mood Pulse</span>
          </button>
          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold transition-colors shadow-soft disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            <span>{evaluating ? 'Evaluating Signals...' : 'Re-Evaluate Stress'}</span>
          </button>
          <button
            onClick={() => setShowDistressModal(true)}
            className="px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 transition-colors"
          >
            Log Acute Distress
          </button>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Composite Score Circular Gauge Card */}
        <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-earth-500 dark:text-sage-400 tracking-wider">
                Multimodal Composite Score
              </span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${riskStyle.bg} capitalize`}>
                {isUncalibrated ? 'Uncalibrated' : stressData?.risk_band}
              </span>
            </div>

            {/* Circular Gauge Visualization */}
            <div className="flex flex-col items-center justify-center my-6">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 128 128">
                  {/* Track circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-earth-100 dark:stroke-forest-800"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {/* Score circle */}
                  {hasScore ? (
                    <circle
                      cx="64"
                      cy="64"
                      r={radius}
                      stroke={riskStyle.stroke}
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700 ease-out"
                    />
                  ) : (
                    <circle
                      cx="64"
                      cy="64"
                      r={radius}
                      stroke="#cbd5e1"
                      strokeWidth="10"
                      strokeDasharray="4 6"
                      fill="transparent"
                    />
                  )}
                </svg>

                {/* Score Number in Center */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold text-forest-950 dark:text-sage-100">
                    {hasScore ? scoreVal : '—'}
                  </span>
                  <span className="text-[11px] text-earth-400 font-medium">
                    {hasScore ? '/ 100' : 'No data yet'}
                  </span>
                </div>
              </div>

              {/* Confidence Subtext */}
              <p className="text-xs text-earth-500 dark:text-sage-400 mt-1">
                {hasScore
                  ? `${Math.round((stressData?.confidence || 0) * 100)}% Model Confidence`
                  : 'Requires mood, biometric, or digital signals'}
              </p>
            </div>

            {/* Scale indicator */}
            <div className="space-y-1">
              <div className="h-2 w-full bg-earth-200 dark:bg-forest-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 w-1/4" title="Low (0-29)" />
                <div className="h-full bg-amber-400 w-1/4" title="Moderate (30-59)" />
                <div className="h-full bg-orange-500 w-1/4" title="Elevated (60-79)" />
                <div className="h-full bg-rose-600 w-1/4" title="Critical (80-100)" />
              </div>
              <div className="flex justify-between text-[10px] text-earth-400">
                <span>0 Low</span>
                <span>30 Mod</span>
                <span>60 High</span>
                <span>100 Crit</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-earth-100 dark:border-forest-800 text-[11px] text-earth-500 dark:text-sage-400 flex items-center justify-between">
            <span>Source: <strong className="capitalize">{isUncalibrated ? 'Uncalibrated' : (stressData?.source || 'Multimodal Fusion')}</strong></span>
            {isUncalibrated && (
              <span className="text-amber-600 dark:text-amber-400 text-[10px] font-semibold">Awaiting input</span>
            )}
          </div>
        </div>

        {/* Personal Baseline Deviation */}
        <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-earth-500 dark:text-sage-400 tracking-wider">
              Personal Baseline Comparison
            </span>

            <div className="flex items-center gap-2 mt-4">
              <span className="text-3xl font-bold text-forest-950 dark:text-sage-100">
                {stressData?.deviation_from_baseline !== null && stressData?.deviation_from_baseline !== undefined
                  ? `${stressData.deviation_from_baseline > 0 ? '+' : ''}${stressData.deviation_from_baseline}σ`
                  : '—'}
              </span>

              {stressData?.deviation_from_baseline !== null && stressData?.deviation_from_baseline !== undefined ? (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                  stressData.deviation_from_baseline <= 0
                    ? 'bg-emerald-100 dark:bg-forest-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                }`}>
                  {stressData.deviation_from_baseline <= 0 ? (
                    <>
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>Below Baseline</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Above Baseline</span>
                    </>
                  )}
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-earth-100 dark:bg-forest-800 text-earth-600 dark:text-sage-400 font-medium">
                  Uncalibrated
                </span>
              )}
            </div>

            <p className="text-xs text-earth-600 dark:text-sage-300 leading-relaxed mt-4">
              {stressData?.deviation_from_baseline !== null && stressData?.deviation_from_baseline !== undefined
                ? 'GUIDE ME evaluates your load against your own 14-day rolling window rather than population-wide averages.'
                : 'No baseline established yet. Log consecutive days of mood, sleep, or digital wellbeing to calibrate your personal baseline variance.'}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-earth-100 dark:border-forest-800 text-[11px] text-earth-500 dark:text-sage-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Baseline Window: 14-day weighted moving average</span>
          </div>
        </div>

        {/* Evidence & Signals Breakdown */}
        <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-earth-500 dark:text-sage-400 tracking-wider">
              Active Signal Evidence
            </span>

            <div className="space-y-2 mt-4 text-xs">
              {stressData?.evidence && Object.keys(stressData.evidence).length > 0 ? (
                Object.entries(stressData.evidence).map(([key, val]: any) => (
                  <div key={key} className="p-2.5 rounded-lg bg-earth-50 dark:bg-forest-800/60 border border-earth-200 dark:border-forest-700">
                    <span className="block font-semibold capitalize text-forest-900 dark:text-sage-200 text-[11px] mb-0.5">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-earth-600 dark:text-sage-300 text-[11px]">{val}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-earth-50 dark:bg-forest-800/40 border border-dashed border-earth-200 dark:border-forest-700 text-center text-earth-500 dark:text-sage-400">
                  <HelpCircle className="w-6 h-6 mx-auto mb-1.5 text-earth-400 dark:text-sage-500" />
                  <p className="text-xs font-medium text-forest-900 dark:text-sage-200">No active signals detected</p>
                  <p className="text-[11px] mt-1 leading-relaxed">
                    Log a mood check-in, record a journal entry, or connect a biometric device to generate real stress evidence.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-earth-100 dark:border-forest-800 flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Lifestyle awareness only — Not a clinical diagnosis</span>
          </div>
        </div>
      </div>

      {/* Distress Event Modal with Verified Indian Crisis Helplines */}
      {showDistressModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-earth-200/80 dark:border-forest-800 pb-3">
              <h2 className="text-base font-semibold text-forest-950 dark:text-sage-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Log Acute Distress Event</span>
              </h2>
              <button
                onClick={() => setShowDistressModal(false)}
                className="text-earth-400 hover:text-earth-600 dark:text-sage-400"
              >
                ✕
              </button>
            </div>

            {distressSubmitted ? (
              <div className="space-y-4 text-center py-4">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-semibold text-forest-900 dark:text-sage-100">Distress Event Logged Safely</h3>
                <p className="text-xs text-earth-600 dark:text-sage-300 leading-relaxed">
                  Your safety and wellbeing are paramount. If you feel overwhelmed or in danger, please reach out immediately to 24/7 confidential crisis support:
                </p>

                <div className="p-4 rounded-xl bg-earth-50 dark:bg-forest-800 text-xs text-left space-y-2.5 border border-earth-200 dark:border-forest-700">
                  <div className="flex justify-between items-center pb-1.5 border-b border-earth-200/60 dark:border-forest-700">
                    <div>
                      <div className="font-semibold text-forest-900 dark:text-sage-100">Tele-MANAS (Govt. of India 24/7)</div>
                      <div className="text-[11px] text-earth-500 dark:text-sage-400">National Tele Mental Health Programme</div>
                    </div>
                    <a href="tel:14416" className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
                      14416 / 1800-891-4416
                    </a>
                  </div>

                  <div className="flex justify-between items-center pb-1.5 border-b border-earth-200/60 dark:border-forest-700">
                    <div>
                      <div className="font-semibold text-forest-900 dark:text-sage-100">KIRAN Mental Health Support</div>
                      <div className="text-[11px] text-earth-500 dark:text-sage-400">Ministry of Social Justice 24/7</div>
                    </div>
                    <a href="tel:18005990019" className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
                      1800-599-0019
                    </a>
                  </div>

                  <div className="flex justify-between items-center pb-1.5 border-b border-earth-200/60 dark:border-forest-700">
                    <div>
                      <div className="font-semibold text-forest-900 dark:text-sage-100">Vandrevala Foundation</div>
                      <div className="text-[11px] text-earth-500 dark:text-sage-400">24/7 Free Crisis Counseling</div>
                    </div>
                    <a href="tel:+919999666555" className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
                      +91 9999 666 555
                    </a>
                  </div>

                  <div className="flex justify-between items-center pb-1.5 border-b border-earth-200/60 dark:border-forest-700">
                    <div>
                      <div className="font-semibold text-forest-900 dark:text-sage-100">National Emergency Services</div>
                      <div className="text-[11px] text-earth-500 dark:text-sage-400">Immediate Police / Ambulance</div>
                    </div>
                    <a href="tel:112" className="text-rose-600 dark:text-rose-400 font-bold hover:underline">
                      112
                    </a>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-forest-900 dark:text-sage-100">AASRA Helpline</div>
                      <div className="text-[11px] text-earth-500 dark:text-sage-400">24/7 Suicide Prevention</div>
                    </div>
                    <a href="tel:+919820466726" className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
                      +91 98204 66726
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowDistressModal(false);
                    setDistressSubmitted(false);
                  }}
                  className="px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Close & Return
                </button>
              </div>
            ) : (
              <form onSubmit={handleReportDistress} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">
                    Primary Trigger / Situation
                  </label>
                  <input
                    type="text"
                    required
                    value={distressTrigger}
                    onChange={(e) => setDistressTrigger(e.target.value)}
                    placeholder="e.g., Intense sensory overload, sudden deadline pressure, emotional confrontation..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1.5">
                    Physical & Cognitive Symptoms
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Racing heart / Palpitations',
                      'Rapid breathing / Shortness of breath',
                      'Chest tightness',
                      'Tunnel vision / Brain fog',
                      'Trembling / Shaking',
                      'Severe tearfulness / Emptiness',
                    ].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => toggleSymptom(s)}
                        className={`p-2 rounded-lg text-left text-xs border transition-colors ${
                          distressSymptoms.includes(s)
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-800 dark:text-rose-200 font-medium'
                            : 'border-earth-200 dark:border-forest-700 bg-earth-50/50 dark:bg-forest-800 text-earth-700 dark:text-sage-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-earth-100 dark:border-forest-800">
                  <button
                    type="button"
                    onClick={() => setShowDistressModal(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-earth-300 dark:border-forest-700 text-xs font-medium text-earth-700 dark:text-sage-300 hover:bg-earth-50 dark:hover:bg-forest-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-soft transition-colors"
                  >
                    Record Event & View De-escalation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Mood Pulse Check-In Modal */}
      {showMoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-earth-200/80 dark:border-forest-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                  <Smile className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-forest-950 dark:text-sage-100">
                    Log Mood Pulse
                  </h3>
                  <p className="text-xs text-earth-500 dark:text-sage-400">
                    Calibrate real-time emotional state with autonomic signals
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMoodModal(false)}
                className="p-1.5 rounded-lg hover:bg-earth-100 dark:hover:bg-forest-800 text-earth-500 dark:text-sage-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMood} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-earth-700 dark:text-sage-300">
                    Overall Mood Rating
                  </label>
                  <span className="text-lg font-bold text-sage-600 dark:text-sage-400">
                    {moodScore.toFixed(1)} <span className="text-xs font-normal text-earth-500 dark:text-sage-400">/ 10</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={moodScore}
                  onChange={(e) => setMoodScore(parseFloat(e.target.value))}
                  className="w-full accent-sage-600 cursor-pointer h-2 bg-earth-200 dark:bg-forest-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[11px] text-earth-500 dark:text-sage-400 mt-1">
                  <span>1.0 · Low</span>
                  <span>5.5 · Balanced</span>
                  <span>10.0 · Vibrant</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1.5">
                  Current Vitality / Energy Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'moderate', 'high'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEnergyLevel(lvl)}
                      className={`py-2 px-3 text-xs font-medium rounded-xl border capitalize transition-all ${
                        energyLevel === lvl
                          ? 'bg-sage-600 border-sage-600 text-white shadow-soft'
                          : 'bg-earth-50 dark:bg-forest-800/60 border-earth-200 dark:border-forest-700 text-earth-700 dark:text-sage-300 hover:border-sage-400'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1.5">
                  Emotion Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['calm', 'grateful', 'focused', 'energized', 'anxious', 'tired', 'reflective', 'hopeful', 'stressed'].map((tag) => {
                    const selected = moodTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (selected) setMoodTags(moodTags.filter((t) => t !== tag));
                          else setMoodTags([...moodTags, tag]);
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          selected
                            ? 'bg-sage-100 dark:bg-forest-800 border-sage-500 text-sage-800 dark:text-sage-200 font-medium'
                            : 'bg-white dark:bg-forest-900 border-earth-200/80 dark:border-forest-800 text-earth-600 dark:text-sage-400 hover:border-earth-400'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">
                  Notes / Context (Optional)
                </label>
                <textarea
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-950 text-forest-950 dark:text-sage-100 focus:outline-none focus:ring-1 focus:ring-sage-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-earth-200/80 dark:border-forest-800">
                <button
                  type="button"
                  onClick={() => setShowMoodModal(false)}
                  className="px-4 py-2 text-xs font-medium text-earth-700 dark:text-sage-300 hover:bg-earth-100 dark:hover:bg-forest-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMood}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sage-600 hover:bg-sage-700 rounded-xl transition-colors shadow-soft disabled:opacity-50"
                >
                  {submittingMood ? 'Recording...' : 'Save Mood Pulse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

