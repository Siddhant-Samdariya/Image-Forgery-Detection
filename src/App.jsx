import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { UploadArea } from './components/UploadArea';
import { AnalysisProgress } from './components/AnalysisProgress';
import { ResultsPage } from './pages/ResultsPage';
import { ForensicsStudio } from './pages/ForensicsStudio';
import { HistoryTable } from './components/HistoryTable';
import { ReportModal } from './components/ReportModal';
import { analyzeImage, checkHealth } from './services/api';
import { SAMPLE_CASES } from './data/mockData';

export function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCase, setSelectedCase] = useState(SAMPLE_CASES[0]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentStage, setCurrentStage] = useState(null);
  const [backendHealth, setBackendHealth] = useState(null);

  // Initialize theme from localStorage or system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sync Dark Mode class on <html> element and persist in localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Periodic health check
  useEffect(() => {
    checkHealth().then(setBackendHealth);
    const interval = setInterval(() => {
      checkHealth().then(setBackendHealth);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle Analysis Workflow Execution
  const handleStartAnalysis = async (fileOrPreset, options = {}) => {
    setActiveTab('processing');
    try {
      const result = await analyzeImage(fileOrPreset, options, (stage) => {
        setCurrentStage(stage);
      });
      setSelectedCase(result);

      // Persist into session history in localStorage
      if (result && !result.isOfflineFallback) {
        try {
          const prev = JSON.parse(localStorage.getItem('forensic_history') || '[]');
          const updated = [result, ...prev.filter(item => item.id !== result.id)].slice(0, 25);
          localStorage.setItem('forensic_history', JSON.stringify(updated));
        } catch (e) {
          console.warn("Could not write to localStorage:", e);
        }
      }
    } catch (err) {
      console.error("Analysis execution failed:", err);
    }
  };

  const handleProcessingComplete = () => {
    setActiveTab('results');
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#0b0f14] text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-slate-800 selection:text-white transition-colors duration-200">
      
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        backendHealth={backendHealth}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === 'home' && (
          <Home
            onNavigateToAnalyze={() => setActiveTab('analyze')}
            onNavigateToForensics={() => setActiveTab('forensics')}
            backendHealth={backendHealth}
          />
        )}

        {activeTab === 'analyze' && (
          <UploadArea
            onStartAnalysis={handleStartAnalysis}
            selectedCase={selectedCase}
            setSelectedCase={setSelectedCase}
          />
        )}

        {activeTab === 'processing' && (
          <AnalysisProgress
            currentStage={currentStage}
            onComplete={handleProcessingComplete}
          />
        )}

        {activeTab === 'results' && (
          <ResultsPage
            currentCase={selectedCase}
            onOpenStudio={() => setActiveTab('forensics')}
            onOpenReport={() => setShowReportModal(true)}
          />
        )}

        {activeTab === 'forensics' && (
          <ForensicsStudio
            currentCase={selectedCase}
            onOpenReport={() => setShowReportModal(true)}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTable
            onSelectCase={(c) => { setSelectedCase(c); setActiveTab('results'); }}
            onOpenReport={() => setShowReportModal(true)}
          />
        )}
      </main>

      {/* Minimal Clean Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-[#fbfbfa] dark:bg-[#0b0f14] px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2 transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Digital Image Forensics & Authenticity Platform</span>
          <span>•</span>
          <span>v4.2.1</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Engine Status: {backendHealth?.status === 'operational' ? 'Active' : 'Offline'}</span>
          <span>Models: {backendHealth?.models_loaded || '2/4'}</span>
          <span>Vault: SEC-LOCAL-SANDBOX</span>
        </div>
      </footer>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          caseData={selectedCase}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

export default App;
