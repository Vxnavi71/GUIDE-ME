import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Activity,
  Moon,
  Smartphone,
  Smile,
  ArrowUpRight,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Flame,
  Check,
  Watch,
  BookOpen,
  Camera,
  Bot,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ApiService } from '../services/api';
import { CircularProgressRing } from '../components/CircularProgressRing';

interface DashboardSummary {
  user_name: string;
  baseline_calibrated: boolean;
  stress_deviation: number | null;
  latest_mood: number | null;
  mood_label: string | null;
  stress_score: number | null;
  stress_risk_band: string | null;
  sleep_hours: number | null;
  sleep_target: number;
  hrv_ms: number | null;
  resting_hr: number | null;
  screen_time_hours: number | null;
  screen_time_target_hours: number;
  focus_time_hours: number | null;
  pickup_count: number | null;
  habits_completed_today: number;
  habits_total_today: number;
  habit_completion_rate: number;
  active_goals_count: number;
  trends_7d: Array<{ day: string; date: string; mood: number | null; stress: number | null }>;
  wearable_provider_mode: string;
  screen_provider_mode: string;
}

export const DashboardOverview: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingHabitId, setTogglingHabitId] = useState<string | null>(null);

  const loadDashboardData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);

    try {
      const [sumRes, goalsRes, habitsRes, recsRes] = await Promise.allSettled([
        ApiService.getDashboardSummary(),
        ApiService.listGoals(),
        ApiService.listHabits(),
        ApiService.getRecommendations(),
      ]);

      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value);
      }
      if (goalsRes.status === 'fulfilled') {
        setGoals(goalsRes.value);
      }
      if (habitsRes.status === 'fulfilled') {
        setHabits(habitsRes.value);
      }
      if (recsRes.status === 'fulfilled') {
        setRecommendations(recsRes.value);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  const handleToggleHabit = async (habitId: string) => {
    setTogglingHabitId(habitId);
    try {
      await ApiService.toggleHabit(habitId);
      await loadDashboardData(false);
    } catch (err) {
      console.error('Failed to toggle habit from dashboard:', err);
    } finally {
      setTogglingHabitId(null);
    }
  };

  const userName = summary?.user_name || 'Friend';
  const latestMood = summary?.latest_mood ?? null;
  const moodLabel = summary?.mood_label || (latestMood !== null ? 'Recorded' : 'No mood logged yet');
  const stressScore = summary?.stress_score ?? null;
  const stressRisk = summary?.stress_risk_band || null;
  const stressDeviation = summary?.stress_deviation ?? null;
  const sleepHours = summary?.sleep_hours ?? null;
  const sleepTarget = summary?.sleep_target ?? 8.0;
  const hrv = summary?.hrv_ms ?? null;
  const restingHr = summary?.resting_hr ?? null;
  const screenHours = summary?.screen_time_hours ?? null;
  const screenTarget = summary?.screen_time_target_hours ?? 5.0;
  const focusHours = summary?.focus_time_hours ?? null;
  const pickups = summary?.pickup_count ?? null;

  const rawTrends = summary?.trends_7d || [];
  const hasTrendData = rawTrends.some((p) => p.mood !== null || p.stress !== null);
  const chartData = rawTrends.map((p) => ({
    day: p.day,
    mood: p.mood !== null ? p.mood : undefined,
    stress: p.stress !== null ? p.stress : undefined,
  }));

  const sleepPercent = sleepHours !== null ? Math.min(Math.round((sleepHours / sleepTarget) * 100), 100) : 0;
  const screenPercent = screenHours !== null ? Math.min(Math.round((screenHours / screenTarget) * 100), 100) : 0;
  const habitPercent = summary?.habit_completion_rate ?? 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <RefreshCw className="w-8 h-8 text-sage-600 animate-spin" />
        <p className="text-sm font-medium text-earth-600 dark:text-sage-400">
          Synthesizing personal baseline & wellbeing telemetry...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome & Baseline Status */}
      <div className="bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              summary?.baseline_calibrated
                ? 'bg-sage-100 dark:bg-forest-800 text-sage-700 dark:text-sage-300'
                : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{summary?.baseline_calibrated ? 'Personal Baseline Calibrated' : 'Baseline Uncalibrated (Log 3+ entries)'}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-earth-100 dark:bg-forest-800 text-earth-600 dark:text-sage-400">
              {summary?.wearable_provider_mode === 'connected' ? 'Hardware Synchronized' : 'Wearable Not Connected'}
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-forest-950 dark:text-sage-100">
            Good day, {userName}
          </h1>
          <p className="text-sm text-earth-600 dark:text-sage-400 mt-1 max-w-2xl">
            {stressDeviation !== null ? (
              <>
                Your personal autonomic stress deviation is{' '}
                <span className={`font-semibold ${stressDeviation <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {stressDeviation > 0 ? `+${stressDeviation}` : stressDeviation}σ
                </span>{' '}
                relative to your rolling norm.
              </>
            ) : (
              'Welcome to your personal wellbeing dashboard. Start by logging your mood, writing a reflection, or syncing your wearable device.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => loadDashboardData(false)}
            disabled={refreshing}
            title="Refresh Real-time Telemetry"
            className="p-2.5 rounded-xl border border-earth-300 dark:border-forest-700 hover:bg-earth-100 dark:hover:bg-forest-800 text-earth-700 dark:text-sage-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sage-600' : ''}`} />
          </button>
          <Link
            to="/dashboard/companion"
            className="px-4 py-2.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-medium text-sm transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4" />
            <span>Reflect with AI</span>
          </Link>
          <Link
            to="/dashboard/facial-analysis"
            className="px-4 py-2.5 rounded-xl border border-earth-300 dark:border-forest-700 hover:bg-earth-100 dark:hover:bg-forest-800 text-earth-800 dark:text-sage-200 text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4" />
            <span>Facial Signals</span>
          </Link>
        </div>
      </div>

      {/* 4 Pulse Cards with Mini Visuals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mood Pulse */}
        <div className="p-5 rounded-2xl bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-earth-500 dark:text-sage-400 mb-1">
              <Smile className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium uppercase tracking-wider">Mood Pulse</span>
            </div>
            <div className="text-2xl font-bold text-forest-950 dark:text-sage-100">
              {latestMood !== null ? (
                <>
                  {latestMood} <span className="text-sm font-normal text-earth-500 dark:text-sage-400">/ 10</span>
                </>
              ) : (
                <span className="text-earth-400 dark:text-forest-600">—</span>
              )}
            </div>
            <div className="text-xs text-earth-500 dark:text-sage-400 flex items-center gap-1 mt-1 font-medium">
              {latestMood !== null ? (
                <>
                  {latestMood >= 7 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{moodLabel}</span>
                </>
              ) : (
                <Link to="/dashboard/mood-stress" className="text-sage-600 hover:underline">Log today's mood</Link>
              )}
            </div>
          </div>
          <Link to="/dashboard/mood-stress" className="text-earth-400 hover:text-sage-600">
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stress Index */}
        <div className="p-5 rounded-2xl bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-earth-500 dark:text-sage-400 mb-1">
              <Activity className="w-4 h-4 text-sage-600" />
              <span className="text-xs font-medium uppercase tracking-wider">Stress Index</span>
            </div>
            <div className="text-2xl font-bold text-forest-950 dark:text-sage-100">
              {stressScore !== null ? (
                <>
                  {Math.round(stressScore)}{' '}
                  <span className="text-sm font-normal text-earth-500 dark:text-sage-400">/ 100</span>
                </>
              ) : (
                <span className="text-earth-400 dark:text-forest-600">—</span>
              )}
            </div>
            <div className={`text-xs flex items-center gap-1 mt-1 font-medium ${
              stressRisk === 'low' ? 'text-emerald-600 dark:text-emerald-400' : stressRisk ? 'text-amber-600 dark:text-amber-400' : 'text-earth-400'
            }`}>
              {stressRisk ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{stressRisk.toUpperCase()} Band {stressDeviation !== null ? `(${stressDeviation > 0 ? `+${stressDeviation}` : stressDeviation}σ)` : ''}</span>
                </>
              ) : (
                <span>Not enough data yet</span>
              )}
            </div>
          </div>
          <Link to="/dashboard/mood-stress" className="text-earth-400 hover:text-sage-600">
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Sleep Recovery */}
        <div className="p-5 rounded-2xl bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-earth-500 dark:text-sage-400 mb-1">
              <Moon className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-medium uppercase tracking-wider">Sleep Recovery</span>
            </div>
            <div className="text-2xl font-bold text-forest-950 dark:text-sage-100">
              {sleepHours !== null ? (
                <>
                  {sleepHours} <span className="text-sm font-normal text-earth-500 dark:text-sage-400">hrs</span>
                </>
              ) : (
                <span className="text-earth-400 dark:text-forest-600">—</span>
              )}
            </div>
            <div className="text-xs text-earth-500 dark:text-sage-400 mt-1">
              {hrv !== null && restingHr !== null ? (
                `HRV ${hrv}ms · Resting HR ${restingHr} bpm`
              ) : (
                <Link to="/dashboard/wearables" className="text-sage-600 hover:underline">Device not connected</Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sleepHours !== null ? (
              <CircularProgressRing
                progress={sleepPercent}
                size={48}
                strokeWidth={4}
                circleColor="text-earth-200 dark:text-forest-800"
                progressColor="text-indigo-500 dark:text-indigo-400"
                centerContent={<span className="text-[10px] font-bold text-forest-950 dark:text-sage-100">{sleepPercent}%</span>}
              />
            ) : (
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-earth-200 dark:border-forest-800 flex items-center justify-center text-xs text-earth-400">
                —
              </div>
            )}
            <Link to="/dashboard/wearables" className="text-earth-400 hover:text-sage-600">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Digital Balance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-earth-500 dark:text-sage-400 mb-1">
              <Smartphone className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium uppercase tracking-wider">Digital Balance</span>
            </div>
            <div className="text-2xl font-bold text-forest-950 dark:text-sage-100">
              {screenHours !== null ? (
                <>
                  {screenHours} <span className="text-sm font-normal text-earth-500 dark:text-sage-400">hrs</span>
                </>
              ) : (
                <span className="text-earth-400 dark:text-forest-600">—</span>
              )}
            </div>
            <div className="text-xs text-earth-500 dark:text-sage-400 mt-1">
              {screenHours !== null ? (
                `${focusHours ?? 0}h focus · ${pickups ?? 0} pickups`
              ) : (
                <Link to="/dashboard/digital-wellbeing" className="text-sage-600 hover:underline">Device not connected</Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {screenHours !== null ? (
              <CircularProgressRing
                progress={screenPercent}
                size={48}
                strokeWidth={4}
                circleColor="text-earth-200 dark:text-forest-800"
                progressColor={screenHours > screenTarget ? "text-amber-500" : "text-blue-500"}
                centerContent={<span className="text-[10px] font-bold text-forest-950 dark:text-sage-100">{screenPercent}%</span>}
              />
            ) : (
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-earth-200 dark:border-forest-800 flex items-center justify-center text-xs text-earth-400">
                —
              </div>
            )}
            <Link to="/dashboard/digital-wellbeing" className="text-earth-400 hover:text-sage-600">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Charts & Habits/Goals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-forest-950 dark:text-sage-100">
                7-Day Wellness & Resilience Trajectory
              </h2>
              <p className="text-xs text-earth-500 dark:text-sage-400">
                Dynamic multimodal cross-correlation of emotional valence vs. autonomic stress load
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sage-700 dark:text-sage-300 bg-sage-50 dark:bg-forest-800 py-1 px-2.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-sage-600 inline-block" /> Mood
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 py-1 px-2.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Stress
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {hasTrendData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5a825a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#5a825a" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e06c75" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#e06c75" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ece5" className="dark:stroke-forest-800" />
                  <XAxis dataKey="day" stroke="#7e6f5a" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#7e6f5a" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2f27',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#e5ece5',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => [
                      value !== undefined ? (name === 'Mood (1-10)' ? `${value} / 10` : `${value} / 100`) : 'No record',
                      name,
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="#466846"
                    strokeWidth={2}
                    connectNulls={true}
                    fillOpacity={1}
                    fill="url(#colorMood)"
                    name="Mood (1-10)"
                  />
                  <Area
                    type="monotone"
                    dataKey="stress"
                    stroke="#c55353"
                    strokeWidth={2}
                    connectNulls={true}
                    fillOpacity={1}
                    fill="url(#colorStress)"
                    name="Stress Load (0-100)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-earth-200 dark:border-forest-800 rounded-xl">
                <Activity className="w-8 h-8 text-earth-400 dark:text-forest-600 mb-2" />
                <h3 className="text-sm font-semibold text-forest-900 dark:text-sage-100">
                  No 7-Day Trajectory Recorded Yet
                </h3>
                <p className="text-xs text-earth-500 dark:text-sage-400 max-w-sm mt-1">
                  Log your daily mood check-ins or connect a biometric wearable to generate your personal emotional and autonomic resilience curves.
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <Link
                    to="/dashboard/mood-stress"
                    className="px-3 py-1.5 rounded-lg bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold transition-colors"
                  >
                    Log Mood
                  </Link>
                  <Link
                    to="/dashboard/wearables"
                    className="px-3 py-1.5 rounded-lg border border-earth-300 dark:border-forest-700 text-xs font-medium text-earth-700 dark:text-sage-300 hover:bg-earth-100 dark:hover:bg-forest-800 transition-colors"
                  >
                    Connect Device
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Daily Habits & Intentional Goals */}
        <div className="bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-semibold text-forest-950 dark:text-sage-100">
                  Daily Habit Check-in
                </h2>
              </div>
              <Link
                to="/dashboard/goals"
                className="text-xs font-semibold text-sage-700 dark:text-sage-300 hover:underline flex items-center gap-0.5"
              >
                All Goals <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Habit Ring Summary */}
            <div className="p-3.5 rounded-xl bg-earth-50 dark:bg-forest-800/60 border border-earth-200 dark:border-forest-700 mb-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-earth-600 dark:text-sage-300">
                  Today's Habit Target
                </span>
                <div className="text-sm font-bold text-forest-950 dark:text-sage-100 mt-0.5">
                  {summary?.habits_completed_today ?? 0} of {summary?.habits_total_today ?? 0} Completed
                </div>
              </div>
              <CircularProgressRing
                progress={habitPercent}
                size={44}
                strokeWidth={4}
                circleColor="text-earth-200 dark:text-forest-700"
                progressColor="text-sage-600 dark:text-sage-400"
                centerContent={<span className="text-[10px] font-bold text-forest-950 dark:text-sage-100">{Math.round(habitPercent)}%</span>}
              />
            </div>

            {/* Quick Interactive Habit List */}
            <div className="space-y-2.5">
              {habits.length === 0 ? (
                <p className="text-xs text-earth-500 dark:text-sage-400 py-2">
                  No active habits yet. Add your first daily intention to build streaks.
                </p>
              ) : (
                habits.slice(0, 3).map((h) => {
                  const isDone = h.completed_today;
                  const isToggling = togglingHabitId === h.id;
                  return (
                    <div
                      key={h.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                        isDone
                          ? 'bg-sage-50/70 dark:bg-forest-800/80 border-sage-200 dark:border-forest-700'
                          : 'bg-white dark:bg-forest-800/30 border-earth-200 dark:border-forest-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => handleToggleHabit(h.id)}
                          disabled={isToggling}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                            isDone
                              ? 'bg-sage-600 text-white shadow-sm'
                              : 'border-2 border-earth-300 dark:border-forest-600 hover:border-sage-500'
                          }`}
                        >
                          {isToggling ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-sage-600" />
                          ) : isDone ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : null}
                        </button>
                        <div className="min-w-0">
                          <p className={`text-xs font-medium truncate ${
                            isDone ? 'line-through text-earth-500 dark:text-sage-400' : 'text-forest-950 dark:text-sage-100'
                          }`}>
                            {h.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-earth-500 dark:text-sage-400">
                            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>{h.streak_count}d streak</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-earth-100 dark:border-forest-800">
            <Link
              to="/dashboard/goals"
              className="w-full block text-center py-2 px-3 rounded-lg border border-dashed border-earth-300 dark:border-forest-700 text-xs font-medium text-earth-700 dark:text-sage-300 hover:bg-earth-100 dark:hover:bg-forest-800 transition-colors"
            >
              + Manage Habits & Goals
            </Link>
          </div>
        </div>
      </div>

      {/* Personalized Guidance & Interventions */}
      <div className="bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-forest-950 dark:text-sage-100">
              Personalized Guidance & Interventions
            </h2>
            <p className="text-xs text-earth-500 dark:text-sage-400">
              Dynamically synthesized from your autonomic stress indicators, sleep quality, and active goals
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full font-medium self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5" /> Non-Diagnostic Evidence Insights
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.slice(0, 3).map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-xl border border-earth-200 dark:border-forest-800 bg-earth-50/70 dark:bg-forest-800/40 flex flex-col justify-between hover:border-sage-300 dark:hover:border-forest-600 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-sage-700 dark:text-sage-300">
                    {rec.category.replace('_', ' ')}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      rec.priority === 'high'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                        : 'bg-earth-200 text-earth-700 dark:bg-forest-700 dark:text-sage-300'
                    }`}
                  >
                    {rec.priority} priority
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-forest-900 dark:text-sage-100 mb-1">
                  {rec.title}
                </h3>
                <p className="text-xs text-earth-600 dark:text-sage-300 line-clamp-2">
                  {rec.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-earth-200/60 dark:border-forest-700/60 flex items-center justify-between">
                <span className="text-[11px] text-earth-500 dark:text-sage-400 font-medium">
                  Evidence: {Math.round(rec.confidence * 100)}% match
                </span>
                {rec.action_url && (
                  <Link
                    to={rec.action_url}
                    className="text-xs font-semibold text-sage-600 dark:text-sage-400 hover:underline flex items-center gap-0.5"
                  >
                    Start <ArrowUpRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access Ecosystem Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          to="/dashboard/goals"
          className="p-3.5 rounded-xl bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 hover:border-sage-400 dark:hover:border-forest-600 text-center transition-all shadow-sm hover:shadow group"
        >
          <Flame className="w-5 h-5 mx-auto text-amber-500 mb-1.5 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-semibold text-forest-950 dark:text-sage-100">Habits & Goals</div>
          <div className="text-[10px] text-earth-500 dark:text-sage-400 mt-0.5">Streaks & targets</div>
        </Link>

        <Link
          to="/dashboard/wearables"
          className="p-3.5 rounded-xl bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 hover:border-sage-400 dark:hover:border-forest-600 text-center transition-all shadow-sm hover:shadow group"
        >
          <Watch className="w-5 h-5 mx-auto text-indigo-500 mb-1.5 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-semibold text-forest-950 dark:text-sage-100">Wearables & Sleep</div>
          <div className="text-[10px] text-earth-500 dark:text-sage-400 mt-0.5">Biometrics & recovery</div>
        </Link>

        <Link
          to="/dashboard/digital-wellbeing"
          className="p-3.5 rounded-xl bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 hover:border-sage-400 dark:hover:border-forest-600 text-center transition-all shadow-sm hover:shadow group"
        >
          <Smartphone className="w-5 h-5 mx-auto text-blue-500 mb-1.5 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-semibold text-forest-950 dark:text-sage-100">Digital Balance</div>
          <div className="text-[10px] text-earth-500 dark:text-sage-400 mt-0.5">Limits & focus time</div>
        </Link>

        <Link
          to="/dashboard/journal"
          className="p-3.5 rounded-xl bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 hover:border-sage-400 dark:hover:border-forest-600 text-center transition-all shadow-sm hover:shadow group"
        >
          <BookOpen className="w-5 h-5 mx-auto text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-semibold text-forest-950 dark:text-sage-100">Mindful Journal</div>
          <div className="text-[10px] text-earth-500 dark:text-sage-400 mt-0.5">NLP & reflections</div>
        </Link>

        <Link
          to="/dashboard/facial-analysis"
          className="p-3.5 rounded-xl bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 hover:border-sage-400 dark:hover:border-forest-600 text-center transition-all shadow-sm hover:shadow group"
        >
          <Camera className="w-5 h-5 mx-auto text-purple-500 mb-1.5 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-semibold text-forest-950 dark:text-sage-100">Facial Signals</div>
          <div className="text-[10px] text-earth-500 dark:text-sage-400 mt-0.5">Privacy-first edge AI</div>
        </Link>

        <Link
          to="/dashboard/companion"
          className="p-3.5 rounded-xl bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 hover:border-sage-400 dark:hover:border-forest-600 text-center transition-all shadow-sm hover:shadow group"
        >
          <Bot className="w-5 h-5 mx-auto text-sage-600 mb-1.5 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-semibold text-forest-950 dark:text-sage-100">AI Companion</div>
          <div className="text-[10px] text-earth-500 dark:text-sage-400 mt-0.5">Cognitive reflection</div>
        </Link>
      </div>
    </div>
  );
};
