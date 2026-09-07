import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Leaf,
  LayoutDashboard,
  MessageSquareHeart,
  Camera,
  BookOpen,
  Compass,
  Activity,
  Watch,
  Smartphone,
  Target,
  Briefcase,
  ShieldAlert,
  Lock,
  LogOut,
  Menu,
  X,
  AlertTriangle,
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { ApiService } from '../services/api';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Companion', path: '/dashboard/companion', icon: MessageSquareHeart },
  { name: 'Facial Signals', path: '/dashboard/facial-analysis', icon: Camera },
  { name: 'Journal & Reflection', path: '/dashboard/journal', icon: BookOpen },
  { name: 'Big Five Personality', path: '/dashboard/personality', icon: Compass },
  { name: 'Stress & Distress', path: '/dashboard/stress', icon: Activity },
  { name: 'Wearables & Sleep', path: '/dashboard/wearables', icon: Watch },
  { name: 'Digital Wellbeing', path: '/dashboard/digital-wellbeing', icon: Smartphone },
  { name: 'Goals & Habits', path: '/dashboard/goals', icon: Target },
  { name: 'Career Pathways', path: '/dashboard/career', icon: Briefcase },
  { name: 'Safety Center', path: '/dashboard/safety', icon: ShieldAlert },
  { name: 'Privacy Center', path: '/dashboard/privacy', icon: Lock },
];

export const DashboardLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    ApiService.logout();
  };

  const handleQuickSOS = async () => {
    if (confirm('Activate Immediate Safety Support? This will open emergency hotlines and record a safety event.')) {
      window.location.href = '/dashboard/safety';
    }
  };

  return (
    <div className="min-h-screen bg-earth-50 dark:bg-forest-950 text-earth-900 dark:text-sage-100 flex flex-col md:flex-row transition-colors">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-earth-100 dark:bg-forest-900 border-b border-earth-200 dark:border-forest-800">
        <div className="flex items-center gap-2">
          <Leaf className="w-6 h-6 text-sage-600 dark:text-sage-400" />
          <span className="font-semibold tracking-wide text-forest-800 dark:text-sage-200">GUIDE ME</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-earth-200 dark:bg-forest-800 text-earth-800 dark:text-sage-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-earth-100/70 dark:bg-forest-900/80 backdrop-blur border-r border-earth-200/80 dark:border-forest-800 flex flex-col flex-shrink-0`}
      >
        <div className="p-5 hidden md:flex items-center justify-between border-b border-earth-200 dark:border-forest-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sage-100 dark:bg-forest-800 text-sage-700 dark:text-sage-300">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight text-forest-900 dark:text-sage-100">GUIDE ME</span>
              <span className="block text-[10px] text-sage-600 dark:text-sage-400 font-medium">ECO RECOVERY & AI</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* SOS Emergency Trigger Banner */}
        <div className="p-3">
          <button
            onClick={handleQuickSOS}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg hover:bg-rose-100 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Urgent Support / SOS</span>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sage-600 text-white shadow-sm dark:bg-sage-700'
                    : 'text-earth-700 dark:text-sage-300 hover:bg-earth-200/60 dark:hover:bg-forest-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-sage-600 dark:text-sage-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-earth-200 dark:border-forest-800 space-y-3">
          <div className="text-[11px] text-earth-500 dark:text-sage-500 flex items-center justify-between">
            <span>Client v1.0.0</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Connected" />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-earth-600 dark:text-sage-400 hover:bg-earth-200/50 dark:hover:bg-forest-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
