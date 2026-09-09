import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Sliders,
  GraduationCap,
  Wrench,
  Heart,
  Target,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { useToast } from '../components/ToastNotification';

export const CareerPage: React.FC = () => {
  const { showToast } = useToast();

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refining, setRefining] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // User Preferences Form State
  const [education, setEducation] = useState<string>('Bachelors Degree');
  const [skillsInput, setSkillsInput] = useState<string>('Problem Solving, Communication');
  const [interestsInput, setInterestsInput] = useState<string>('Technology, Psychology, Design');
  const [goalsInput, setGoalsInput] = useState<string>('Lead impactful projects with creative autonomy');

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async (prefPayload?: any) => {
    setLoading(true);
    try {
      const res = await ApiService.getCareerRecommendations(prefPayload);
      setRecommendations(res || []);
    } catch (e) {
      console.error('Failed to load career recommendations:', e);
      showToast('Could not load personalized career recommendations.', 'error');
    } finally {
      setLoading(false);
      setRefining(false);
    }
  };

  const handleApplyPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefining(true);

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const interests = interestsInput
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);
    const goals = goalsInput
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);

    const payload = {
      education,
      skills,
      interests,
      goals,
    };

    // Save preferences to backend & re-fetch recommendations
    try {
      await ApiService.saveCareerPreferences(payload);
    } catch (err) {
      // Non-blocking preference cache
    }

    await loadRecommendations(payload);
    showToast('Career trajectories updated with your personal profile!', 'success');
  };

  if (loading && recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 text-sage-600 animate-spin" />
        <p className="text-sm font-medium text-earth-600 dark:text-sage-400">
          Synthesizing career trajectories and psychometric alignments...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-forest-950 dark:text-sage-50 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-sage-600 dark:text-sage-400" />
            <span>Career Pathways & Psychometric Strength Mapping</span>
          </h1>
          <p className="text-sm text-earth-600 dark:text-sage-400 mt-1 leading-relaxed">
            Dynamic career trajectories fused from your Big Five OCEAN psychometrics, education, skill sets, and professional ambitions.
          </p>
        </div>

        <button
          onClick={() => setShowPreferences(!showPreferences)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-earth-100 hover:bg-earth-200 dark:bg-forest-800 dark:hover:bg-forest-700 text-forest-900 dark:text-sage-200 text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <Sliders className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
          <span>{showPreferences ? 'Hide Profile Refiner' : 'Refine Skills & Interests'}</span>
          {showPreferences ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Preferences & Background Refiner Panel */}
      {showPreferences && (
        <form
          onSubmit={handleApplyPreferences}
          className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft space-y-4 animate-in fade-in"
        >
          <div className="border-b border-earth-200/80 dark:border-forest-800 pb-3">
            <h2 className="text-sm font-bold text-forest-950 dark:text-sage-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sage-600 dark:text-sage-400" />
              <span>Personalize Your Pathway Synthesis</span>
            </h2>
            <p className="text-xs text-earth-500 dark:text-sage-400 mt-0.5">
              Enter your background details below. Our career matching engine will evaluate skill gaps and tailor role progression milestones to you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-sage-300 mb-1 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-sage-600" />
                <span>Education Background</span>
              </label>
              <select
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
              >
                <option value="High School / Pre-University">High School / Pre-University</option>
                <option value="Vocational / Technical Certification">Vocational / Technical Certification</option>
                <option value="Bachelors Degree">Bachelor's Degree</option>
                <option value="Masters Degree">Master's Degree</option>
                <option value="Doctorate / PhD">Doctorate / Ph.D.</option>
                <option value="Self-Taught / Industry Veteran">Self-Taught / Industry Veteran</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-sage-300 mb-1 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-sage-600" />
                <span>Current Skills (comma separated)</span>
              </label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g. Python, Public Speaking, UX Wireframing, Financial Modeling"
                className="w-full px-3 py-2 text-xs rounded-xl border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-sage-300 mb-1 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Interests & Fields of Curiosity</span>
              </label>
              <input
                type="text"
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                placeholder="e.g. Mental Health, Artificial Intelligence, Climate Science, Writing"
                className="w-full px-3 py-2 text-xs rounded-xl border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-sage-300 mb-1 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-500" />
                <span>Career Goals & Aspirations</span>
              </label>
              <input
                type="text"
                value={goalsInput}
                onChange={(e) => setGoalsInput(e.target.value)}
                placeholder="e.g. Technical leadership, Creative agency founder, Remote research"
                className="w-full px-3 py-2 text-xs rounded-xl border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowPreferences(false)}
              className="px-4 py-2 text-xs rounded-xl border border-earth-300 dark:border-forest-700 text-earth-700 dark:text-sage-300 hover:bg-earth-100 dark:hover:bg-forest-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={refining}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-sage-600 hover:bg-sage-700 text-white shadow-soft transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{refining ? 'Recalculating Pathways...' : 'Recalculate Career Fit'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Recommendations Feed */}
      {recommendations.length === 0 ? (
        <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-8 text-center shadow-soft">
          <Compass className="w-12 h-12 text-sage-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-forest-950 dark:text-sage-100">
            No Career Mapping Profile Yet
          </h3>
          <p className="text-sm text-earth-600 dark:text-sage-400 mt-1 max-w-md mx-auto mb-5">
            Take the OCEAN Big Five personality assessment to unlock evidence-based career pathways tailored to your unique psychological traits.
          </p>
          <Link
            to="/dashboard/personality"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-medium text-sm transition-colors shadow-soft"
          >
            <span>Take Big Five Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.map((item, idx) => {
            const whyText = item.why_recommended || item.alignment_reason;
            const requiredSkills = item.required_skills || [];
            const skillGaps = item.skill_gaps || [];
            const possibleRoles = item.possible_roles || [];
            const progressionPath = item.progression_path;

            return (
              <div
                key={idx}
                className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft space-y-5"
              >
                {/* Pathway Header & Match Percentage */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-earth-100 dark:border-forest-800 pb-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sage-100 dark:bg-forest-800 text-sage-800 dark:text-sage-300">
                      <Award className="w-3.5 h-3.5" />
                      <span>Pathway #{idx + 1}</span>
                    </div>
                    <h2 className="text-lg font-bold text-forest-950 dark:text-sage-100">{item.path_title}</h2>
                    <p className="text-xs text-earth-700 dark:text-sage-300 leading-relaxed max-w-3xl">
                      {whyText}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-1 p-3 sm:p-0 rounded-xl bg-emerald-50 dark:bg-forest-800 sm:bg-transparent flex-shrink-0">
                    <span className="text-[11px] uppercase font-bold text-earth-500 dark:text-sage-400">Psychometric Match</span>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {item.match_score}%
                    </div>
                  </div>
                </div>

                {/* Possible Roles Badges */}
                {possibleRoles.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-forest-900 dark:text-sage-200 block mb-2">
                      Target & Progressive Roles:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {possibleRoles.map((role: string, rIdx: number) => (
                        <span
                          key={rIdx}
                          className="px-2.5 py-1 text-xs rounded-lg font-medium bg-earth-100 dark:bg-forest-800 text-forest-900 dark:text-sage-200 border border-earth-200 dark:border-forest-700"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progression Path Narrative */}
                {progressionPath && (
                  <div className="p-3.5 rounded-xl bg-earth-50/70 dark:bg-forest-800/40 border border-earth-200 dark:border-forest-700 text-xs text-earth-700 dark:text-sage-300 flex items-start gap-2.5">
                    <Layers className="w-4 h-4 text-sage-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="font-semibold text-forest-950 dark:text-sage-100 block mb-0.5">
                        Career Trajectory & Growth Arch:
                      </strong>
                      <span>{progressionPath}</span>
                    </div>
                  </div>
                )}

                {/* Skills & Gap Analysis */}
                {(requiredSkills.length > 0 || skillGaps.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Required Skills */}
                    <div className="p-4 rounded-xl bg-earth-50 dark:bg-forest-800/50 border border-earth-200 dark:border-forest-700">
                      <span className="font-semibold text-forest-900 dark:text-sage-100 block mb-2">
                        Core Competencies Required:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {requiredSkills.map((sk: string, sIdx: number) => {
                          const isGap = skillGaps.includes(sk);
                          return (
                            <span
                              key={sIdx}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 ${
                                isGap
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              }`}
                            >
                              {isGap ? '⚡' : '✓'} {sk}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Skill Gaps to Bridge */}
                    <div className="p-4 rounded-xl bg-earth-50 dark:bg-forest-800/50 border border-earth-200 dark:border-forest-700">
                      <span className="font-semibold text-amber-800 dark:text-amber-300 block mb-2">
                        Skills to Bridge (Priority Development):
                      </span>
                      {skillGaps.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {skillGaps.map((gap: string, gIdx: number) => (
                            <span
                              key={gIdx}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
                            >
                              + {gap}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-earth-500 dark:text-sage-400 text-[11px]">
                          Excellent alignment! You possess all primary required skills for this pathway.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 3-Column Traits, Growth, and Learning Roadmap */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-earth-50 dark:bg-forest-800/50 border border-earth-200 dark:border-forest-700">
                    <span className="font-semibold text-forest-900 dark:text-sage-100 block mb-2">Key Strengths:</span>
                    <ul className="space-y-1.5 text-earth-600 dark:text-sage-300">
                      {item.key_strengths?.map((s: string, i: number) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sage-600 flex-shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-earth-50 dark:bg-forest-800/50 border border-earth-200 dark:border-forest-700">
                    <span className="font-semibold text-forest-900 dark:text-sage-100 block mb-2">Growth Focus Areas:</span>
                    <ul className="space-y-1.5 text-earth-600 dark:text-sage-300">
                      {item.growth_areas?.map((g: string, i: number) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-earth-50 dark:bg-forest-800/50 border border-earth-200 dark:border-forest-700">
                    <span className="font-semibold text-forest-900 dark:text-sage-100 block mb-2">Learning Roadmap:</span>
                    <ul className="space-y-1.5 text-earth-600 dark:text-sage-300">
                      {item.learning_roadmap?.map((r: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
