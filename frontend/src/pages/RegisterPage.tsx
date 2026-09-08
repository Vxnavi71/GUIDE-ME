import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Lock, Mail, User as UserIcon, ArrowRight } from 'lucide-react';
import { ApiService } from '../services/api';
import { ThemeToggle } from '../components/ThemeToggle';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [occupation, setOccupation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      setError('Password must be at least 8 characters and contain uppercase, lowercase, and a digit.');
      return;
    }
    setLoading(true);
    try {
      await ApiService.register({
        email,
        password,
        full_name: fullName,
        preferred_name: fullName.split(' ')[0],
        occupation,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-earth-50 dark:bg-forest-950 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-forest-900 rounded-2xl shadow-sm border border-earth-200 dark:border-forest-800 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sage-100 dark:bg-forest-800 text-sage-600 dark:text-sage-400 mb-3">
            <Leaf className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold text-forest-900 dark:text-sage-100">Create Your Profile</h1>
          <p className="text-sm text-earth-600 dark:text-sage-400 mt-1">
            Privacy-first wellness, clinical clarity, and personal guidance.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">Full Name</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-earth-400 dark:text-sage-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 focus:ring-2 focus:ring-sage-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-earth-400 dark:text-sage-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 focus:ring-2 focus:ring-sage-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">Occupation / Domain (Optional)</label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="Software Engineer, Researcher, Student..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 focus:ring-2 focus:ring-sage-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-earth-400 dark:text-sage-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars (upper, lower, digit)"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 focus:ring-2 focus:ring-sage-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-sage-600 hover:bg-sage-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-earth-600 dark:text-sage-400">
          Already registered?{' '}
          <Link to="/login" className="text-sage-700 dark:text-sage-300 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
