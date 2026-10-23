import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Rss, ExternalLink } from 'lucide-react';

export function Footer() {
  const categoriesCol1 = [
    { name: 'World', path: '/world' },
    { name: 'India', path: '/india' },
    { name: 'Politics', path: '/politics' },
    { name: 'Business', path: '/business' },
    { name: 'Technology', path: '/technology' },
  ];

  const categoriesCol2 = [
    { name: 'Artificial Intelligence', path: '/ai' },
    { name: 'Science', path: '/science' },
    { name: 'Startups', path: '/startups' },
    { name: 'Health', path: '/health' },
    { name: 'Sports', path: '/sports' },
  ];

  const categoriesCol3 = [
    { name: 'Entertainment', path: '/entertainment' },
    { name: 'Gaming', path: '/gaming' },
    { name: 'Space', path: '/space' },
    { name: 'Environment', path: '/environment' },
    { name: 'Finance', path: '/finance' },
  ];

  const categoriesCol4 = [
    { name: 'Travel', path: '/travel' },
    { name: 'Education', path: '/education' },
    { name: 'Lifestyle', path: '/lifestyle' },
    { name: 'Saved Bookmarks', path: '/bookmarks' },
    { name: 'Global Search', path: '/search' },
  ];

  return (
    <footer className="mt-16 bg-white dark:bg-[#0a0d15] border-t border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Brand & Editorial Column */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-gray-200 dark:border-gray-800">
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-editorial font-bold text-gray-950 dark:text-gray-100 tracking-tight">
                CHRONICLE
              </span>
              <span className="h-2 w-2 rounded-full bg-red-600"></span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pr-6">
              A high-fidelity global news aggregation platform continuously synchronizing verified reporting across international wire services, independent bureaus, and investigative periodicals.
            </p>
            <div className="flex items-center gap-3 pt-2 text-gray-500">
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Aggregated via Legitimate Feeds
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                <Rss className="w-3.5 h-3.5" />
                Live RSS + API Fallback
              </span>
            </div>
          </div>

          {/* Section Directories */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-900 dark:text-gray-200 mb-3">
                News & World
              </h4>
              <ul className="space-y-2">
                {categoriesCol1.map(cat => (
                  <li key={cat.path}>
                    <Link to={cat.path} className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-900 dark:text-gray-200 mb-3">
                Tech & Innovation
              </h4>
              <ul className="space-y-2">
                {categoriesCol2.map(cat => (
                  <li key={cat.path}>
                    <Link to={cat.path} className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-900 dark:text-gray-200 mb-3">
                Culture & Science
              </h4>
              <ul className="space-y-2">
                {categoriesCol3.map(cat => (
                  <li key={cat.path}>
                    <Link to={cat.path} className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-900 dark:text-gray-200 mb-3">
                Platform
              </h4>
              <ul className="space-y-2">
                {categoriesCol4.map(cat => (
                  <li key={cat.path}>
                    <Link to={cat.path} className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Fair Use */}
        <div className="py-6 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed border-b border-gray-100 dark:border-gray-800/80">
          <p>
            <strong className="text-gray-700 dark:text-gray-300">Source Attribution & Fair Use Notice:</strong> Chronicle Global displays headlines, publication timestamps, and legally permitted editorial excerpts strictly for news discovery and informational purposes. Complete articles, investigative assets, and intellectual property remain the exclusive property of original publishers including BBC News, Reuters, The Guardian, TechCrunch, The Hindu, CNBC, Al Jazeera, and Associated Press. Users are always redirected to original publisher destinations to read full stories.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-400 dark:text-gray-500">
          <div>
            © {new Date().getFullYear()} Chronicle Global News. Built with React, Vite, Node.js, and TypeScript.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span>Automatic Refresh: 5m</span>
            </span>
            <span>•</span>
            <span>Zero Tracking</span>
            <span>•</span>
            <span>Privacy-Respecting Cache</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
