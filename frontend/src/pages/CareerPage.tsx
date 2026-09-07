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
} from 'lucide-react';
import { ApiService } from '../services/api';

export const CareerPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await ApiService.getCareerRecommendations();
        setRecommendations(res || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
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
      <div>
        <h1 className="text-xl font-semibold text-forest-950 dark:text-sage-100 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-sage-600 dark:text-sage-400" />
          <span>Career Pathways & Psychometric Strength Mapping</span>
        </h1>
        <p className="text-xs text-earth-600 dark:text-sage-400 mt-0.5">
          Aligning professional trajectories with your OCEAN personality dimensions and cognitive strengths.
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-8 text-center shadow-sm">
          <Compass className="w-12 h-12 text-sage-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-forest-950 dark:text-sage-100">
            No Career Mapping Profile Yet
          </h3>
          <p className="text-sm text-earth-600 dark:text-sage-400 mt-1 max-w-md mx-auto mb-5">
            Take the OCEAN Big Five personality assessment to unlock evidence-based career pathways tailored to your unique traits.
          </p>
          <Link
            to="/dashboard/personality"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-medium text-sm transition-colors shadow-sm"
          >
            <span>Take Big Five Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-6 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-earth-100 dark:border-forest-800 pb-3">
              <div>
                <h2 className="text-base font-semibold text-forest-950 dark:text-sage-100">{item.path_title}</h2>
                <p className="text-xs text-earth-600 dark:text-sage-300 mt-0.5">{item.alignment_reason}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-earth-500 dark:text-sage-400">Psychometric Match</span>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{item.match_score}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-earth-50 dark:bg-forest-800/50 border border-earth-200 dark:border-forest-700">
                <span className="font-semibold text-forest-900 dark:text-sage-100 block mb-2">Key Strengths:</span>
                <ul className="space-y-1.5 text-earth-600 dark:text-sage-300">
                  {item.key_strengths?.map((s: string, i: number) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sage-600" />
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
                      <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-earth-50 dark:bg-forest-800/50 border border-earth-200 dark:border-forest-700">
                <span className="font-semibold text-forest-900 dark:text-sage-100 block mb-2">Learning Roadmap:</span>
                <ul className="space-y-1.5 text-earth-600 dark:text-sage-300">
                  {item.learning_roadmap?.map((r: string, i: number) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};
