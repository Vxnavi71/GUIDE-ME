import React, { useState, useEffect } from 'react';
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

/**
 * Navigation is grouped by domain rather than listed flat: twelve equal-weight links give the
 * reader nothing to scan by, whereas these headings match how the product is actually organised.
 */
const navGroups = [
  {
    label: 'Overview',
    items: [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Mind',
    items: [
      { name: 'AI Companion', path: '/dashboard/companion', icon: MessageSquareHeart },
      { name: 'Journal & Reflection', path: '/dashboard/journal', icon: BookOpen },
      { name: 'Facial Signals', path: '/dashboard/facial-analysis', icon: Camera },
      { name: 'Big Five Personality', path: '/dashboard/personality', icon: Compass },
    ],
  },
  {
    label: 'Body',
    items: [
      { name: 'Stress & Distress', path: '/dashboard/stress', icon: Activity },
      { name: 'Wearables & Sleep', path: '/dashboard/wearables', icon: Watch },
      { name: 'Digital Wellbeing', path: '/dashboard/digital-wellbeing', icon: Smartphone },
    ],
  },
  {
    label: 'Direction',
    items: [
      { name: 'Goals & Habits', path: '/dashboard/goals', icon: Target },
      { name: 'Career Pathways', path: '/dashboard/career', icon: Briefcase },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Safety Center', path: '/dashboard/safety', icon: ShieldAlert },
      { name: 'Privacy Center', path: '/dashboard/privacy', icon: Lock },
    ],
  },
];

export const DashboardLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close the drawer on navigation and lock body scroll while it is open.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = () => {
    ApiService.logout();
  };

  const handleQuickSOS = () => {
    if (
      confirm(
        'Activate Immediate Safety Support? This will open emergency hotlines and record a safety event.',
      )
    ) {
      window.location.href = '/dashboard/safety';
    }
  };

  const activePage = navGroups
    .flatMap((g) => g.items)
    .find((i) => i.path === location.pathname);

  const sidebarContent = (
    <>
      <div className="px-5 py-5 flex items-center justify-between border-b border-earth-200/70 dark:border-forest-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sage-600 text-white shadow-soft">
            <Leaf className="w-[18px] h-[18px]" />
          </div>
          <div className="leading-tight">
            <span className="block font-extrabold text-[15px] tracking-tight text-forest-950 dark:text-sage-50">
              GUIDE ME
            </span>
            <span className="block text-[10px] font-semibold tracking-[0.12em] text-sage-600 dark:text-sage-400">
              WELLNESS &amp; AI
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-2 rounded-lg text-earth-600 dark:text-sage-300 hover:bg-earth-200/60 dark:hover:bg-forest-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* SOS is the one destructive-adjacent action, so it keeps its own colour and sits above nav. */}
      <div className="px-3 pt-3">
        <button
          onClick={handleQuickSOS}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold tracking-wide
                     text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40
                     border border-rose-200 dark:border-rose-900/70 rounded-xl
                     hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:shadow-soft
                     transition-all duration-200 ease-out-expo active:scale-[0.98]"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Urgent Support / SOS</span>
        </button>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="gm-eyebrow px-3 mb-1.5">{group.label}</div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                                transition-all duration-200 ease-out-expo ${
                      isActive
                        ? 'bg-sage-600 text-white font-semibold shadow-soft'
                        : 'text-earth-700 dark:text-sage-300 font-medium hover:bg-earth-200/60 dark:hover:bg-forest-800 hover:translate-x-0.5'
                    }`}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-sage-600 dark:text-sage-400 group-hover:text-sage-700 dark:group-hover:text-sage-300'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-earth-200/70 dark:border-forest-800 space-y-2.5">
        <div className="text-[11px] text-earth-500 dark:text-sage-500 flex items-center justify-between">
          <span className="font-medium">Client v1.0.0</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-breathe absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Connected</span>
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold
                     text-earth-600 dark:text-sage-400 hover:bg-earth-200/50 dark:hover:bg-forest-800
                     hover:text-forest-900 dark:hover:text-sage-200
                     rounded-xl transition-all duration-200 active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-earth-50 dark:bg-forest-950 text-earth-900 dark:text-sage-100 transition-colors">
      {/* Mobile top bar */}
      <header
        className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3
                   bg-earth-50/85 dark:bg-forest-950/85 backdrop-blur-xl
                   border-b border-earth-200/70 dark:border-forest-800"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-sage-600 text-white flex-shrink-0">
            <Leaf className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight text-forest-950 dark:text-sage-50 truncate">
            {activePage?.name ?? 'GUIDE ME'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-earth-200/70 dark:bg-forest-800 text-earth-800 dark:text-sage-200
                       active:scale-95 transition-transform"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Mobile drawer: overlays the page instead of pushing it down. */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-forest-950/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`
            fixed md:sticky top-0 z-50 md:z-auto
            h-screen w-[17rem] flex-shrink-0 flex flex-col
            bg-earth-100/95 dark:bg-forest-900/95 md:bg-earth-100/70 md:dark:bg-forest-900/80
            backdrop-blur-xl border-r border-earth-200/80 dark:border-forest-800
            transition-transform duration-300 ease-out-expo
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          {sidebarContent}
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
