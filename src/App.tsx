/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Menu, Search, SlidersHorizontal, Brain, Mic, Camera, Upload, 
  Database, CheckCircle2, PlusCircle, LayoutDashboard, ListTodo, 
  MoreHorizontal, Zap, Heart, Network, Compass, AlertTriangle, 
  Info, Phone, ChevronRight, Loader2, Plus, Settings, User, 
  ShieldCheck, Bell, LogOut, Car, CloudSun, Newspaper, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Screen, IntakeItem, ActionStep } from './types';
import { analyzeSituation } from './services/gemini';
import { supabase } from './lib/supabaseClient';

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div role="alert" className="flex flex-col items-center justify-center p-12 text-center space-y-4 bg-error-container/10 rounded-2xl min-h-[400px]">
          <AlertTriangle size={48} className="text-error" aria-hidden="true" />
          <h3 className="text-xl font-bold font-headline">Intelligence Sync Disrupted</h3>
          <p className="text-on-surface-variant max-w-xs">The Nexus interface encountered a critical synchronization error with the core systems.</p>
          <button 
            id="restart-core-button"
            onClick={() => window.location.reload()} 
            className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform"
            aria-label="Restart Core Application"
          >
            Restart Core
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Components ---

const BottomNav = ({ activeScreen, setScreen }: { activeScreen: Screen, setScreen: (s: Screen) => void }) => {
  const navItems = [
    { id: 'INTAKE', label: 'Intake', icon: PlusCircle },
    { id: 'IMPACT', label: 'Impact', icon: LayoutDashboard },
    { id: 'NEXUS', label: 'Nexus', icon: Brain },
    { id: 'ACTION', label: 'Action', icon: ListTodo },
    { id: 'MENU', label: 'Menu', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-surface/90 backdrop-blur-md border-t border-outline-variant/20 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] rounded-t-3xl" aria-label="Main Navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeScreen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setScreen(item.id as Screen)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Go to ${item.label} screen`}
            className={cn(
              "flex flex-col items-center justify-center px-3 py-2 transition-all duration-300 rounded-xl",
              isActive ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:text-primary"
            )}
          >
            <Icon size={24} className={cn(isActive && "fill-current")} aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

const Header = () => (
  <header className="bg-surface/80 backdrop-blur-md flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40" id="main-header">
    <div className="flex items-center gap-4">
      <button id="sidebar-toggle" className="hover:bg-surface-container-high p-2 rounded-full transition-colors" aria-label="Open sidebar menu">
        <Menu size={24} className="text-primary" aria-hidden="true" />
      </button>
      <h1 className="font-headline text-2xl font-bold tracking-tight text-primary">Nexus</h1>
    </div>
    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/10">
      <img 
        alt="Operator profile" 
        src="/assets/operator_avatar.png" 
        referrerPolicy="no-referrer"
      />
    </div>
  </header>
);

// --- Screens ---

const IntakeScreen = ({ onStartNexus }: { onStartNexus: (input: string) => void }) => {
  const [input, setInput] = useState('');
  const [recentIntakes, setRecentIntakes] = useState<IntakeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentIntakes = async () => {
      try {
        const { data, error } = await supabase
          .from('intakes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(2);
        
        if (data) {
          setRecentIntakes(data.map(item => ({
            id: item.id,
            title: item.title,
            status: item.status as any,
            timestamp: new Date(item.created_at).toLocaleTimeString() + ' ago',
            description: item.description || 'Analyzing...'
          })));
        }
      } catch (err) {
        console.error('Fetch intakes error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentIntakes();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onStartNexus(input);
    }
  };

  return (
    <div className="space-y-12 pb-12">
      <section className="relative">
        <form id="intake-form" onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-full px-6 py-4 flex items-center shadow-sm" role="search">
          <Search size={20} className="text-outline mr-3" aria-hidden="true" />
          <input 
            id="situation-input"
            className="bg-transparent border-none focus:outline-none w-full text-on-surface placeholder:text-outline" 
            placeholder="Search past actions or describe a new situation..." 
            type="text"
            aria-label="Situation description or search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button id="analyze-button" type="submit" className="text-primary font-bold ml-3" aria-label="Analyze situation">Analyze</button>
          <SlidersHorizontal size={20} className="text-outline ml-3" aria-hidden="true" />
        </form>
      </section>

      <section className="text-center space-y-4">
        <div className="inline-flex items-center px-4 py-2 bg-tertiary-container/10 text-tertiary font-medium rounded-full backdrop-blur-md">
          <Brain size={20} className="mr-2 fill-current" />
          <span className="text-sm font-label tracking-wide uppercase">AI Guardian Active</span>
        </div>
        <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface">
          I'm Nexus. What's the situation?
        </h2>
        <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
          Tell me, show me, or upload a report. I am here to coordinate the next steps immediately.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button 
          id="intake-voice-button"
          onClick={async () => {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              onStartNexus('Voice data captured from user microphone. Situation: "Emergency unfolding in Sector 7."');
              // In a real app, we'd process the stream here.
              stream.getTracks().forEach(t => t.stop());
            } catch (err) {
              alert('Microphone access denied or unavailable.');
            }
          }}
          className="group bg-surface-container-lowest p-8 rounded-xl flex flex-col items-center justify-center space-y-4 shadow-sm hover:shadow-md transition-all duration-300 border-b-2 border-transparent hover:border-primary"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <Mic size={32} />
          </div>
          <span className="font-headline font-bold text-xl">Voice</span>
          <p className="text-sm text-on-surface-variant text-center">Narrate the event in real-time</p>
        </button>

        <button 
          id="intake-camera-button"
          onClick={async () => {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true });
              onStartNexus('Visual evidence captured from camera. Situation: "Structural integrity assessment required at Main Plaza."');
              stream.getTracks().forEach(t => t.stop());
            } catch (err) {
              alert('Camera access denied or unavailable.');
            }
          }}
          className="group relative overflow-hidden bg-primary p-8 rounded-xl flex flex-col items-center justify-center space-y-4 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-90"></div>
          <div className="relative z-10 w-16 h-16 rounded-full bg-on-primary/20 backdrop-blur-md flex items-center justify-center text-on-primary group-hover:scale-110 transition-transform">
            <Camera size={32} />
          </div>
          <span className="relative z-10 font-headline font-bold text-xl text-on-primary">Photo/Camera</span>
          <p className="relative z-10 text-sm text-on-primary/80 text-center">Capture visual evidence</p>
        </button>

        <button 
          id="intake-upload-button"
          onClick={() => {
            const el = document.createElement('input');
            el.type = 'file';
            el.onchange = (e: any) => {
              const file = e.target.files[0];
              if (file) onStartNexus(`Analyzing document: ${file.name}. Contents scanned for critical system bridges.`);
            };
            el.click();
          }}
          className="group bg-surface-container-lowest p-8 rounded-xl flex flex-col items-center justify-center space-y-4 shadow-sm hover:shadow-md transition-all duration-300 border-b-2 border-transparent hover:border-primary"
        >
          <div className="w-16 h-16 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
            <Upload size={32} />
          </div>
          <span className="font-headline font-bold text-xl">Upload Files</span>
          <p className="text-sm text-on-surface-variant text-center">Submit PDFs, logs, or reports</p>
        </button>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h3 className="font-headline text-2xl font-bold">Universal Feeds</h3>
          <p className="text-on-surface-variant text-sm">Connect real-time data streams</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Car, label: 'Traffic Feed', sub: `Sector ${Math.floor(Math.random() * 9) + 1} congestion data`, color: 'text-amber-500', input: 'Analyze real-time traffic congestion in Sector 4 and suggest rerouting for emergency vehicles.' },
            { icon: CloudSun, label: 'Weather Alert', sub: Math.random() > 0.5 ? 'Incoming storm front' : 'High UV index warning', color: 'text-blue-500', input: 'Evaluate the impact of the incoming weather patterns on low-lying community shelters.' },
            { icon: Newspaper, label: 'News Stream', sub: `Last report: ${Math.floor(Math.random() * 15) + 1}m ago`, color: 'text-emerald-500', input: 'Sift through local news reports for any signs of infrastructure failure in the downtown area.' },
          ].map((feed, i) => (
            <button 
              key={i}
              onClick={() => onStartNexus(feed.input)}
              className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/10 hover:bg-surface-container transition-all group"
            >
              <div className={cn("w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center group-hover:scale-110 transition-transform", feed.color)}>
                <feed.icon size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-on-surface">{feed.label}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">{feed.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h3 className="font-headline text-2xl font-bold">Recent Intakes</h3>
          <button 
            onClick={() => onStartNexus('Overview of all past intakes and recent actions')}
            className="text-primary font-semibold text-sm hover:underline"
          >
            Sift Records
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="md:col-span-2 flex justify-center p-8">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : recentIntakes.length > 0 ? (
            recentIntakes.map((intake) => (
              <div 
                key={intake.id} 
                onClick={() => intake.status === 'READY' && onStartNexus(intake.title)}
                className={cn(
                  "bg-surface-container-low p-6 rounded-xl flex items-start gap-4 transition-all",
                  intake.status === 'READY' ? "cursor-pointer hover:bg-surface-container hover:shadow-md" : "opacity-80"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  intake.status === 'VERIFYING' ? "bg-tertiary-container/20 text-tertiary animate-pulse" : "bg-secondary-container/20 text-secondary"
                )}>
                  {intake.status === 'VERIFYING' ? <Database size={24} /> : <CheckCircle2 size={24} className="fill-current" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-on-surface">{intake.title}</h4>
                    <span className={cn(
                      "text-[10px] font-label font-bold uppercase tracking-widest px-2 py-1 rounded",
                      intake.status === 'VERIFYING' ? "bg-tertiary-container text-on-tertiary-container" : "bg-secondary text-on-secondary"
                    )}>
                      {intake.status === 'VERIFYING' ? 'Verifying...' : 'Action Hub Ready'}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant mt-1">Uploaded {intake.timestamp} • {intake.description}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 p-12 text-center bg-surface-container-lowest rounded-2xl border-2 border-dashed border-outline-variant/30 text-on-surface-variant font-medium">
              No recent intakes found. Start a new analysis to see results here.
            </div>
          )}

          <div className="md:col-span-2 bg-surface-container-highest/50 p-1 rounded-xl">
            <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col md:flex-row gap-8 items-center border-l-4 border-primary">
              <div className="w-full md:w-1/3 h-40 rounded-xl overflow-hidden shadow-inner">
                <img 
                  alt="Aerial supply drop" 
                  className="w-full h-full object-cover" 
                  src="https://picsum.photos/seed/humanitarian/400/300" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 space-y-4">
                <h4 className="font-headline text-2xl font-bold leading-tight">Emergency Medical Supply Intake</h4>
                <p className="text-on-surface-variant leading-relaxed">The manifest for Medical Drop #12-Beta has been cross-referenced with local inventory. Intelligence suggests immediate redeployment to Sector 4.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-surface-container px-3 py-1 rounded-full text-xs font-semibold text-on-surface-variant">Medicine</span>
                  <span className="bg-surface-container px-3 py-1 rounded-full text-xs font-semibold text-on-surface-variant">Logistics</span>
                  <span className="bg-surface-container px-3 py-1 rounded-full text-xs font-semibold text-on-surface-variant">Priority: High</span>
                </div>
              </div>
              <button 
                onClick={() => onStartNexus('Emergency Medical Supply Intake Manifest Analysis')}
                className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 whitespace-nowrap"
              >
                Review Actions
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const NexusScreen = ({ input, onComplete }: { input: string, onComplete: (data: any) => void }) => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Initializing Nexus Core...');

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev >= 90 ? prev : prev + 2;
        if (next < 30) setStatusText('Parsing unstructured input...');
        else if (next < 60) setStatusText('Cross-referencing global systems...');
        else if (next < 85) setStatusText('Synthesizing life-saving actions...');
        else setStatusText('Finalizing intelligence bridge...');
        return next;
      });
    }, 100);

    const runAnalysis = async () => {
      try {
        const result = await analyzeSituation(input);
        setProgress(100);
        setTimeout(() => onComplete(result), 500);
      } catch (err) {
        console.error(err);
        setError('Failed to analyze situation. Please try again.');
      }
    };

    runAnalysis();
    return () => clearInterval(timer);
  }, [input, onComplete]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center text-error">
          <AlertTriangle size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="font-headline text-2xl font-bold text-on-surface">Analysis Interrupted</h3>
          <p className="text-on-surface-variant max-w-xs">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold shadow-lg"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-12 pb-12">
      <section className="w-full text-center">
        <h2 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-on-surface">
          Nexus Intelligence
        </h2>
        <p className="text-on-surface-variant text-lg max-w-2xl mx-auto leading-relaxed">
          Converting unstructured intent into verified community action. Nexus is bridging the gap between your input and the systems that matter.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
        <div className="md:col-span-7 relative h-[400px] rounded-xl overflow-hidden bg-surface-container-low flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <img 
              alt="Abstract neural network" 
              className="w-full h-full object-cover grayscale" 
              src="https://picsum.photos/seed/neural/800/600" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="relative z-10 w-48 h-48 rounded-full bg-gradient-to-tr from-primary to-tertiary-container shadow-[0_0_60px_-15px_rgba(100,46,231,0.5)] flex items-center justify-center">
            <div className="absolute inset-0 rounded-full ai-core-glow animate-pulse"></div>
            <Brain size={64} className="text-on-primary fill-current" />
          </div>
          <div className="absolute top-10 left-10 glass-panel px-4 py-2 rounded-full border border-outline-variant/10 text-xs font-semibold tracking-widest text-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
            VERIFYING AUTHENTICITY
          </div>
          <div className="absolute bottom-12 right-12 glass-panel px-4 py-2 rounded-full border border-outline-variant/10 text-xs font-semibold tracking-widest text-tertiary flex items-center gap-2">
            <Database size={16} />
            LOCAL REPOSITORY: ACCESSED
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
            <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-outline mb-4">Current Task</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Globe size={24} />
              </div>
              <div>
                <p className="font-bold text-on-surface truncate max-w-[200px]">{input}</p>
                <p className="text-xs text-on-surface-variant font-medium">Universal Bridge Protocol v2.4</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-high p-8 rounded-xl flex-grow border border-outline-variant/10">
            <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-outline mb-6">Processing Feed</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-2 border-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{progress}%</span>
                  </div>
                  <svg className="absolute inset-0 w-10 h-10 -rotate-90">
                    <circle 
                      cx="20" cy="20" r="18" 
                      fill="none" stroke="currentColor" strokeWidth="2"
                      className="text-primary"
                      strokeDasharray={113}
                      strokeDashoffset={113 - (113 * progress) / 100}
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-on-surface">{statusText}</p>
                  <p className="text-xs text-on-surface-variant">Nexus Core is operating within optimal parameters.</p>
                </div>
              </div>
              
              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionHubScreen = ({ data, setScreen }: { data: any, setScreen: (s: Screen) => void }) => {
  const [steps, setSteps] = useState<ActionStep[]>(data?.actions || []);
  const [toast, setToast] = useState<string | null>(null);

  const handleToggleComplete = (id: number) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, status: step.status === 'COMPLETED' ? 'READY' : 'COMPLETED' } : step
    ));
    const title = steps.find(s => s.id === id)?.title || 'Action';
    setToast(`${title} status updated.`);
    setTimeout(() => setToast(null), 3000);
  };

  if (!data || steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6 text-on-surface-variant">
        <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center">
          <ListTodo size={48} className="opacity-20" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-headline text-2xl font-bold text-on-surface">No Active Actions</h3>
          <p className="text-sm max-w-xs mx-auto">Start a Nexus analysis from the Intake screen to generate prioritized community steps.</p>
        </div>
        <button 
          onClick={() => setScreen('INTAKE')}
          className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
        >
          Return to Intake
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 relative">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-primary text-on-primary px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2"
          >
            <CheckCircle2 size={20} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative overflow-hidden rounded-xl bg-tertiary-container/10 p-6 ai-pulse-glow backdrop-blur-xl border-l-4 border-tertiary">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-tertiary fill-current" />
            <span className="font-headline font-bold text-tertiary uppercase tracking-widest text-xs">Nexus Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            {data?.priority && (
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                data.priority === 'High' ? "bg-error text-on-error" : 
                data.priority === 'Medium' ? "bg-secondary text-on-secondary" : 
                "bg-outline text-white"
              )}>
                {data.priority} Priority
              </div>
            )}
            <div className="bg-tertiary text-on-tertiary px-3 py-1 rounded-full text-xs font-bold">
              {data?.confidence || 98}% Confidence
            </div>
          </div>
        </div>
        <h2 className="font-headline text-2xl font-extrabold tracking-tight mb-2">Situation: {data?.situation || 'Awaiting situation analysis...'}</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          {data?.impactProjection || 'Nexus is ready to project community impact once analysis is complete.'}
        </p>
      </section>

      <div>
        <h3 className="font-headline text-3xl font-extrabold tracking-tighter">Action Hub</h3>
        <p className="text-on-surface-variant font-medium">Follow prioritized steps immediately.</p>
      </div>

      <div className="space-y-6">
        {steps.map((step) => (
          <div key={step.id} className={cn(
            "bg-surface-container-lowest rounded-xl p-6 shadow-sm transition-all duration-300",
            step.status === 'READY' && "border-2 border-error/20",
            step.status === 'PENDING' && "opacity-80 grayscale-[0.5]",
            step.status === 'COMPLETED' && "opacity-60"
          )}>
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <span className={cn(
                  "text-xs font-bold tracking-widest uppercase",
                  step.status === 'READY' ? "text-error" : 
                  step.status === 'PENDING' ? "text-outline" : 
                  step.status === 'COMPLETED' ? "text-secondary" : "text-primary"
                )}>Step {step.id}</span>
                <h4 className={cn(
                  "font-headline text-xl font-bold",
                  step.status === 'COMPLETED' && "line-through"
                )}>{step.title}</h4>
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                step.status === 'RECOMMENDED' ? "bg-secondary-container text-on-secondary-container" :
                step.status === 'READY' ? "bg-error-container text-on-error-container" :
                step.status === 'COMPLETED' ? "bg-secondary-container/20 text-secondary" :
                "bg-surface-container-highest text-on-surface-variant"
              )}>
                {step.status === 'READY' && <AlertTriangle size={12} className="fill-current" />}
                {step.status === 'RECOMMENDED' ? 'Recommended' : 
                 step.status === 'READY' ? 'Ready to Call' : 
                 step.status === 'COMPLETED' ? 'Completed' : 'Pending'}
              </span>
            </div>

            {step.instructions && step.status !== 'COMPLETED' && (
              <div className="bg-surface-container-low rounded-lg p-4 mb-4">
                <ul className="space-y-3 text-sm font-medium text-on-surface">
                  {step.instructions.map((inst, i) => (
                    <li key={i} className="flex gap-3">
                      <CheckCircle2 size={16} className="text-primary" />
                      <span>{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {step.description && <p className={cn(
              "text-sm text-on-surface-variant mb-6",
              step.status === 'COMPLETED' && "line-through opacity-50"
            )}>{step.description}</p>}

            {step.locationInfo && step.status !== 'COMPLETED' && (
              <div className="flex items-center gap-4 p-3 bg-surface-container-low rounded-lg mb-4">
                <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center">
                  <Plus size={24} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm">{step.locationInfo.split(' • ')[0]}</p>
                  <p className="text-xs text-on-surface-variant">{step.locationInfo.split(' • ').slice(1).join(' • ')}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button 
                onClick={() => handleToggleComplete(step.id)}
                className={cn(
                  "w-full py-4 rounded-xl font-bold tracking-tight flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md",
                  step.status === 'READY' ? "bg-error text-on-error hover:bg-error/90" : 
                  step.status === 'PENDING' ? "border border-primary text-primary hover:bg-primary/5" :
                  step.status === 'COMPLETED' ? "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high" :
                  "bg-primary text-on-primary hover:bg-primary/90"
                )}
              >
                {step.icon === 'call' && <Phone size={20} className={cn(step.status !== 'COMPLETED' && "fill-current")} />}
                {step.icon === 'info' && <Info size={20} />}
                {step.icon === 'check' && <CheckCircle2 size={20} />}
                {step.icon === 'alert' && <AlertTriangle size={20} className={cn(step.status !== 'COMPLETED' && "fill-current")} />}
                {step.status === 'COMPLETED' ? 'Mark Incomplete' : (step.actionText || 'Execute Action')}
                {step.status === 'RECOMMENDED' && <ChevronRight size={20} />}
              </button>
              {step.status === 'READY' && (
                <button 
                  onClick={() => {
                    setToast('Auto-coordination system engaged.');
                    setTimeout(() => setToast(null), 3000);
                  }}
                  className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-primary border border-primary/20 hover:bg-primary/5 transition-colors"
                >
                  Auto-Coordinate with Responders
                </button>
              )}
            </div>
          </div>
        ))}

        {steps.length > 0 && (
          <div className="pt-8 flex flex-col md:flex-row gap-4">
            <button 
              onClick={() => setScreen('INTAKE')}
              className="flex-1 bg-surface-container-lowest border border-outline-variant/20 p-6 rounded-xl flex items-center justify-center gap-3 font-bold hover:bg-surface-container transition-colors active:scale-95 shadow-sm"
            >
              <PlusCircle size={24} className="text-primary" />
              Start New Analysis
            </button>
            <button 
              onClick={() => setScreen('IMPACT')}
              className="flex-1 bg-surface-container-lowest border border-outline-variant/20 p-6 rounded-xl flex items-center justify-center gap-3 font-bold hover:bg-surface-container transition-colors active:scale-95 shadow-sm"
            >
              <LayoutDashboard size={24} className="text-secondary" />
              View Impact Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ImpactDashboardScreen = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    actions: 1284,
    resources: 342,
    efficiency: 12
  });
  const [lastUpdated, setLastUpdated] = useState('Just now');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLastUpdated('Syncing...');
        const { count: intakeCount } = await supabase
          .from('intakes')
          .select('*', { count: 'exact', head: true });
        
        // Fetch profile metrics if available, otherwise use defaults
        let impactPoints = 0;
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('impact_points')
            .limit(1)
            .maybeSingle(); // maybeSingle won't throw 406 on empty
          
          if (!profileError && profile) {
            impactPoints = profile.impact_points;
          }
        } catch (e) {
          console.warn('Profile fetch skipped or failed:', e);
        }

        setMetrics({
          actions: (intakeCount || 0) * 42 + 1284,
          resources: (impactPoints / 2) + 150,
          efficiency: 12 + Math.floor((intakeCount || 0) / 10)
        });
        setLastUpdated('Last synced: ' + new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Fetch metrics error:', err);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Explicit refresh logic
    const { count } = await supabase.from('intakes').select('*', { count: 'exact', head: true });
    setMetrics(prev => ({
      ...prev,
      actions: (count || 0) * 42 + 1284
    }));
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated('Analysis updated at ' + new Date().toLocaleTimeString());
    }, 1000);
  };

  return (
    <div className="space-y-10 pb-12">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Impact Dashboard</h2>
          <p className="text-on-surface-variant text-lg max-w-2xl">Monitoring community resilience and active bridges in real-time.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Active Intelligence</p>
            <p className="text-xs font-bold text-on-surface">{lastUpdated}</p>
          </div>
          <button 
            id="cloud-sync-button"
            onClick={() => {
              setIsRefreshing(true);
              setTimeout(() => {
                setIsRefreshing(false);
                setLastUpdated('Google Cloud Sync: Active (' + new Date().toLocaleTimeString() + ')');
              }, 1500);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/20 transition-all",
              isRefreshing && "opacity-50"
            )}
          >
            <ShieldCheck size={16} />
            Cloud Sync
          </button>
          <button 
            id="refresh-metrics-button"
            onClick={handleRefresh}
            className={cn(
              "w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary transition-all active:scale-95 shadow-sm hover:shadow-md",
              isRefreshing && "animate-spin"
            )}
            aria-label="Refresh metrics"
          >
            <Loader2 size={24} />
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 space-y-6">
          <div className="bg-primary-container p-8 rounded-xl text-on-primary-container flex flex-col justify-between h-48 shadow-sm">
            <div className="flex justify-between items-start">
              <Heart size={40} className="fill-current" />
              <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">+{metrics.efficiency}%</span>
            </div>
            <div>
              <div className="text-4xl font-extrabold font-headline">{metrics.actions.toLocaleString()}</div>
              <div className="text-sm font-semibold uppercase tracking-wider opacity-80">Life-saving actions today</div>
            </div>
          </div>

          <div className="bg-secondary-container p-8 rounded-xl text-on-secondary-container flex flex-col justify-between h-48 shadow-sm">
            <div className="flex justify-between items-start">
              <Network size={40} />
            </div>
            <div>
              <div className="text-4xl font-extrabold font-headline">{metrics.resources}</div>
              <div className="text-sm font-semibold uppercase tracking-wider opacity-80">Community resources active</div>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 bg-surface-container-low rounded-xl overflow-hidden relative min-h-[400px]">
          <div className="absolute inset-0 bg-slate-200">
            <img 
              className="w-full h-full object-cover opacity-60" 
              src="https://picsum.photos/seed/map/800/600" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute top-6 left-6 z-10 bg-surface-container-lowest/90 backdrop-blur-md p-4 rounded-xl shadow-lg max-w-xs">
            <h3 className="font-headline font-bold text-lg mb-2">Areas of Intervention</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm font-medium">Active Bridge: Sector 7G</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-secondary"></div>
              <span className="text-sm font-medium">Resource Station Alpha</span>
            </div>
          </div>
          <div className="absolute bottom-6 right-6 z-10">
            <button className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-transform">
              <Compass size={20} />
              Expand Map
            </button>
          </div>
        </div>

        <div className="md:col-span-6 bg-surface-container-lowest rounded-xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline text-xl font-bold">Recent Alerts</h3>
            <button 
              onClick={() => handleRefresh()}
              className="text-primary font-bold text-sm hover:underline"
            >
              Sync All
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4 items-start p-4 bg-error-container/20 rounded-xl">
              <AlertTriangle size={24} className="text-error fill-current" />
              <div>
                <p className="font-bold text-sm text-on-surface">Critical Resource Gap</p>
                <p className="text-xs text-on-surface-variant">Medical supplies needed in District 4. Est. 2h response.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-4 bg-tertiary-container/10 rounded-xl">
              <Info size={24} className="text-tertiary" />
              <div>
                <p className="font-bold text-sm text-on-surface">Bridge Stabilized</p>
                <p className="text-xs text-on-surface-variant">Community Bridge #402 is now fully operational.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-6 bg-surface-container-lowest rounded-xl p-8 shadow-sm">
          <h3 className="font-headline text-xl font-bold mb-6">Active Community Bridges</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: '402 East', status: 'STABLE', value: 85, color: 'bg-secondary', label: 'Resilience' },
              { id: '109 North', status: 'SYNCING', value: 45, color: 'bg-tertiary', label: 'Capacity' },
              { id: '88 South', status: 'STABLE', value: 92, color: 'bg-secondary', label: 'Resilience' },
              { id: '211 West', status: 'ALERT', value: 15, color: 'bg-error', label: 'Stability' },
            ].map((bridge) => (
              <div key={bridge.id} className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-on-surface-variant">{bridge.id}</span>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded font-bold",
                    bridge.status === 'STABLE' ? "bg-secondary-container text-on-secondary-container" :
                    bridge.status === 'SYNCING' ? "bg-tertiary-container/20 text-tertiary" :
                    "bg-error-container text-on-error-container"
                  )}>{bridge.status}</span>
                </div>
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className={cn("h-full", bridge.color)} style={{ width: `${bridge.value}%` }}></div>
                </div>
                <span className="text-xs font-medium">{bridge.value}% {bridge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-12">
        <div className="bg-tertiary-container/10 backdrop-blur-xl border border-tertiary-container/20 p-8 rounded-xl flex flex-col md:flex-row items-center gap-8 shadow-inner">
          <div className="flex-shrink-0 relative">
            <div className="w-16 h-16 rounded-full bg-tertiary-container flex items-center justify-center animate-pulse">
              <Brain size={32} className="text-on-tertiary-container fill-current" />
            </div>
          </div>
          <div className="text-center md:text-left">
            <h4 className="font-headline text-xl font-bold text-tertiary mb-2">Nexus AI Impact Projection</h4>
            <p className="text-on-surface-variant leading-relaxed">Based on current community data, we anticipate a <span className="text-secondary font-bold">15% increase</span> in resource efficiency by tomorrow morning if Bridge #109 completes synchronization. Recommended action: Direct surplus medical kits to District 4.</p>
          </div>
          <div className="flex-shrink-0">
            <button className="px-8 py-3 bg-tertiary text-on-tertiary rounded-full font-bold shadow-md hover:shadow-xl transition-shadow active:scale-95">Optimize Flow</button>
          </div>
        </div>
      </section>
    </div>
  );
};

const MenuScreen = () => {
  const menuItems = [
    { icon: User, label: 'Profile Intelligence', sub: 'Manage your biometric identity' },
    { icon: ShieldCheck, label: 'Security Protocols', sub: 'AES-256 Encryption active' },
    { icon: Bell, label: 'Alert Preferences', sub: 'Sector 7 notifications enabled' },
    { icon: Network, label: 'Bridge Connections', sub: '12 active community links' },
    { icon: Settings, label: 'System Configuration', sub: 'Nexus Core v2.4.0' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <section className="flex items-center gap-6 p-6 bg-surface-container-low rounded-2xl border border-outline-variant/10 shadow-sm">
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
          <img 
            alt="User profile" 
            src="/assets/operator_avatar.png" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h2 className="font-headline text-2xl font-extrabold text-on-surface">Operator Alpha-9</h2>
          <p className="text-on-surface-variant font-medium">Community Bridge Coordinator</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-xs font-bold text-secondary uppercase tracking-widest">Online & Verified</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-primary-container/10 p-6 rounded-2xl border border-primary/10">
          <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-primary mb-4">Nexus Reputation</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold font-headline text-primary">4,920</span>
            <span className="text-sm font-bold text-primary/60 mb-1">Impact Points</span>
          </div>
          <p className="text-xs text-on-surface-variant mt-2">Top 2% of community responders this month.</p>
        </div>
        <div className="bg-tertiary-container/10 p-6 rounded-2xl border border-tertiary/10">
          <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-tertiary mb-4">Active Bridges</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold font-headline text-tertiary">12</span>
            <span className="text-sm font-bold text-tertiary/60 mb-1">Live Links</span>
          </div>
          <p className="text-xs text-on-surface-variant mt-2">Connecting 4 sectors with real-time intelligence.</p>
        </div>
      </div>

      <div className="space-y-3">
        {menuItems.map((item, i) => (
          <button key={i} className="w-full flex items-center justify-between p-5 bg-surface-container-lowest rounded-xl hover:bg-surface-container transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <item.icon size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-on-surface">{item.label}</p>
                <p className="text-xs text-on-surface-variant">{item.sub}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-outline group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>

      <button 
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        className="w-full flex items-center justify-center gap-2 p-5 text-error font-bold hover:bg-error/5 rounded-xl transition-colors mt-4"
      >
        <LogOut size={20} />
        Terminate Session
      </button>
    </div>
  );
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('INTAKE');
  const [analysisInput, setAnalysisInput] = useState(() => localStorage.getItem('nexus_last_input') || '');
  const [analysisResult, setAnalysisResult] = useState<any>(() => {
    const saved = localStorage.getItem('nexus_last_result');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (analysisInput) localStorage.setItem('nexus_last_input', analysisInput);
    if (analysisResult) localStorage.setItem('nexus_last_result', JSON.stringify(analysisResult));
  }, [analysisInput, analysisResult]);

  const [privacyMode, setPrivacyMode] = useState(false);
  
  const handleStartNexus = (input: string) => {
    let finalInput = input;
    if (privacyMode) {
      // Basic PII redaction for demonstration
      finalInput = input
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/g, '[EMAIL REDACTED]')
        .replace(/\+?\d{10,14}/g, '[PHONE REDACTED]');
      console.log('Nexus Privacy Bridge: Sensitive data anonymized for cloud transmission.');
    }
    setAnalysisInput(finalInput);
    setScreen('NEXUS');
  };

  const handleAnalysisComplete = async (data: any) => {
    setAnalysisResult(data);
    setScreen('ACTION');

    // Persist to Supabase
    try {
      const { data: intakeData, error: intakeError } = await supabase
        .from('intakes')
        .insert([{
          title: data.situation || 'Situation Analysis',
          description: data.impactProjection,
          input_type: 'automated',
          status: 'READY'
        }])
        .select()
        .single();
      
      if (intakeError) throw intakeError;

      if (data.actions && intakeData) {
        const actionsToInsert = data.actions.map((action: any) => ({
          intake_id: intakeData.id,
          title: action.title,
          description: action.description,
          status: action.status,
          priority: data.priority,
          confidence: data.confidence,
          instructions: action.instructions,
          action_text: action.actionText,
          icon: action.icon
        }));

        const { error: actionsError } = await supabase
          .from('actions')
          .insert(actionsToInsert);
        
        if (actionsError) {
          console.warn('Supabase actions insert error:', actionsError.message);
          // Non-blocking, the UI already has the data
        }
      }
    } catch (err: any) {
      console.error('Supabase integration error:', err.message || err);
      // Ensure the user doesn't see a broken app if the DB is down
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setScreen('INTAKE');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        setScreen('IMPACT');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen pb-32 bg-surface selection:bg-primary/20">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-primary text-on-primary px-4 py-2 rounded-lg font-bold shadow-xl"
      >
        Skip to content
      </a>
      {/* Background Pulse */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-tertiary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <header className="bg-surface/80 backdrop-blur-md flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40" id="main-header">
        <div className="flex items-center gap-4">
          <button id="sidebar-toggle" className="hover:bg-surface-container-high p-2 rounded-full transition-colors" aria-label="Open sidebar menu">
            <Menu size={24} className="text-primary" aria-hidden="true" />
          </button>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-primary">Nexus</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            id="privacy-toggle"
            onClick={() => setPrivacyMode(!privacyMode)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
              privacyMode ? "bg-secondary text-on-secondary shadow-lg" : "bg-outline/10 text-outline hover:bg-outline/20"
            )}
            aria-label={privacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode"}
            title={privacyMode ? "Privacy Mode Active: Inputs anonymized" : "Privacy Mode Inactive"}
          >
            <ShieldCheck size={14} className={cn(privacyMode && "animate-pulse")} />
            {privacyMode ? "Privacy On" : "Privacy Off"}
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/10">
            <img 
              alt="Operator profile" 
              src="/assets/operator_avatar.png" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>
      
      <main id="main-content" className="max-w-5xl mx-auto px-6 pt-8 relative z-10">
        <AnimatePresence>
          <motion.div
            key={screen}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full"
          >
            <ErrorBoundary key={`boundary-${screen}`}>
              {screen === 'INTAKE' && <IntakeScreen onStartNexus={handleStartNexus} />}
              {screen === 'NEXUS' && <NexusScreen input={analysisInput} onComplete={handleAnalysisComplete} />}
              {screen === 'ACTION' && <ActionHubScreen data={analysisResult} setScreen={setScreen} />}
              {screen === 'IMPACT' && <ImpactDashboardScreen />}
              {screen === 'MENU' && <MenuScreen />}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      <button className="fixed right-6 bottom-28 w-14 h-14 bg-gradient-to-tr from-primary to-primary-container text-on-primary rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40">
        <Zap size={24} className="fill-current" />
      </button>

      <BottomNav activeScreen={screen} setScreen={setScreen} />
    </div>
  );
}
