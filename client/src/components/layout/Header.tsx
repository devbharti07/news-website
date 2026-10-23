import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Search,
  Sun,
  Moon,
  Bookmark,
  RefreshCw,
  Globe,
  Menu,
  X,
  ChevronDown,
  Activity,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useBookmarks } from '../../context/BookmarksContext';
import { useRegion, AVAILABLE_REGIONS } from '../../context/RegionContext';

interface HeaderProps {
  lastUpdated?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  feedStatus?: {
    isCached?: boolean;
    isStale?: boolean;
    isFallback?: boolean;
    healthyCount?: number;
    totalCount?: number;
  };
}

const PRIMARY_CATEGORIES = [
  { name: 'Home', path: '/' },
  { name: 'World', path: '/world' },
  { name: 'India', path: '/india' },
  { name: 'Politics', path: '/politics' },
  { name: 'Business', path: '/business' },
  { name: 'Technology', path: '/technology' },
  { name: 'AI', path: '/ai' },
  { name: 'Science', path: '/science' },
  { name: 'Sports', path: '/sports' },
  { name: 'Entertainment', path: '/entertainment' },
];

const MORE_CATEGORIES = [
  { name: 'Gaming', path: '/gaming' },
  { name: 'Health', path: '/health' },
  { name: 'Space', path: '/space' },
  { name: 'Environment', path: '/environment' },
  { name: 'Finance', path: '/finance' },
  { name: 'Startups', path: '/startups' },
  { name: 'Education', path: '/education' },
  { name: 'Travel', path: '/travel' },
  { name: 'Lifestyle', path: '/lifestyle' },
];

export function Header({ lastUpdated, isRefreshing, onRefresh, feedStatus }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { bookmarks } = useBookmarks();
  const { region, setRegion, currentRegionInfo } = useRegion();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Formatted date: "Friday, October 24, 2026"
  const formattedToday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const formattedTime = lastUpdated
    ? new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(new Date(lastUpdated))
    : null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const isLive = !feedStatus?.isStale && !feedStatus?.isFallback;

  return (
    <header className="sticky top-0 z-40 bg-[#fdfcf9]/95 dark:bg-[#0c0f17]/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
      {/* 1. Compact Editorial Top Masthead Bar */}
      <div className="border-b border-gray-200/80 dark:border-gray-800/80 px-4 py-1.5 text-xs text-gray-500 dark:text-gray-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Today's Date & Wire Status */}
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {formattedToday}
            </span>
            <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">•</span>

            {/* Feed Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="flex h-2 w-2 relative">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isLive ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isLive ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                />
              </span>
              <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                {isLive
                  ? `Live Network (${feedStatus?.healthyCount || 45}/${feedStatus?.totalCount || 45} Feeds)`
                  : 'Archive Feed (Cached)'}
              </span>
              {formattedTime && (
                <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                  • Synced {formattedTime}
                </span>
              )}
            </div>
          </div>

          {/* Region Selector & Manual Refresh */}
          <div className="flex items-center gap-3">
            {/* Region Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs"
              >
                <span>{currentRegionInfo.flag}</span>
                <span className="hidden md:inline">{currentRegionInfo.label}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {isRegionDropdownOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-48 rounded-lg bg-white dark:bg-[#131926] shadow-xl border border-gray-200 dark:border-gray-800 py-1.5 z-50 animate-in fade-in"
                  onClick={() => setIsRegionDropdownOpen(false)}
                >
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Select Edition
                  </div>
                  {AVAILABLE_REGIONS.map(r => (
                    <button
                      key={r.code}
                      onClick={() => setRegion(r.code)}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                        region === r.code
                          ? 'font-bold text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{r.flag}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">•</span>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh latest stories"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 text-xs font-medium"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Brand Masthead */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Toggle Navigation"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand Logo */}
        <div className="flex-1 lg:flex-initial flex items-center justify-center lg:justify-start">
          <Link to="/" className="flex flex-col items-center lg:items-start group">
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl md:text-4xl font-editorial font-extrabold tracking-tight text-gray-950 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                CHRONICLE
              </span>
              <span className="h-2.5 w-2.5 rounded-full bg-red-600 self-baseline mt-2.5 sm:mt-3"></span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400 font-semibold -mt-1 hidden sm:block">
              Global News Aggregator
            </span>
          </Link>
        </div>

        {/* Right Action Icons: Search Form/Toggle, Bookmarks, Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search */}
          <div className="relative">
            {isSearchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <input
                  type="text"
                  placeholder="Search headlines, topics..."
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-48 sm:w-64 pl-8 pr-7 py-1.5 rounded-md text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500"
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                title="Search stories"
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Bookmarks Link */}
          <Link
            to="/bookmarks"
            title="Saved Reading List"
            className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Bookmark className="w-4 h-4" />
            {bookmarks.length > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold">
                {bookmarks.length}
              </span>
            )}
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Editorial Theme' : 'Switch to Dark Theme'}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* 3. Primary Categories Bar (Desktop) */}
      <nav className="hidden lg:block border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs font-semibold tracking-wide uppercase">
          <div className="flex items-center gap-0.5 overflow-x-auto py-1.5">
            {PRIMARY_CATEGORIES.map(cat => (
              <NavLink
                key={cat.path}
                to={cat.path}
                end={cat.path === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-red-600 dark:text-red-400 font-bold border-b-2 border-red-600 dark:border-red-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400'
                  }`
                }
              >
                {cat.name}
              </NavLink>
            ))}

            {/* More Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className="px-3 py-1.5 rounded text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 uppercase font-semibold transition-colors"
              >
                <span>More</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {isMoreOpen && (
                <div
                  className="absolute left-0 mt-2 w-44 rounded-lg bg-white dark:bg-[#131926] shadow-xl border border-gray-200 dark:border-gray-800 py-2 z-50"
                  onClick={() => setIsMoreOpen(false)}
                >
                  {MORE_CATEGORIES.map(cat => (
                    <Link
                      key={cat.path}
                      to={cat.path}
                      className="block px-4 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-600 dark:hover:text-red-400"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Link
            to="/search"
            className="flex items-center gap-1 text-gray-500 hover:text-gray-900 dark:hover:text-white py-1.5 transition-colors"
          >
            <Search className="w-3 h-3" />
            <span>Search Feeds</span>
          </Link>
        </div>
      </nav>

      {/* 4. Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-[#fdfcf9] dark:bg-[#0c0f17] px-4 py-4 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none"
            />
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          </form>

          {/* Primary Categories */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Sections
            </div>
            {PRIMARY_CATEGORIES.map(cat => (
              <Link
                key={cat.path}
                to={cat.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {cat.name}
              </Link>
            ))}
            {MORE_CATEGORIES.map(cat => (
              <Link
                key={cat.path}
                to={cat.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Region Switcher Mobile */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Edition / Region
            </div>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_REGIONS.map(r => (
                <button
                  key={r.code}
                  onClick={() => {
                    setRegion(r.code);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-2 rounded-lg text-xs flex items-center gap-2 border ${
                    region === r.code
                      ? 'border-red-600 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold'
                      : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>{r.flag}</span>
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
