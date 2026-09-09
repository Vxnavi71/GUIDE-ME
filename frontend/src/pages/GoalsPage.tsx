import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  CheckCircle,
  Circle,
  Calendar,
  Flame,
  Trash2,
  Edit2,
  CheckCircle2,
  ListTodo,
  Sparkles,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { useToast } from '../components/ToastNotification';

export const GoalsPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'goals' | 'habits'>('habits');

  // Goals State
  const [goals, setGoals] = useState<any[]>([]);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalCategory, setGoalCategory] = useState('wellness');
  const [milestoneInputs, setMilestoneInputs] = useState(['', '', '']);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);

  // Habits State
  const [habits, setHabits] = useState<any[]>([]);
  const [habitTitle, setHabitTitle] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [habitCategory, setHabitCategory] = useState('mindfulness');
  const [habitTargetPerDay, setHabitTargetPerDay] = useState(1);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [goalsList, habitsList] = await Promise.all([
        ApiService.listGoals().catch(() => []),
        ApiService.listHabits().catch(() => []),
      ]);
      setGoals(goalsList);
      setHabits(habitsList);
    } catch (e) {
      console.error('Error loading goals and habits', e);
    }
  };

  // =========================================================================
  // Goal Handlers
  // =========================================================================
  const handleToggleMilestone = async (milestoneId: string) => {
    try {
      const updatedGoal = await ApiService.toggleMilestone(milestoneId);
      setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
      showToast('Milestone status updated', 'success');
    } catch (e) {
      showToast('Could not update milestone.', 'error');
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    setLoading(true);

    try {
      if (editingGoal) {
        const updated = await ApiService.updateGoal(editingGoal.id, {
          title: goalTitle,
          description: goalDescription,
          category: goalCategory,
        });
        setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        showToast('Goal updated successfully', 'success');
      } else {
        const validMilestones = milestoneInputs.filter((m) => m.trim());
        const newGoal = await ApiService.createGoal({
          title: goalTitle,
          description: goalDescription,
          category: goalCategory,
          milestones: validMilestones,
        });
        setGoals([newGoal, ...goals]);
        showToast('New goal initialized', 'success');
      }
      closeGoalModal();
    } catch (e) {
      showToast('Could not save goal.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to remove this goal?')) return;
    try {
      await ApiService.deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      showToast('Goal removed.', 'info');
    } catch (e) {
      showToast('Could not delete goal.', 'error');
    }
  };

  const openGoalModal = (goal?: any) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalTitle(goal.title);
      setGoalDescription(goal.description || '');
      setGoalCategory(goal.category);
    } else {
      setEditingGoal(null);
      setGoalTitle('');
      setGoalDescription('');
      setGoalCategory('wellness');
      setMilestoneInputs(['', '', '']);
    }
    setShowGoalModal(true);
  };

  const closeGoalModal = () => {
    setShowGoalModal(false);
    setEditingGoal(null);
  };

  // =========================================================================
  // Habit Handlers
  // =========================================================================
  const handleToggleHabit = async (habitId: string) => {
    try {
      const updated = await ApiService.toggleHabit(habitId);
      setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
      showToast('Habit streak updated', 'success');
    } catch (e) {
      showToast('Could not toggle habit completion.', 'error');
    }
  };

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;
    setLoading(true);

    try {
      if (editingHabit) {
        const updated = await ApiService.updateHabit(editingHabit.id, {
          title: habitTitle,
          description: habitDescription,
          category: habitCategory,
          target_per_day: habitTargetPerDay,
        });
        setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
        showToast('Habit updated', 'success');
      } else {
        const created = await ApiService.createHabit({
          title: habitTitle,
          description: habitDescription,
          category: habitCategory,
          target_frequency: 'daily',
          target_per_day: habitTargetPerDay,
        });
        setHabits([created, ...habits]);
        showToast('New positive habit tracked', 'success');
      }
      closeHabitModal();
    } catch (e) {
      showToast('Could not save habit.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm('Are you sure you want to remove this habit?')) return;
    try {
      await ApiService.deleteHabit(id);
      setHabits((prev) => prev.filter((h) => h.id !== id));
      showToast('Habit removed.', 'info');
    } catch (e) {
      showToast('Could not delete habit.', 'error');
    }
  };

  const openHabitModal = (habit?: any) => {
    if (habit) {
      setEditingHabit(habit);
      setHabitTitle(habit.title);
      setHabitDescription(habit.description || '');
      setHabitCategory(habit.category);
      setHabitTargetPerDay(habit.target_per_day || 1);
    } else {
      setEditingHabit(null);
      setHabitTitle('');
      setHabitDescription('');
      setHabitCategory('mindfulness');
      setHabitTargetPerDay(1);
    }
    setShowHabitModal(true);
  };

  const closeHabitModal = () => {
    setShowHabitModal(false);
    setEditingHabit(null);
  };

  const completedTodayCount = habits.filter((h) => h.completed_today).length;
  const habitsProgressPct = habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-forest-950 dark:text-sage-50 flex items-center gap-2">
            <Target className="w-5 h-5 text-sage-600 dark:text-sage-400" />
            <span>Intentional Goals & Daily Habits</span>
          </h1>
          <p className="text-sm text-earth-600 dark:text-sage-400 mt-1 leading-relaxed">
            Cultivate mindful habits and steady progress with real-time tracking and streaks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="bg-earth-100 dark:bg-forest-800/60 p-1 rounded-xl flex items-center gap-1 border border-earth-200 dark:border-forest-700">
            <button
              onClick={() => setActiveTab('habits')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'habits'
                  ? 'bg-white dark:bg-forest-900 text-forest-950 dark:text-sage-100 shadow-soft'
                  : 'text-earth-600 dark:text-sage-400 hover:text-forest-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Daily Habits ({completedTodayCount}/{habits.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'goals'
                  ? 'bg-white dark:bg-forest-900 text-forest-950 dark:text-sage-100 shadow-soft'
                  : 'text-earth-600 dark:text-sage-400 hover:text-forest-900'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
              <span>Milestone Goals ({goals.length})</span>
            </button>
          </div>

          <button
            onClick={() => (activeTab === 'habits' ? openHabitModal() : openGoalModal())}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold transition-colors shadow-soft"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'habits' ? 'New Habit' : 'New Goal'}</span>
          </button>
        </div>
      </div>

      {/* Daily Habits Tab */}
      {activeTab === 'habits' && (
        <div className="space-y-6">
          {/* Daily Habit Summary Banner */}
          <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-5 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center">
                <Flame className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-forest-950 dark:text-sage-100">
                  Today's Habit Pulse: {completedTodayCount} of {habits.length} Completed
                </h2>
                <p className="text-sm text-earth-600 dark:text-sage-400 mt-1 leading-relaxed">
                  Consistent micro-habits anchor mental wellbeing and focus throughout the day.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-full md:w-48 bg-earth-200 dark:bg-forest-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${habitsProgressPct}%` }}
                />
              </div>
              <span className="text-xs font-bold text-forest-900 dark:text-sage-100 whitespace-nowrap">
                {habitsProgressPct}%
              </span>
            </div>
          </div>

          {/* Habits List */}
          {habits.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-forest-900 border border-dashed border-earth-200/80 dark:border-forest-800 rounded-2xl p-8">
              <Flame className="w-10 h-10 text-amber-400 mx-auto mb-3 opacity-80" />
              <h3 className="text-sm font-semibold text-forest-950 dark:text-sage-100">No habits tracked yet</h3>
              <p className="text-xs text-earth-600 dark:text-sage-400 mt-1 max-w-sm mx-auto">
                Start small. Add a simple daily ritual like morning breathwork, hydrating, or a screen break.
              </p>
              <button
                onClick={() => openHabitModal()}
                className="mt-4 px-4 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold"
              >
                Create Your First Habit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className={`bg-white dark:bg-forest-900 border rounded-2xl p-5 shadow-soft flex flex-col justify-between transition-all ${
                    habit.completed_today
                      ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-earth-200/80 dark:border-forest-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-sage-700 dark:text-sage-300 bg-sage-100 dark:bg-forest-800 px-2 py-0.5 rounded">
                        {habit.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                        <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{habit.streak_count}d streak</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-forest-950 dark:text-sage-100 mt-1">
                      {habit.title}
                    </h3>
                    {habit.description && (
                      <p className="text-xs text-earth-600 dark:text-sage-400 mt-1">
                        {habit.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-earth-100 dark:border-forest-800/60 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleHabit(habit.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        habit.completed_today
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft'
                          : 'bg-earth-100 dark:bg-forest-800 hover:bg-earth-200 dark:hover:bg-forest-700 text-earth-700 dark:text-sage-300'
                      }`}
                    >
                      {habit.completed_today ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Done for Today</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4" />
                          <span>Check In</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openHabitModal(habit)}
                        className="p-1.5 text-earth-400 hover:text-forest-900 dark:hover:text-sage-200 transition-colors"
                        title="Edit Habit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1.5 text-earth-400 hover:text-rose-600 transition-colors"
                        title="Delete Habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          {goals.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-forest-900 border border-dashed border-earth-200/80 dark:border-forest-800 rounded-2xl p-8">
              <Target className="w-10 h-10 text-sage-400 mx-auto mb-3 opacity-80" />
              <h3 className="text-sm font-semibold text-forest-950 dark:text-sage-100">No milestone goals set yet</h3>
              <p className="text-xs text-earth-600 dark:text-sage-400 mt-1 max-w-sm mx-auto">
                Set a milestone-driven goal to measure long-term wellbeing, career, or mindfulness habits.
              </p>
              <button
                onClick={() => openGoalModal()}
                className="mt-4 px-4 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold"
              >
                Create Your First Goal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map((g) => (
                <div
                  key={g.id}
                  className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl p-6 shadow-soft flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-sage-700 dark:text-sage-300 bg-sage-100 dark:bg-forest-800 px-2 py-0.5 rounded">
                        {g.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-forest-900 dark:text-sage-100">
                          {g.progress_percentage}% Complete
                        </span>
                        <button
                          onClick={() => openGoalModal(g)}
                          className="p-1 text-earth-400 hover:text-forest-900 dark:hover:text-sage-200 transition-colors"
                          title="Edit Goal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          className="p-1 text-earth-400 hover:text-rose-600 transition-colors"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h2 className="text-base font-semibold text-forest-950 dark:text-sage-100 mb-1">{g.title}</h2>
                    {g.description && <p className="text-xs text-earth-600 dark:text-sage-300 mb-4">{g.description}</p>}

                    {/* Progress Bar */}
                    <div className="w-full bg-earth-200 dark:bg-forest-700 h-2 rounded-full overflow-hidden mb-4">
                      <div
                        className="bg-sage-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${g.progress_percentage}%` }}
                      />
                    </div>

                    {/* Milestones Checklist */}
                    <div className="space-y-2 mt-4 pt-4 border-t border-earth-100 dark:border-forest-800">
                      <span className="text-[11px] font-semibold text-earth-500 dark:text-sage-400 block mb-2">
                        Action Milestones:
                      </span>
                      {g.milestones?.map((m: any) => (
                        <button
                          key={m.id}
                          onClick={() => handleToggleMilestone(m.id)}
                          className="w-full text-left flex items-start gap-2 text-xs p-2 rounded-lg hover:bg-earth-50 dark:hover:bg-forest-800 transition-colors"
                        >
                          {m.is_completed ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-4 h-4 text-earth-400 dark:text-sage-500 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={m.is_completed ? 'line-through text-earth-400 dark:text-sage-500' : 'text-forest-900 dark:text-sage-100'}>
                            {m.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Habit Create / Edit Modal */}
      {showHabitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-base font-semibold text-forest-950 dark:text-sage-100">
              {editingHabit ? 'Edit Habit' : 'Create Daily Habit'}
            </h2>
            <form onSubmit={handleSaveHabit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">Habit Title</label>
                <input
                  type="text"
                  required
                  value={habitTitle}
                  onChange={(e) => setHabitTitle(e.target.value)}
                  placeholder="e.g., Morning 10-Minute Breathwork"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">Description (Optional)</label>
                <textarea
                  value={habitDescription}
                  onChange={(e) => setHabitDescription(e.target.value)}
                  placeholder="Why is this habit meaningful to you?"
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">Category</label>
                  <select
                    value={habitCategory}
                    onChange={(e) => setHabitCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none"
                  >
                    <option value="mindfulness">Mindfulness</option>
                    <option value="physical">Physical Health</option>
                    <option value="digital_detox">Digital Detox</option>
                    <option value="sleep">Sleep Routine</option>
                    <option value="learning">Learning & Focus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">Daily Target</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={habitTargetPerDay}
                    onChange={(e) => setHabitTargetPerDay(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeHabitModal}
                  className="px-3 py-1.5 rounded-lg border border-earth-300 text-xs font-medium text-earth-700 dark:text-sage-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold"
                >
                  {editingHabit ? 'Update Habit' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Create / Edit Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-forest-900 border border-earth-200/80 dark:border-forest-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-base font-semibold text-forest-950 dark:text-sage-100">
              {editingGoal ? 'Edit Goal' : 'Create New Milestone Goal'}
            </h2>
            <form onSubmit={handleSaveGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g., Maintain 8 hours sleep & morning meditation"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">Description (Optional)</label>
                <textarea
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Why does this matter for your personal vitality?"
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">Category</label>
                <select
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none"
                >
                  <option value="wellness">Wellness & Vitality</option>
                  <option value="mindfulness">Mindfulness & Rest</option>
                  <option value="career">Career & Mastery</option>
                  <option value="habit">Habit & Routine</option>
                </select>
              </div>

              {!editingGoal && (
                <div>
                  <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">Milestones</label>
                  {milestoneInputs.map((val, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={val}
                      onChange={(e) => {
                        const updated = [...milestoneInputs];
                        updated[idx] = e.target.value;
                        setMilestoneInputs(updated);
                      }}
                      placeholder={`Milestone ${idx + 1}`}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none mb-2"
                    />
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeGoalModal}
                  className="px-3 py-1.5 rounded-lg border border-earth-300 text-xs font-medium text-earth-700 dark:text-sage-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold"
                >
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
