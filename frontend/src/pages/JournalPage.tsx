import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  Trash2,
  Smile,
  AlertCircle,
  Tag,
  Calendar,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { ApiService } from '../services/api';

export const JournalPage: React.FC = () => {
  const [journals, setJournals] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [moodContext, setMoodContext] = useState('calm');
  const [loading, setLoading] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<any>(null);

  useEffect(() => {
    loadJournals();
  }, []);

  const loadJournals = async () => {
    try {
      const list = await ApiService.listJournals();
      setJournals(list);
      if (list.length > 0 && !selectedJournal) {
        setSelectedJournal(list[0]);
      }
    } catch (e) {
      console.error('Error fetching journals', e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      const tags = tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await ApiService.createJournal({
        title,
        content,
        tags,
        mood_context: moodContext,
      });

      setJournals([created, ...journals]);
      setSelectedJournal(created);
      setTitle('');
      setContent('');
      setTagInput('');
    } catch (e) {
      alert('Could not save journal entry.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;
    try {
      await ApiService.deleteJournal(id);
      const updated = journals.filter((j) => j.id !== id);
      setJournals(updated);
      if (selectedJournal?.id === id) {
        setSelectedJournal(updated[0] || null);
      }
    } catch (e) {
      alert('Could not delete journal entry.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-forest-950 dark:text-sage-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sage-600 dark:text-sage-400" />
            <span>Journal & NLP Thought Reflection</span>
          </h1>
          <p className="text-xs text-earth-600 dark:text-sage-400 mt-0.5">
            Expressive writing with instant cognitive distortion detection and evidence-based re-framing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor & List Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Editor Card */}
          <div className="bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-forest-950 dark:text-sage-100 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-sage-600" />
              <span>Compose New Reflection</span>
            </h2>

            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (e.g. Navigating Team Priorities & Boundaries)"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-forest-950 dark:text-sage-100 focus:ring-2 focus:ring-sage-500 outline-none font-medium"
              />

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write candidly about today's events, feelings, or challenges..."
                rows={5}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-forest-950 dark:text-sage-100 focus:ring-2 focus:ring-sage-500 outline-none leading-relaxed"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Tags (comma separated: work, clarity, walk)"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-earth-600 dark:text-sage-400">Context:</span>
                  <select
                    value={moodContext}
                    onChange={(e) => setMoodContext(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none"
                  >
                    <option value="calm">Calm & Centered</option>
                    <option value="energized">Energized</option>
                    <option value="anxious">Anxious / Overwhelmed</option>
                    <option value="fatigued">Fatigued</option>
                    <option value="reflective">Reflective</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={loading || !title.trim() || !content.trim()}
                  className="px-4 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{loading ? 'Analyzing with NLP...' : 'Save & Analyze Entry'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Past Entries List */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-bold text-earth-500 dark:text-sage-400 tracking-wider">
              Previous Reflections ({journals.length})
            </h3>
            {journals.length === 0 ? (
              <p className="text-xs text-earth-500 dark:text-sage-400">No journal reflections recorded yet.</p>
            ) : (
              journals.map((j) => (
                <div
                  key={j.id}
                  onClick={() => setSelectedJournal(j)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedJournal?.id === j.id
                      ? 'border-sage-500 bg-sage-50/40 dark:bg-forest-800/80 shadow-sm'
                      : 'border-earth-200 dark:border-forest-800 bg-white dark:bg-forest-900 hover:border-earth-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-forest-900 dark:text-sage-100">{j.title}</h4>
                    <span className="text-[11px] text-earth-400 dark:text-sage-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(j.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-earth-600 dark:text-sage-300 line-clamp-2">{j.content}</p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-earth-100 dark:border-forest-800">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {j.tags?.map((t: string, idx: number) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-earth-100 dark:bg-forest-700 text-earth-700 dark:text-sage-300">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(j.id);
                      }}
                      className="text-earth-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* NLP Analysis & Reflection Insight Column */}
        <div className="lg:col-span-5">
          {selectedJournal ? (
            <div className="bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-6 shadow-sm space-y-5 sticky top-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-sage-600 dark:text-sage-400">
                    AI Reflection & Cognitive Analysis
                  </span>
                  <span className="text-xs text-earth-400 dark:text-sage-400">
                    {new Date(selectedJournal.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-forest-900 dark:text-sage-100">
                  {selectedJournal.title}
                </h3>
              </div>

              {/* Sentiment & Emotion */}
              <div className="p-4 rounded-xl bg-earth-50 dark:bg-forest-800/60 border border-earth-200 dark:border-forest-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-earth-600 dark:text-sage-300 font-medium">Dominant Emotional Tone:</span>
                  <span className="font-semibold text-forest-900 dark:text-sage-100 capitalize">
                    {selectedJournal.analysis?.dominant_emotion || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-earth-600 dark:text-sage-300 font-medium">Sentiment Valence:</span>
                  {selectedJournal.analysis?.sentiment_score !== null && selectedJournal.analysis?.sentiment_score !== undefined ? (
                    <span className={`font-semibold ${
                      selectedJournal.analysis.sentiment_score >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {selectedJournal.analysis.sentiment_score > 0 ? '+' : ''}
                      {selectedJournal.analysis.sentiment_score}
                    </span>
                  ) : (
                    <span className="text-earth-400 dark:text-forest-600 font-semibold">—</span>
                  )}
                </div>
              </div>

              {/* Cognitive Distortions Warning & Reframing */}
              {selectedJournal.analysis?.cognitive_distortions?.length > 0 ? (
                <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Cognitive Pattern Detected:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJournal.analysis.cognitive_distortions.map((d: string, idx: number) => (
                      <span key={idx} className="text-[11px] bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-md font-medium">
                        {d}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed mt-1">
                    {selectedJournal.analysis.reflection_prompt}
                  </p>
                </div>
              ) : selectedJournal.analysis?.dominant_emotion === 'No journal content to analyze' ? (
                <div className="p-4 rounded-xl bg-earth-50 dark:bg-forest-800/40 border border-earth-200 dark:border-forest-700 text-xs text-earth-600 dark:text-sage-400 flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 text-sage-600 flex-shrink-0" />
                  <div>
                    <strong className="block font-semibold">No Content to Analyze:</strong>
                    <span>Write your reflection in the editor to trigger automated cognitive insights.</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <strong className="block font-semibold">Balanced Perspective:</strong>
                    <span>No rigid cognitive distortions detected. Your narrative maintains objective nuance.</span>
                  </div>
                </div>
              )}

              {/* Actionable Micro-Step */}
              <div className="border-t border-earth-100 dark:border-forest-800 pt-4">
                <span className="text-[10px] uppercase font-bold text-earth-500 dark:text-sage-400">
                  Recommended Micro-Action
                </span>
                <p className="text-xs text-earth-700 dark:text-sage-200 mt-1 leading-relaxed">
                  {selectedJournal.analysis?.recommended_action || 'Take a 3-minute pause to let this reflection settle.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-8 text-center text-xs text-earth-400 dark:text-sage-500 shadow-sm">
              No journal entries recorded yet. Begin by writing your first reflection above to view automated NLP sentiment, cognitive pattern mapping, and personalized reflection prompts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
