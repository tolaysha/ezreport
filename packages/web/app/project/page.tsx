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
    { label: 'AUTHOR', value: 'tolik, Unimatch Team' },
    { label: 'LICENSE', value: 'MIT' },
    { label: 'CREATED', value: '2025' },
    { label: 'STATUS', value: 'ACTIVE' },
    { label: 'LANGUAGE', value: 'TypeScript' },
    { label: 'FRAMEWORK', value: 'Next.js 14' },
    { label: 'STYLING', value: 'Tailwind CSS' },
    { label: 'AI INTEGRATION', value: 'OpenAI GPT-5' },
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
          
          // After 10 seconds, navigate to home with black screen state
          setTimeout(() => {
            router.push('/?fromDelete=true');
          }, 10000);
          
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  return (
    <div className={`min-h-screen ${colorScheme.bg} flex flex-col`}>
      {/* Header */}
      <div className="border-b-2 border-double border-stone-600 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="font-mono text-stone-400">
            <span className="text-xl font-bold">PROJECT INFO</span>
          </div>
          <div className="font-mono text-sm text-stone-500">
            project_details.exe
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="w-full max-w-3xl mx-auto">
          {/* Info Banner */}
          <div className={`border border-stone-600 bg-stone-800/30 p-4 mb-8 ${glitchText ? 'animate-pulse' : ''}`}>
            <div className="font-mono text-stone-400 text-center">
              <div className="text-2xl font-bold mb-2">
                📋 PROJECT OVERVIEW
              </div>
              <div className="text-sm opacity-80">
                Technical details and contributor information.
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

          {/* What is EzReport - Pitch Section */}
          <div className="border border-fuchsia-700/60 bg-black mt-8">
            {/* Title */}
            <div className="bg-fuchsia-900/70 text-fuchsia-100 px-4 py-2 font-mono font-bold text-center whitespace-pre">
{`╔═════════════════════════════════════════╗
║            WHAT IS EZREPORT             ║
╚═════════════════════════════════════════╝`}
            </div>

            <div className="p-6 font-mono space-y-6">
              {/* Main Description */}
              <div className="border border-fuchsia-700/30 bg-fuchsia-900/20 p-4">
                <div className="text-fuchsia-400/90 font-bold mb-3">YOUR AI-POWERED SPRINT REPORTING ENGINE:</div>
                <div className="text-fuchsia-500/70 text-sm space-y-2">
                  <p>
                    EzReport is an intelligent automation platform for sprint reporting, 
                    built for product, engineering, and business teams that need to show 
                    project progress <span className="text-fuchsia-400/90 font-bold">quickly</span>, <span className="text-fuchsia-400/90 font-bold">clearly</span>, and <span className="text-fuchsia-400/90 font-bold">professionally</span> — without manual effort.
                  </p>
                </div>
              </div>

              {/* How EzReport Thinks */}
              <div className="border border-violet-700/30 bg-violet-900/20 p-4">
                <div className="text-violet-400/90 font-bold mb-3">🧠 HOW EZREPORT THINKS:</div>
                <div className="text-violet-500/70 text-sm mb-3">
                  Built-in AI models analyze Jira data the way a human PM would:
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 text-sm">
                    <span className="text-violet-500/80 font-bold">►</span>
                    <span className="text-violet-400/80">Identify key results</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <span className="text-violet-500/80 font-bold">►</span>
                    <span className="text-violet-400/80">Generate clear business insights</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <span className="text-violet-500/80 font-bold">►</span>
                    <span className="text-violet-400/80">Explain reasons behind delays and non-completed tasks</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <span className="text-violet-500/80 font-bold">►</span>
                    <span className="text-violet-400/80">Suggest the best demo-ready tasks for partners and stakeholders</span>
                  </div>
                </div>
                <div className="mt-4 text-violet-600/60 text-xs italic">
                  All output is written in a clean, concise executive business style with no technical jargon.
                </div>
              </div>

              {/* Who EzReport Is For */}
              <div className="border border-cyan-700/30 bg-cyan-900/20 p-4">
                <div className="text-cyan-400/90 font-bold mb-3">👥 WHO EZREPORT IS FOR:</div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <span className="text-cyan-500/80 font-bold">►</span>
                    <div>
                      <span className="text-cyan-400/90 font-bold">Product Teams</span>
                      <span className="text-cyan-600/60"> — produce consistent, high-quality reports for leadership.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <span className="text-cyan-500/80 font-bold">►</span>
                    <div>
                      <span className="text-cyan-400/90 font-bold">Outsourcing Teams</span>
                      <span className="text-cyan-600/60"> — clearly demonstrate progress to clients.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <span className="text-cyan-500/80 font-bold">►</span>
                    <div>
                      <span className="text-cyan-400/90 font-bold">Startups</span>
                      <span className="text-fuchsia-500/70 text-xs ml-2 px-1.5 py-0.5 border border-fuchsia-600/40 bg-fuchsia-900/30">we are here</span>
                      <span className="text-cyan-600/60"> — keep investors aligned with transparent updates.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <span className="text-cyan-500/80 font-bold">►</span>
                    <div>
                      <span className="text-cyan-400/90 font-bold">Enterprise</span>
                      <span className="text-cyan-600/60"> — unify reporting standards across multiple teams and departments.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Why It Matters */}
              <div className="border border-amber-700/40 bg-amber-900/20 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl opacity-70">⚡</span>
                  <div>
                    <div className="text-amber-500/80 font-bold">WHY IT MATTERS</div>
                    <div className="text-amber-600/60 text-sm">
                      EzReport saves <span className="text-amber-500/80 font-bold">hours of manual work</span>, 
                      removes subjectivity from reporting, and makes the entire process 
                      <span className="text-amber-500/80 font-bold"> fast, transparent, and effortless</span> for everyone involved.
                    </div>
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <div className="border border-fuchsia-700/40 bg-fuchsia-900/30 p-4 text-center">
                <div className="text-fuchsia-500/80 text-sm">
                  It&apos;s your personal <span className="text-fuchsia-300/90 font-bold">AI Product Manager</span> —
                  <span className="text-fuchsia-600/60"> turning the chaos of Jira into a clear, structured story of progress.</span>
                </div>
              </div>

              {/* Retro Vintage Slogan */}
              <div className="text-center py-6">
                {/* Decorative dots */}
                <div className="text-amber-600/40 text-xs tracking-[0.3em] mb-3">
                  ● ● ● ● ● ● ● ● ● ● ● ●
                </div>
                <div 
                  className="text-lg md:text-xl lg:text-2xl font-black uppercase"
                  style={{
                    fontFamily: 'Georgia, Times New Roman, serif',
                    color: '#f59e0b',
                    textShadow: '2px 2px 0 #92400e, 3px 3px 0 #78350f, 1px 1px 0 #fcd34d',
                    letterSpacing: '0.06em',
                    WebkitTextStroke: '0.5px #b45309',
                  }}
                >
                  Make Your Data Great Again
                </div>
                {/* Decorative line */}
                <div className="flex items-center justify-center gap-3 mt-3">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-600/50" />
                  <span className="text-amber-600/60 text-xs">★</span>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-600/50" />
                </div>
              </div>
            </div>
          </div>

          {/* Product Success Strategy Section */}
          <div className="border border-indigo-700/60 bg-black mt-8">
            {/* Title */}
            <div className="bg-indigo-900/70 text-indigo-100 px-4 py-2 font-mono font-bold text-center whitespace-pre">
{`╔═════════════════════════════════════════╗
║   🚀 PRODUCT SUCCESS STRATEGY           ║
╚═════════════════════════════════════════╝`}
            </div>

            <div className="p-6 font-mono space-y-6">
              {/* Key Insight */}
              <div className="border border-indigo-700/30 bg-indigo-900/20 p-4">
                <div className="text-indigo-400/90 font-bold mb-3">📊 KEY STRATEGIC INSIGHT:</div>
                <div className="text-indigo-500/70 text-sm">
                  <p>
                    Стратегия глобального роста требует <span className="text-indigo-400/90 font-bold">баланса между видением и фокусом</span>. 
                    Масштабирование без потери качества — основа устойчивого развития продукта.
                  </p>
                </div>
              </div>

              {/* Strategy Pillars */}
              <div className="border border-blue-700/30 bg-blue-900/20 p-4">
                <div className="text-blue-400/90 font-bold mb-4">🎯 STRATEGIC PILLARS:</div>
                <div className="space-y-4">
                  {/* Delivery Model */}
                  <div className="flex items-start gap-3 text-sm border-b border-blue-700/20 pb-3">
                    <span className="text-blue-500/80 font-bold text-lg">01</span>
                    <div>
                      <span className="text-blue-400/90 font-bold">Модель поставки</span>
                      <div className="text-blue-600/60 mt-1">
                        Основной упор на <span className="text-blue-400/80 font-bold">SaaS</span> — масштабируемость и предсказуемый revenue. 
                        Кастомные решения — только по необходимости для enterprise-клиентов.
                      </div>
                    </div>
                  </div>
                  {/* Segment Focus */}
                  <div className="flex items-start gap-3 text-sm border-b border-blue-700/20 pb-3">
                    <span className="text-blue-500/80 font-bold text-lg">02</span>
                    <div>
                      <span className="text-blue-400/90 font-bold">Фокус сегментов</span>
                      <div className="text-blue-600/60 mt-1 flex items-center flex-wrap gap-2">
                        <span className="px-2 py-0.5 bg-blue-800/40 border border-blue-600/40 text-blue-300/80">Стартапы</span>
                        <span className="text-blue-500/60">+</span>
                        <span className="px-2 py-0.5 bg-blue-800/40 border border-blue-600/40 text-blue-300/80">Агентства</span>
                        <span className="text-blue-500/60">→</span>
                        <span className="px-2 py-0.5 bg-indigo-800/40 border border-indigo-600/40 text-indigo-300/80">Enterprise</span>
                        <span className="text-blue-500/60">→</span>
                        <span className="px-2 py-0.5 bg-violet-800/40 border border-violet-600/40 text-violet-300/80">Gov</span>
                      </div>
                    </div>
                  </div>
                  {/* Integrations */}
                  <div className="flex items-start gap-3 text-sm border-b border-blue-700/20 pb-3">
                    <span className="text-blue-500/80 font-bold text-lg">03</span>
                    <div>
                      <span className="text-blue-400/90 font-bold">Интеграции</span>
                      <div className="text-blue-600/60 mt-1">
                        Сначала завершаем <span className="text-blue-400/80 font-bold">Jira</span> на 100%, 
                        затем расширяемся по спросу: Linear, Asana, ClickUp, Monday.
                      </div>
                    </div>
                  </div>
                  {/* Budget */}
                  <div className="flex items-start gap-3 text-sm">
                    <span className="text-blue-500/80 font-bold text-lg">04</span>
                    <div>
                      <span className="text-blue-400/90 font-bold">Бюджет первого года</span>
                      <div className="text-blue-600/60 mt-1">
                        Инвестиция в <span className="text-blue-400/80 font-bold">продукт</span>, а не в доход. 
                        Фокус на product-market fit и построение core value.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Growth Philosophy */}
              <div className="border border-sky-600/40 bg-gradient-to-br from-sky-900/25 to-indigo-900/20 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl opacity-70">🚀</span>
                  <div>
                    <div className="text-sky-400/90 font-bold mb-2">ФИЛОСОФИЯ РОСТА</div>
                    <div className="text-sky-500/70 text-sm leading-relaxed">
                      Развивайтесь <span className="text-sky-400/90 font-bold">постепенно</span>, удовлетворяя потребности первой группы пользователей. 
                      Используйте их <span className="text-sky-400/90 font-bold">отзывы как ориентир</span> для дальнейшего роста.
                    </div>
                    <div className="mt-3 pt-3 border-t border-sky-700/30">
                      <div className="text-sky-400/60 text-xs italic">
                        &quot;Так вы сможете уверенно двигаться к глобальному успеху продукта.&quot;
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Strategic Upgrade v1.2 Section */}
          <div className="border border-green-700/60 bg-black mt-8">
            {/* Title */}
            <div className="bg-green-900/70 text-green-100 px-4 py-2 font-mono font-bold text-center whitespace-pre">
{`╔═════════════════════════════════════════╗
║    💸 STRATEGIC UPGRADE: v1.2 PLAN      ║
╚═════════════════════════════════════════╝`}
            </div>

            <div className="p-6 font-mono space-y-6">
              {/* Proven Value */}
              <div className="border border-green-700/30 bg-green-900/20 p-4">
                <div className="text-green-400/90 font-bold mb-3">📈 PROVEN MARKET FIT:</div>
                <div className="text-green-500/70 text-sm space-y-2">
                  <p>
                    EzReport has <span className="text-green-400/90 font-bold">validated its core value proposition</span>: 
                    automating the tedious process of sprint reporting and transforming raw Jira data 
                    into <span className="text-green-400/90 font-bold">structured, investor-ready reports</span>.
                  </p>
                  <p className="text-green-600/60 mt-2">
                    The next milestone: scale the product for enterprise teams and unlock new revenue streams.
                  </p>
                </div>
              </div>

              {/* v1.2 Features */}
              <div className="border border-lime-700/30 bg-lime-900/20 p-4">
                <div className="text-lime-400/90 font-bold mb-3">🔧 WHAT&apos;S INCLUDED IN v1.2:</div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <span className="text-lime-500/80 font-bold">►</span>
                    <div>
                      <span className="text-lime-400/90 font-bold">Sprint Evaluation Validation</span>
                      <span className="text-lime-600/60"> — AI-powered sprint health checks and anomaly detection</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <span className="text-lime-500/80 font-bold">►</span>
                    <div>
                      <span className="text-lime-400/90 font-bold">Custom Input Fields</span>
                      <span className="text-lime-600/60"> — user-defined parameters for tailored report queries</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <span className="text-lime-500/80 font-bold">►</span>
                    <div>
                      <span className="text-lime-400/90 font-bold">Custom Report Templates</span>
                      <span className="text-lime-600/60"> — flexible report builder for diverse stakeholder needs</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <span className="text-lime-500/80 font-bold">►</span>
                    <div>
                      <span className="text-lime-400/90 font-bold">Alerting System</span>
                      <span className="text-lime-600/60"> — proactive warnings, error notifications, and deadline tracking</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <span className="text-lime-500/80 font-bold">►</span>
                    <div>
                      <span className="text-lime-400/90 font-bold">Artifact Viewer</span>
                      <span className="text-lime-600/60"> — display files, demos, and deliverables directly in reports</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Development Timeline */}
              <div className="border border-emerald-700/30 bg-emerald-900/20 p-4">
                <div className="text-emerald-400/90 font-bold mb-4">⏱️ DEVELOPMENT TIMELINE TO v1.2:</div>
                <div className="space-y-4">
                  {/* Milestone 1 */}
                  <div className="border-l-2 border-emerald-500/50 pl-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-emerald-400/90 font-bold">AI & Validation Layer</span>
                      <span className="text-emerald-500/70 text-sm">~3 weeks</span>
                    </div>
                    <div className="text-emerald-600/60 text-sm">
                      Sprint health checks, anomaly detection, improved prompt engineering
                    </div>
                  </div>
                  {/* Milestone 2 */}
                  <div className="border-l-2 border-lime-500/50 pl-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-lime-400/90 font-bold">Customization Engine</span>
                      <span className="text-lime-500/70 text-sm">~4 weeks</span>
                    </div>
                    <div className="text-lime-600/60 text-sm">
                      Custom input fields, flexible report templates, user-defined parameters
                    </div>
                  </div>
                  {/* Milestone 3 */}
                  <div className="border-l-2 border-teal-500/50 pl-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-teal-400/90 font-bold">Notifications & Media</span>
                      <span className="text-teal-500/70 text-sm">~3 weeks</span>
                    </div>
                    <div className="text-teal-600/60 text-sm">
                      Alerting system, artifact viewer, deadline tracking, demo attachments
                    </div>
                  </div>
                  {/* Total */}
                  <div className="border-t border-emerald-600/40 pt-3 mt-4 flex justify-between items-center">
                    <span className="text-emerald-300/90 font-bold">TOTAL TO v1.2</span>
                    <span className="text-emerald-300/90 font-bold text-lg">~10 weeks</span>
                  </div>
                </div>
              </div>

              {/* Investment Required */}
              <div className="border border-green-600/50 bg-gradient-to-br from-green-900/30 to-emerald-900/20 p-4">
                <div className="text-green-400/90 font-bold mb-4">💰 INVESTMENT TO v1.2:</div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-green-700/30 pb-2">
                    <span className="text-green-500/70">Development (10 weeks)</span>
                    <span className="text-green-400/90 font-bold">$20,000</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-green-700/30 pb-2">
                    <span className="text-green-500/70">AI API & Infrastructure</span>
                    <span className="text-green-400/90 font-bold">$3,000</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-green-700/30 pb-2">
                    <span className="text-green-500/70">Testing & QA</span>
                    <span className="text-green-400/90 font-bold">$2,000</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 mt-2 border-t border-green-600/40">
                    <span className="text-green-300/90 font-bold">Total to v1.2</span>
                    <div className="text-right">
                      <span className="text-green-300 font-bold text-xl">$25,000</span>
                    </div>
                  </div>
                  <div className="text-green-600/40 text-xs mt-4 italic text-center">
                    * Includes vision refinement, research & hypothesis testing
                  </div>
                </div>
              </div>

              {/* ROI Note */}
              <div className="border border-yellow-700/40 bg-yellow-900/15 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl opacity-70">📊</span>
                  <div>
                    <div className="text-yellow-500/80 font-bold">EXPECTED ROI</div>
                    <div className="text-yellow-600/60 text-sm">
                      v1.2 makes EzReport <span className="text-yellow-500/80 font-bold">usable for small teams</span> and 
                      <span className="text-yellow-500/80 font-bold"> paid pilots</span>. Custom reports, alerts, and artifacts 
                      enable first steps toward <span className="text-yellow-500/80 font-bold">monetization</span> and 
                      <span className="text-yellow-500/80 font-bold"> entry-level B2B use</span>.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contributor Program Section */}
          <div className="border border-teal-700/60 bg-black mt-8">
            {/* Title */}
            <div className="bg-teal-800/80 text-teal-100 px-4 py-2 font-mono font-bold text-center whitespace-pre">
{`╔═════════════════════════════════════════╗
║   🚀 CONTRIBUTOR PROGRAM @ UNIMATCH     ║
╚═════════════════════════════════════════╝`}
            </div>

            <div className="p-6 font-mono space-y-6">
              {/* How it works */}
              <div className="border border-teal-700/30 bg-teal-900/20 p-4">
                <div className="text-teal-400/90 font-bold mb-3">HOW IT WORKS:</div>
                <div className="text-teal-500/70 text-sm space-y-2">
                  <p>
                    We develop ezreport with contributors from Unimatch.
                    Want to level up your skills and earn? Welcome aboard!
                  </p>
                </div>
              </div>

              {/* Rules */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-teal-500/80 font-bold">►</span>
                  <div>
                    <span className="text-teal-400/90 font-bold">Vibe code friendly</span>
                    <span className="text-teal-600/60"> — use Cursor, Claude, GPT — AI-assisted development welcome!</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-teal-500/80 font-bold">►</span>
                  <div>
                    <span className="text-teal-400/90 font-bold">Flexible schedule</span>
                    <span className="text-teal-600/60"> — work whenever you want, in your free time</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-teal-500/80 font-bold">►</span>
                  <div>
                    <span className="text-teal-400/90 font-bold">Toggl</span>
                    <span className="text-teal-600/60"> — track your time in Toggl as usual</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-teal-500/80 font-bold">►</span>
                  <div>
                    <span className="text-teal-400/90 font-bold">Paid at your rate</span>
                    <span className="text-teal-600/60"> — we pay your regular hourly rate for this work</span>
                  </div>
                </div>
              </div>

              {/* Hour Limit Warning */}
              <div className="border border-amber-700/40 bg-amber-900/20 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl opacity-70">⚠️</span>
                  <div>
                    <div className="text-amber-500/80 font-bold">HOUR LIMIT</div>
                    <div className="text-amber-600/60 text-sm">
                      Limit: <span className="text-amber-500/80 font-bold">up to 4 hours per week</span> per person.
                      <br />
                      This is a side-project, main tasks are priority!
                    </div>
                  </div>
                </div>
              </div>

              {/* Survey CTA */}
              <div className="border border-violet-700/40 bg-violet-900/20 p-4 text-center">
                <div className="text-violet-400/80 font-bold mb-2">📋 SURVEY</div>
                <div className="text-violet-500/60 text-sm mb-4">
                  Interested in participating? Fill out a short survey so we know who&apos;s in.
                </div>
                <a 
                  href="https://forms.gle/PLACEHOLDER" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block border border-violet-600/50 px-6 py-2 text-violet-400/80 hover:bg-violet-800/50 hover:text-violet-200 transition-all"
                >
                  [ TAKE SURVEY ]
                </a>
              </div>
            </div>
          </div>

          {/* Brainstorm Section */}
          <div className="border border-orange-800/50 bg-black mt-8">
            {/* Title */}
            <div className="bg-orange-900/60 text-orange-200/90 px-4 py-2 font-mono font-bold text-center whitespace-pre">
{`╔═════════════════════════════════════════╗
║            💡 BRAINSTORM                ║
╚═════════════════════════════════════════╝`}
            </div>

            <div className="p-6 font-mono space-y-4">
              <div className="text-orange-500/60 text-sm">
                Let&apos;s brainstorm together so I don&apos;t go off track alone!
                Share your ideas on what would be cool to add:
              </div>

              {/* Ideas list */}
              <div className="border border-orange-800/30 bg-orange-900/15 p-4 space-y-2">
                <div className="text-orange-400/70 font-bold text-sm mb-3">CURRENT IDEAS:</div>
                <div className="text-orange-500/50 text-sm space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500/60">○</span>
                    <span>Slack integration for notifications</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500/60">○</span>
                    <span>Custom report templates</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500/60">○</span>
                    <span>Dashboard with metrics across all sprints</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500/60">○</span>
                    <span>Automatic retro notes generation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500/60">○</span>
                    <span>Export to PDF/Confluence</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500/50 animate-pulse">_</span>
                    <span className="text-orange-600/40 italic">your idea here...</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <a 
                  href="https://notion.so/PLACEHOLDER" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block border border-orange-700/50 px-6 py-2 text-orange-400/70 hover:bg-orange-900/50 hover:text-orange-200 transition-all text-sm"
                >
                  [ ADD IDEA TO NOTION ]
                </a>
              </div>
            </div>
          </div>

          {/* Getting Started Section */}
          <div className="border border-emerald-800/50 bg-black mt-8">
            {/* Title */}
            <div className="bg-emerald-900/60 text-emerald-200/90 px-4 py-2 font-mono font-bold text-center whitespace-pre">
{`╔═════════════════════════════════════════╗
║        🚀 HOW TO GET STARTED            ║
╚═════════════════════════════════════════╝`}
            </div>

            <div className="p-6 font-mono space-y-6">
              {/* Steps */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-emerald-500/70 font-bold min-w-[24px]">01.</span>
                  <div>
                    <span className="text-emerald-400/80 font-bold">Contact me</span>
                    <span className="text-emerald-600/50"> — reach out via </span>
                    <a href="https://t.me/centimeter19" target="_blank" rel="noopener noreferrer" className="text-emerald-400/80 hover:text-emerald-300 underline">Telegram @centimeter19</a>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-emerald-500/70 font-bold min-w-[24px]">02.</span>
                  <div>
                    <span className="text-emerald-400/80 font-bold">Setup integration</span>
                    <span className="text-emerald-600/50"> — I&apos;ll help you connect Jira and Notion</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-emerald-500/70 font-bold min-w-[24px]">03.</span>
                  <div>
                    <span className="text-emerald-400/80 font-bold">Payment</span>
                    <span className="text-emerald-600/50"> — complete payment to activate your account</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-emerald-500/70 font-bold min-w-[24px]">04.</span>
                  <div>
                    <span className="text-emerald-400/80 font-bold">Start generating</span>
                    <span className="text-emerald-600/50"> — enjoy automated sprint reports!</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border border-emerald-700/30 bg-emerald-900/20 p-4">
                <div className="text-emerald-400/80 font-bold mb-3">💳 PAYMENT OPTIONS:</div>
                <div className="text-emerald-500/60 text-sm space-y-3">
                  <p>I accept USDT (TRC-20) for payment.</p>
                  <div className="bg-black/50 p-3 border border-emerald-800/40">
                    <div className="text-emerald-500/50 text-xs mb-1">USDT Wallet (TRC-20):</div>
                    <div className="text-emerald-300/70 font-bold break-all select-all">
                      9TnKj2WsRm4xPqL7vBc5dFgH3jM8aYz6Qe
                    </div>
                  </div>
                  <p className="text-emerald-600/40 text-xs">
                    * After payment, send the transaction hash to my Telegram for verification.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fake Delete Button */}
          {!showBlackScreen && (
            <div className="mt-8 text-center">
              <button
                onClick={startFakeDelete}
                disabled={isDeleting}
                className={`font-mono border border-rose-800/50 px-8 py-3 transition-all ${
                  isDeleting 
                    ? 'bg-rose-900/30 text-rose-400/70 cursor-not-allowed' 
                    : 'bg-transparent text-rose-500/60 hover:bg-rose-900/40 hover:text-rose-300'
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
                  <div className="border border-rose-800/50 h-4 bg-black">
                    <div 
                      className="h-full bg-rose-700/60 transition-all duration-200"
                      style={{ width: `${Math.min(100, deleteProgress)}%` }}
                    />
                  </div>
                  <div className="font-mono text-rose-500/50 text-xs mt-2">
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
        <div className="fixed inset-0 bg-black z-50" />
      )}
    </div>
  );
}
