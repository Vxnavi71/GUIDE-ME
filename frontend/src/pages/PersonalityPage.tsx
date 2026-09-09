import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle,
  ArrowRight,
  RotateCcw,
  Briefcase,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  BarChart3,
  Radar as RadarIcon,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from 'recharts';
import { ApiService } from '../services/api';
import { useToast } from '../components/ToastNotification';

const getTraitLevel = (score: number): { level: string; badgeClass: string } => {
  if (score >= 65) {
    return {
      level: 'High',
      badgeClass:
        'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    };
  }
  if (score <= 35) {
    return {
      level: 'Low',
      badgeClass:
        'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    };
  }
  return {
    level: 'Balanced',
    badgeClass:
      'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  };
};

const TRAIT_METADATA: Record<string, { label: string; descHigh: string; descMid: string; descLow: string; color: string }> = {
  Openness: {
    label: 'Openness to Experience',
    descHigh: 'Inventive, intellectually curious, and open to novel ideas and artistic complexity.',
    descMid: 'Balances practical realism with curiosity to explore fresh innovations.',
    descLow: 'Pragmatic, straightforward, and grounded in concrete and proven methodologies.',
    color: '#3b82f6',
  },
  Conscientiousness: {
    label: 'Conscientiousness',
    descHigh: 'Systematic, organized, disciplined, and persistent in goal completion.',
    descMid: 'Balances structured reliability with healthy flexibility for fluid priorities.',
    descLow: 'Spontaneous, adaptable, and comfortable improvising in evolving environments.',
    color: '#10b981',
  },
  Extraversion: {
    label: 'Extraversion',
    descHigh: 'High social vitality, expressive dialogue, collaborative energy, and assertiveness.',
    descMid: 'Fluidly transitions between team collaboration and quiet individual work.',
    descLow: 'Recharges through solitary focus, deep concentration, and calm environments.',
    color: '#f59e0b',
  },
  Agreeableness: {
    label: 'Agreeableness',
    descHigh: 'Empathetic, cooperative, builds psychological safety, and supports others.',
    descMid: 'Balances thoughtful empathy with clear and constructive objective candor.',
    descLow: 'Direct, independently minded, and unafraid to challenge assumptions.',
    color: '#8b5cf6',
  },
  'Emotional Reactivity': {
    label: 'Emotional Sensitivity (Neuroticism)',
    descHigh: 'Heightened situational sensitivity; benefits from regular mindfulness and grounding.',
    descMid: 'Experiences standard emotional variance with healthy autonomic recovery baselines.',
    descLow: 'Deeply composed, calm under acute stress, and emotionally resilient.',
    color: '#ef4444',
  },
};

export const PersonalityPage: React.FC = () => {
  const { showToast } = useToast();
  const [result, setResult] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAssessmentMode, setIsAssessmentMode] = useState(false);
  const [chartView, setChartView] = useState<'radar' | 'bar'>('radar');

  useEffect(() => {
    loadPersonalityData();
  }, []);

  const loadPersonalityData = async () => {
    setLoading(true);
    try {
      const latest = await ApiService.getLatestPersonality().catch(() => null);
      if (latest && latest.openness !== undefined) {
        setResult(latest);
      } else {
        setIsAssessmentMode(true);
      }
      const qList = await ApiService.getOceanQuestions();
      setQuestions(qList || []);
    } catch (e) {
      console.error('Error loading personality assessment', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (qId: string, val: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      showToast(`Please answer all ${questions.length} questions before submitting.`, 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payloadAnswers = Object.entries(answers).map(([qId, val]) => ({
        question_id: qId,
        score_value: val,
      }));
      const res = await ApiService.submitOcean('default-assessment', payloadAnswers);
      setResult(res);
      setIsAssessmentMode(false);
      showToast('Personality assessment scored successfully!', 'success');
    } catch (e: any) {
      console.error('Personality assessment submission failed:', e);
      showToast(e?.message || 'Failed to score assessment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = result
    ? [
        { trait: 'Openness', score: Math.round(result.openness) },
        { trait: 'Conscientiousness', score: Math.round(result.conscientiousness) },
        { trait: 'Extraversion', score: Math.round(result.extraversion) },
        { trait: 'Agreeableness', score: Math.round(result.agreeableness) },
        { trait: 'Emotional Reactivity', score: Math.round(result.neuroticism) },
      ]
    : [];

  const radarData = result
    ? [
        { trait: 'Openness', score: Math.round(result.openness), fullMark: 100 },
        { trait: 'Conscientiousness', score: Math.round(result.conscientiousness), fullMark: 100 },
        { trait: 'Extraversion', score: Math.round(result.extraversion), fullMark: 100 },
        { trait: 'Agreeableness', score: Math.round(result.agreeableness), fullMark: 100 },
        { trait: 'Emotional Reactivity', score: Math.round(result.neuroticism), fullMark: 100 },
      ]
    : [];

  const averageScore = result
    ? Math.round(
        (result.openness +
          result.conscientiousness +
          result.extraversion +
          result.agreeableness +
          (100 - result.neuroticism)) /
          5
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-forest-950 dark:text-sage-50 flex items-center gap-2">
            <Compass className="w-5 h-5 text-sage-600 dark:text-sage-400" />
            <span>Big Five (OCEAN) Psychometric Inventory</span>
          </h1>
          <p className="text-sm text-earth-600 dark:text-sage-400 mt-1 leading-relaxed">
            Scientifically validated 5-factor personality dimensions for personal self-awareness and career alignment.
          </p>
        </div>

        {result && !isAssessmentMode && (
          <button
            onClick={() => setIsAssessmentMode(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-earth-300 dark:border-forest-700 hover:bg-earth-100 dark:hover:bg-forest-800 text-xs font-medium text-earth-800 dark:text-sage-200 transition-colors self-start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Assessment</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3 bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-8 shadow-soft">
          <RefreshCw className="w-8 h-8 text-sage-600 dark:text-sage-400 animate-spin" />
          <p className="text-sm font-medium text-earth-600 dark:text-sage-400">
            Synthesizing psychometric profile and personality telemetry...
          </p>
        </div>
      ) : isAssessmentMode ? (
        /* Assessment Question Flow */
        <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft space-y-6">
          <div className="flex items-center justify-between border-b border-earth-200/80 dark:border-forest-800 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-forest-950 dark:text-sage-100">
                IPIP 50-Item Personality Assessment
              </h2>
              <p className="text-xs text-earth-500 dark:text-sage-400">
                Rate how accurately each statement describes you as you generally are.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-sage-600 dark:text-sage-400">
                {Object.keys(answers).length} / {questions.length} Answered
              </span>
              <div className="w-32 bg-earth-100 dark:bg-forest-800 rounded-full h-1.5 mt-1 overflow-hidden">
                <div
                  className="bg-sage-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${questions.length ? (Object.keys(answers).length / questions.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {questions.map((q, idx) => {
              const currentVal = answers[q.id];
              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-earth-200/80 dark:border-forest-800 bg-earth-50/50 dark:bg-forest-800/40"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="text-xs font-semibold text-forest-950 dark:text-sage-100">
                      {idx + 1}. {q.question_text}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-earth-400 dark:text-sage-500">
                      {q.domain_trait}
                    </span>
                  </div>

                  {/* 5-point Likert Scale */}
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    {[
                      { val: 1, label: 'Disagree Strongly' },
                      { val: 2, label: 'Disagree' },
                      { val: 3, label: 'Neutral' },
                      { val: 4, label: 'Agree' },
                      { val: 5, label: 'Agree Strongly' },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.val}
                        onClick={() => handleSelectAnswer(q.id, opt.val)}
                        className={`py-2 px-1 rounded-lg border text-[11px] transition-all ${
                          currentVal === opt.val
                            ? 'bg-sage-600 text-white border-sage-600 font-semibold shadow-soft'
                            : 'border-earth-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-700 dark:text-sage-300 hover:bg-earth-100'
                        }`}
                      >
                        <span className="block font-bold">{opt.val}</span>
                        <span className="hidden sm:inline text-[9px] opacity-80">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-earth-200/80 dark:border-forest-800">
            <span className="text-xs text-earth-500 dark:text-sage-400">
              {questions.length - Object.keys(answers).length > 0
                ? `${questions.length - Object.keys(answers).length} questions remaining`
                : 'All questions completed! Ready to score.'}
            </span>
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < questions.length}
              className="px-6 py-2.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-sm font-semibold transition-colors shadow-soft disabled:opacity-40 flex items-center gap-2"
            >
              <span>{submitting ? 'Scoring Profile...' : 'Submit & Generate Profile'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : result ? (
        /* Results View */
        <div className="space-y-6">
          {/* Top Score Summary Banner */}
          <div className="bg-gradient-to-r from-forest-800 via-forest-900 to-forest-950 text-white rounded-2xl p-6 shadow-soft border border-forest-700/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sage-400/20 text-sage-200 ring-1 ring-sage-300/30 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage-300" />
                  <span>Psychometric Evaluation Active</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Big Five Psychometric Profile
                </h2>
                <p className="text-xs sm:text-sm text-sage-200/90 mt-1 max-w-xl">
                  {result.analysis_summary}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 self-start md:self-auto">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
                    {averageScore}%
                  </div>
                  <div className="text-[10px] uppercase font-bold text-sage-200 tracking-wider">
                    Overall Resilience
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Numerical Trait Score Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-earth-700 dark:text-sage-300">
                Individual Trait Percentiles & Interpretations
              </h3>
              <span className="text-xs text-earth-500 dark:text-sage-400">
                Normalized 0–100% Likert Distribution
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {chartData.map((item) => {
                const meta = TRAIT_METADATA[item.trait] || {
                  label: item.trait,
                  descHigh: '',
                  descMid: '',
                  descLow: '',
                  color: '#5a825a',
                };
                const { level, badgeClass } = getTraitLevel(item.score);
                const description =
                  item.score >= 65 ? meta.descHigh : item.score <= 35 ? meta.descLow : meta.descMid;

                return (
                  <div
                    key={item.trait}
                    className="p-4 rounded-2xl bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 shadow-soft flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold text-forest-950 dark:text-sage-100">
                          {item.trait}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                          {level}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1 my-2">
                        <span className="text-2xl sm:text-3xl font-extrabold text-forest-950 dark:text-sage-50">
                          {item.score}%
                        </span>
                        <span className="text-[10px] text-earth-400 dark:text-sage-500 font-medium">percentile</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-earth-100 dark:bg-forest-800 rounded-full h-2 overflow-hidden mb-3">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${item.score}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>

                      <p className="text-[11px] text-earth-600 dark:text-sage-300 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Charts & Dominant Traits */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Radar / Bar Visualizer Card */}
            <div className="lg:col-span-7 bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-forest-950 dark:text-sage-100">
                    Trait Percentile Breakdown
                  </h2>
                  <p className="text-xs text-earth-500 dark:text-sage-400">
                    Validated against standard normative scoring metrics
                  </p>
                </div>

                {/* View Switcher */}
                <div className="flex items-center bg-earth-100 dark:bg-forest-800 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setChartView('radar')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      chartView === 'radar'
                        ? 'bg-white dark:bg-forest-900 text-forest-950 dark:text-sage-100 shadow-soft'
                        : 'text-earth-600 dark:text-sage-400 hover:text-earth-900'
                    }`}
                  >
                    <RadarIcon className="w-3.5 h-3.5" />
                    <span>Radar Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartView('bar')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      chartView === 'bar'
                        ? 'bg-white dark:bg-forest-900 text-forest-950 dark:text-sage-100 shadow-soft'
                        : 'text-earth-600 dark:text-sage-400 hover:text-earth-900'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Bar Comparison</span>
                  </button>
                </div>
              </div>

              <div className="h-72 w-full">
                {chartView === 'radar' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#a3b899" strokeOpacity={0.25} />
                      <PolarAngleAxis
                        dataKey="trait"
                        stroke="#7e6f5a"
                        tick={{ fontSize: 11, fill: '#7e6f5a' }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        stroke="#7e6f5a"
                        strokeOpacity={0.3}
                        tick={{ fontSize: 10 }}
                      />
                      <Radar
                        name="Trait Percentile"
                        dataKey="score"
                        stroke="#5a825a"
                        fill="#5a825a"
                        fillOpacity={0.4}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2f27',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#e5ece5',
                          fontSize: '12px',
                        }}
                        formatter={(value: any) => [`${value}%`, 'Score']}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 10, right: 40, left: 10, bottom: 10 }}
                    >
                      <XAxis type="number" domain={[0, 100]} stroke="#7e6f5a" tick={{ fontSize: 11 }} />
                      <YAxis
                        dataKey="trait"
                        type="category"
                        stroke="#7e6f5a"
                        width={140}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2f27',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#e5ece5',
                          fontSize: '12px',
                        }}
                        formatter={(value: any) => [`${value}%`, 'Score']}
                      />
                      <Bar dataKey="score" fill="#5a825a" radius={[0, 6, 6, 0]} name="Score (%)">
                        <LabelList
                          dataKey="score"
                          position="right"
                          formatter={(v: any) => `${v}%`}
                          fill="#5a825a"
                          style={{ fontSize: '11px', fontWeight: 600 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Dominant Traits Card */}
            <div className="lg:col-span-5 bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-sage-600 dark:text-sage-400">
                  Dominant Psychometric Archetype
                </span>
                <div className="flex flex-wrap gap-2 my-3">
                  {result.dominant_traits?.length > 0 ? (
                    result.dominant_traits.map((t: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-sage-100 dark:bg-forest-800 text-sage-800 dark:text-sage-200 text-xs font-semibold"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="px-3 py-1 rounded-lg bg-earth-100 dark:bg-forest-800 text-earth-800 dark:text-sage-200 text-xs font-semibold">
                      Balanced Psychometric Profile
                    </span>
                  )}
                </div>

                <p className="text-xs text-earth-700 dark:text-sage-300 leading-relaxed mt-4">
                  {result.analysis_summary}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-earth-100 dark:border-forest-800 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Non-clinical developmental guidance</span>
              </div>
            </div>
          </div>

          {/* Career & Growth Strengths */}
          <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft">
            <h3 className="text-sm font-semibold text-forest-950 dark:text-sage-100 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-sage-600 dark:text-sage-400" />
              <span>Aligned Career & Focus Pathways</span>
            </h3>
            <p className="text-xs text-earth-600 dark:text-sage-400 mb-4">
              Environments and problem spaces where your psychometric strengths flourish with minimal energetic friction:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {result.career_strengths?.map((c: string, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-earth-200/80 dark:border-forest-800 bg-earth-50 dark:bg-forest-800/40 text-xs font-semibold text-forest-900 dark:text-sage-100 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
