import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle,
  ArrowRight,
  RotateCcw,
  Briefcase,
  Sparkles,
  ShieldCheck,
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
} from 'recharts';
import { ApiService } from '../services/api';
import { useToast } from '../components/ToastNotification';

export const PersonalityPage: React.FC = () => {
  const { showToast } = useToast();
  const [result, setResult] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAssessmentMode, setIsAssessmentMode] = useState(false);

  useEffect(() => {
    loadPersonalityData();
  }, []);

  const loadPersonalityData = async () => {
    setLoading(true);
    try {
      const latest = await ApiService.getLatestPersonality().catch(() => null);
      if (latest) {
        setResult(latest);
      } else {
        setIsAssessmentMode(true);
      }
      const qList = await ApiService.getOceanQuestions();
      setQuestions(qList);
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
    } catch (e) {
      showToast('Failed to score assessment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = result
    ? [
        { trait: 'Openness', score: result.openness },
        { trait: 'Conscientiousness', score: result.conscientiousness },
        { trait: 'Extraversion', score: result.extraversion },
        { trait: 'Agreeableness', score: result.agreeableness },
        { trait: 'Emotional Reactivity', score: result.neuroticism },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-forest-950 dark:text-sage-100 flex items-center gap-2">
            <Compass className="w-5 h-5 text-sage-600 dark:text-sage-400" />
            <span>Big Five (OCEAN) Psychometric Inventory</span>
          </h1>
          <p className="text-xs text-earth-600 dark:text-sage-400 mt-0.5">
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

      {isAssessmentMode ? (
        /* Assessment Question Flow */
        <div className="bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-earth-200 dark:border-forest-800 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-forest-950 dark:text-sage-100">
                IPIP 50-Item Personality Assessment
              </h2>
              <p className="text-xs text-earth-500 dark:text-sage-400">
                Rate how accurately each statement describes you as you generally are.
              </p>
            </div>
            <span className="text-xs font-semibold text-sage-600 dark:text-sage-400">
              {Object.keys(answers).length} / {questions.length} Answered
            </span>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {questions.map((q, idx) => {
              const currentVal = answers[q.id];
              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-earth-200 dark:border-forest-800 bg-earth-50/50 dark:bg-forest-800/40"
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
                            ? 'bg-sage-600 text-white border-sage-600 font-semibold shadow-sm'
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

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < questions.length}
              className="px-6 py-2.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-40 flex items-center gap-2"
            >
              <span>{submitting ? 'Scoring Profile...' : 'Submit & Generate Profile'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : result ? (
        /* Results View */
        <div className="space-y-6">
          {/* Charts & Dominant Traits */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Radar / Bar Chart */}
            <div className="lg:col-span-7 bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-forest-950 dark:text-sage-100">Trait Percentile Breakdown</h2>
                  <p className="text-xs text-earth-500 dark:text-sage-400">Validated against standard normative scoring metrics</p>
                </div>
                <span className="text-xs font-semibold text-sage-600 dark:text-sage-400 bg-sage-50 dark:bg-forest-800 py-1 px-2.5 rounded-full">
                  OCEAN Norms
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 100]} stroke="#7e6f5a" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="trait" type="category" stroke="#7e6f5a" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2f27',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#e5ece5',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="score" fill="#5a825a" radius={[0, 6, 6, 0]} name="Score (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dominant Traits Card */}
            <div className="lg:col-span-5 bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-sage-600 dark:text-sage-400">
                  Dominant Psychometric Archetype
                </span>
                <div className="flex flex-wrap gap-2 my-3">
                  {result.dominant_traits?.map((t: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-sage-100 dark:bg-forest-800 text-sage-800 dark:text-sage-200 text-xs font-semibold"
                    >
                      {t}
                    </span>
                  ))}
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
          <div className="bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-6 shadow-sm">
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
                  className="p-3.5 rounded-xl border border-earth-200 dark:border-forest-800 bg-earth-50 dark:bg-forest-800/40 text-xs font-semibold text-forest-900 dark:text-sage-100 flex items-center gap-2"
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
