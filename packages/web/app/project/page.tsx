'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useColor } from '@/lib/colorContext';

interface ProjectInfo {
  label: string;
  value: string;
}

export default function ProjectPage() {
  const router = useRouter();
  const { colorScheme } = useColor();
  const [showCursor, setShowCursor] = useState(true);
  const [glitchText, setGlitchText] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBlackScreen, setShowBlackScreen] = useState(false);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Random glitch effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        setGlitchText(true);
        setTimeout(() => setGlitchText(false), 100);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const projectInfo: ProjectInfo[] = [
    { label: 'PROJECT NAME', value: 'ezreport' },
    { label: 'VERSION', value: '1.0.0-alpha' },
    { label: 'AUTHOR', value: 'Unimatch Team' },
    { label: 'LICENSE', value: 'MIT' },
    { label: 'CREATED', value: '2024' },
    { label: 'STATUS', value: 'ACTIVE' },
    { label: 'LANGUAGE', value: 'TypeScript' },
    { label: 'FRAMEWORK', value: 'Next.js 14' },
    { label: 'STYLING', value: 'Tailwind CSS' },
    { label: 'AI INTEGRATION', value: 'OpenAI GPT-4' },
    { label: 'DATA SOURCE', value: 'Jira API' },
    { label: 'OUTPUT', value: 'Notion Pages' },
  ];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Backspace') {
      router.push('/menu');
    }
    if (e.key === 'Delete' && !isDeleting) {
      startFakeDelete();
    }
  }, [router, isDeleting]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const startFakeDelete = () => {
    setIsDeleting(true);
    setDeleteProgress(0);
    
    const interval = setInterval(() => {
      setDeleteProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDeleting(false);
          setShowBlackScreen(true);
          
          // After 10 seconds, start fading to home
          setTimeout(() => {
            setFadeToHome(true);
          }, 10000);
          
          // Navigate to home after fade completes (10s + 2s fade)
          setTimeout(() => {
            router.push('/');
          }, 12000);
          
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  return (
    <div className={`min-h-screen ${colorScheme.bg} flex flex-col`}>
      {/* Header */}
      <div className="border-b-2 border-double border-red-500 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="font-mono text-red-500">
            <span className="text-xl font-bold">⚠ DANGER ZONE</span>
          </div>
          <div className="font-mono text-sm text-red-500 opacity-70">
            force_delete_project.exe
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="w-full max-w-3xl mx-auto">
          {/* Warning Banner */}
          <div className={`border-2 border-red-500 bg-red-500/10 p-4 mb-8 ${glitchText ? 'animate-pulse' : ''}`}>
            <div className="font-mono text-red-500 text-center">
              <div className="text-2xl font-bold mb-2">
                ⚠ WARNING ⚠
              </div>
              <div className="text-sm opacity-80">
                This section contains critical project information.
                <br />
                Proceed with caution.
              </div>
            </div>
          </div>

          {/* Project Info Box */}
          <div className={`border-2 ${colorScheme.border} bg-black`}>
            {/* Title */}
            <div className={`${colorScheme.accent} text-black px-4 py-2 font-mono font-bold text-center whitespace-pre`}>
{`╔═════════════════════════════════════════╗
║          PROJECT INFORMATION            ║
╚═════════════════════════════════════════╝`}
            </div>

            {/* Info Grid */}
            <div className="p-6 space-y-1 font-mono">
              {projectInfo.map((info) => (
                <div 
                  key={info.label}
                  className={`flex border-b ${colorScheme.border}/20 py-2 ${
                    glitchText && Math.random() > 0.7 ? 'text-red-500' : colorScheme.primary
                  }`}
                >
                  <span className={`w-48 ${colorScheme.primary} opacity-70`}>{info.label}:</span>
                  <span className={`${colorScheme.secondary} font-bold`}>{info.value}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="p-6 pt-0">
              <div className={`border ${colorScheme.border}/30 ${colorScheme.accent}/5 p-4 font-mono text-sm ${colorScheme.primary} opacity-80`}>
                <div className={`mb-2 ${colorScheme.secondary} font-bold`}>DESCRIPTION:</div>
                <p>
                  ezreport is a tool for automatic sprint report generation. 
                  It collects data from Jira, analyzes it using AI, 
                  and creates beautiful reports in Notion.
                </p>
              </div>
            </div>
          </div>

          {/* Contributor Program Section */}
          <div className="border-2 border-cyan-500 bg-black mt-8">
            {/* Title */}
            <div className="bg-cyan-500 text-black px-4 py-2 font-mono font-bold text-center whitespace-pre">
{`╔═════════════════════════════════════════╗
║   🚀 CONTRIBUTOR PROGRAM @ UNIMATCH     ║
╚═════════════════════════════════════════╝`}
            </div>

            <div className="p-6 font-mono space-y-6">
              {/* How it works */}
              <div className="border border-cyan-500/30 bg-cyan-500/5 p-4">
                <div className="text-cyan-400 font-bold mb-3">HOW IT WORKS:</div>
                <div className="text-cyan-500/80 text-sm space-y-2">
                  <p>
                    We develop ezreport with contributors from Unimatch.
                    Want to level up your skills and earn? Welcome aboard!
                  </p>
                </div>
              </div>

              {/* Rules */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-cyan-400 font-bold">►</span>
                  <div>
                    <span className="text-cyan-400 font-bold">Flexible schedule</span>
                    <span className="text-cyan-500/70"> — work whenever you want, in your free time</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-cyan-400 font-bold">►</span>
                  <div>
                    <span className="text-cyan-400 font-bold">Toggl</span>
                    <span className="text-cyan-500/70"> — track your time in Toggl as usual</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-cyan-400 font-bold">►</span>
                  <div>
                    <span className="text-cyan-400 font-bold">Paid at your rate</span>
                    <span className="text-cyan-500/70"> — we pay your regular hourly rate for this work</span>
                  </div>
                </div>
              </div>

              {/* Hour Limit Warning */}
              <div className="border-2 border-yellow-500/50 bg-yellow-500/10 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <div className="text-yellow-400 font-bold">HOUR LIMIT</div>
                    <div className="text-yellow-500/70 text-sm">
                      Limit: <span className="text-yellow-400 font-bold">up to 4 hours per week</span> per person.
                      <br />
                      This is a side-project, main tasks are priority!
                    </div>
                  </div>
                </div>
              </div>

              {/* Survey CTA */}
              <div className="border border-purple-500/50 bg-purple-500/10 p-4 text-center">
                <div className="text-purple-400 font-bold mb-2">📋 SURVEY</div>
                <div className="text-purple-500/70 text-sm mb-4">
                  Interested in participating? Fill out a short survey so we know who&apos;s in.
                </div>
                <a 
                  href="https://forms.gle/PLACEHOLDER" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block border border-purple-500 px-6 py-2 text-purple-400 hover:bg-purple-500 hover:text-black transition-all"
                >
                  [ TAKE SURVEY ]
                </a>
              </div>
            </div>
          </div>

          {/* Brainstorm Section */}
          <div className="border-2 border-amber-500 bg-black mt-8">
            {/* Title */}
            <div className="bg-amber-500 text-black px-4 py-2 font-mono font-bold text-center whitespace-pre">
{`╔═════════════════════════════════════════╗
║            💡 BRAINSTORM                ║
╚═════════════════════════════════════════╝`}
            </div>

            <div className="p-6 font-mono space-y-4">
              <div className="text-amber-500/80 text-sm">
                Let&apos;s brainstorm together so I don&apos;t go off track alone!
                Share your ideas on what would be cool to add:
              </div>

              {/* Ideas list */}
              <div className="border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                <div className="text-amber-400 font-bold text-sm mb-3">CURRENT IDEAS:</div>
                <div className="text-amber-500/70 text-sm space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400">○</span>
                    <span>Slack integration for notifications</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400">○</span>
                    <span>Custom report templates</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400">○</span>
                    <span>Dashboard with metrics across all sprints</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400">○</span>
                    <span>Automatic retro notes generation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400">○</span>
                    <span>Export to PDF/Confluence</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 animate-pulse">_</span>
                    <span className="text-amber-500/50 italic">your idea here...</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <a 
                  href="https://notion.so/PLACEHOLDER" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block border border-amber-500 px-6 py-2 text-amber-400 hover:bg-amber-500 hover:text-black transition-all text-sm"
                >
                  [ ADD IDEA TO NOTION ]
                </a>
              </div>
            </div>
          </div>

          {/* Fake Delete Button */}
          {!showBlackScreen && (
            <div className="mt-8 text-center">
              <button
                onClick={startFakeDelete}
                disabled={isDeleting}
                className={`font-mono border-2 border-red-500 px-8 py-3 transition-all ${
                  isDeleting 
                    ? 'bg-red-500/20 text-red-400 cursor-not-allowed' 
                    : 'bg-transparent text-red-500 hover:bg-red-500 hover:text-black'
                }`}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">◌</span>
                    DELETING... {Math.min(100, Math.floor(deleteProgress))}%
                  </span>
                ) : (
                  '[ DELETE PROJECT ]'
                )}
              </button>

              {/* Progress Bar */}
              {isDeleting && (
                <div className="mt-4 max-w-md mx-auto">
                  <div className="border border-red-500 h-4 bg-black">
                    <div 
                      className="h-full bg-red-500 transition-all duration-200"
                      style={{ width: `${Math.min(100, deleteProgress)}%` }}
                    />
                  </div>
                  <div className="font-mono text-red-500/60 text-xs mt-2">
                    Removing all project files...
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Hint */}
          {!showBlackScreen && (
            <div className={`mt-8 text-center font-mono ${colorScheme.primary} opacity-40 text-sm`}>
              ESC or BACKSPACE to return to menu
              {!isDeleting && ' | DELETE to try deleting'}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={`border-t-2 border-double ${colorScheme.border} p-4`}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className={`font-mono text-sm ${colorScheme.primary} opacity-70`}>
            {showCursor ? '█' : ' '} Ready
          </div>
          <div className={`font-mono text-sm ${colorScheme.primary} opacity-70`}>
            Memory: 42KB free | Disk: ∞ available
          </div>
        </div>
      </div>

      {/* Black Screen Overlay */}
      {showBlackScreen && (
        <div 
          className={`fixed inset-0 bg-black z-50 transition-opacity duration-[2000ms] ${
            fadeToHome ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
    </div>
  );
}
