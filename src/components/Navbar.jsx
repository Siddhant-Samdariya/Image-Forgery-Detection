import React, { useState, useEffect } from 'react';
import { Sun, Moon, Shield } from 'lucide-react';

export function Navbar({ activeTab, setActiveTab, isDarkMode, setIsDarkMode, backendHealth }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Overview' },
    { id: 'analyze', label: 'Analyze' },
    { id: 'forensics', label: 'Studio' },
    { id: 'history', label: 'Ledger' },
  ];

  const isOnline = backendHealth?.status === 'operational';

  return (
    <header className={`sticky top-0 z-50 bg-[#fbfbfa]/90 dark:bg-[#0b0f14]/90 backdrop-blur-md transition-all duration-300 border-b ${
      scrolled ? 'border-slate-200/80 dark:border-slate-800/80 py-2.5 shadow-xs' : 'border-slate-200/40 dark:border-slate-800/40 py-3.5'
    }`}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('home')} 
            className="flex items-center gap-2 font-mono font-bold text-sm tracking-wider text-slate-900 dark:text-white uppercase focus:outline-none cursor-pointer"
          >
            <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>IMAGE FORENSICS</span>
          </button>

          {/* Engine Status Tag */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-xs border text-[10px] font-mono border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500">
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isOnline ? `Models: ${backendHealth?.models_loaded || 'Active'}` : 'Connecting Engine'}</span>
          </div>
        </div>

        {/* Minimal Navigation Links */}
        <nav className="flex items-center gap-6 sm:gap-8 text-xs font-mono tracking-wider uppercase">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`transition-colors cursor-pointer ${
                  isActive
                    ? 'text-cyan-600 dark:text-cyan-400 font-bold border-b-2 border-cyan-500 pb-0.5'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="flex items-center">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2 rounded-xs hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors focus:outline-none cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>

      </div>
    </header>
  );
}
