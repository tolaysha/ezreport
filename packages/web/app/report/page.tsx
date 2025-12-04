'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ConsoleHeading,
  Breadcrumb,
} from '@/components/console';
import { generatePartnerReport } from '@/lib/apiClient';

const TEMPLATE_SECTIONS = [
  { icon: '🚀', label: 'version info' },
  { icon: '✅', label: 'sprint status' },
  { icon: '📊', label: 'overview' },
  { icon: '🏆', label: 'achievements' },
  { icon: '📦', label: 'artifacts' },
  { icon: '🎯', label: 'next sprint' },
  { icon: '⚠️', label: 'blockers' },
  { icon: '❓', label: 'pm questions' },
];

// Section icons mapping
const SECTION_ICONS: Record<string, string> = {
  'версия': '🚀',
  'version': '🚀',
  'спринт': '✅',
  'sprint': '✅',
  'overview': '📊',
  'обзор': '📊',
  'достижен': '🏆',
  'achievement': '🏆',
  'ключев': '🏆',
  'артефакт': '📦',
  'artifact': '📦',
  'демо': '📦',
  'demo': '📦',
  'план': '🎯',
  'next': '🎯',
  'следующ': '🎯',
  'блокер': '⚠️',
  'blocker': '⚠️',
  'вопрос': '❓',
  'question': '❓',
  'pm': '❓',
  'не сделан': '📋',
  'not done': '📋',
};

function getSectionIcon(title: string): string {
  const lower = title.toLowerCase();
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '📄';
}

interface ReportSection {
  title: string;
  content: string;
  icon: string;
}

function parseReportSections(markdown: string): ReportSection[] {
  const lines = markdown.split('\n');
  const sections: ReportSection[] = [];
  let currentSection: ReportSection | null = null;
  let contentLines: string[] = [];

  for (const line of lines) {
    // Match ## headers (main sections)
    const h2Match = line.match(/^##\s+\**(.+?)\**\s*$/);
    if (h2Match) {
      // Save previous section
      if (currentSection) {
        currentSection.content = contentLines.join('\n').trim();
        if (currentSection.content || currentSection.title) {
          sections.push(currentSection);
        }
      }
      const title = h2Match[1].replace(/\*+/g, '').trim();
      currentSection = {
        title,
        content: '',
        icon: getSectionIcon(title),
      };
      contentLines = [];
      continue;
    }

    // Skip the main # header and --- separators
    if (line.match(/^#\s+/) || line.match(/^---\s*$/)) {
      continue;
    }

    if (currentSection) {
      contentLines.push(line);
    }
  }

  // Don't forget the last section
  if (currentSection) {
    currentSection.content = contentLines.join('\n').trim();
    if (currentSection.content || currentSection.title) {
      sections.push(currentSection);
    }
  }

  return sections;
}

function formatContent(content: string): React.ReactNode {
  const lines = content.split('\n');
  
  return lines.map((line, idx) => {
    // Bold text
    const boldMatch = line.match(/\*\*(.+?)\*\*/g);
    let formattedLine: React.ReactNode = line;
    
    if (boldMatch) {
      const parts = line.split(/(\*\*.+?\*\*)/);
      formattedLine = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-green-400">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    }

    // List items
    if (line.trim().startsWith('- ')) {
      return (
        <div key={idx} className="flex gap-2 my-1">
          <span className="text-green-600">→</span>
          <span>{typeof formattedLine === 'string' ? formattedLine.slice(2) : formattedLine}</span>
        </div>
      );
    }

    // Links
    const linkMatch = line.match(/\[(.+?)\]\((.+?)\)/);
    if (linkMatch) {
      const [, text, url] = linkMatch;
      return (
        <div key={idx} className="my-1">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
          >
            {text}
          </a>
        </div>
      );
    }

    // Empty lines
    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }

    return <div key={idx} className="my-1">{formattedLine}</div>;
  });
}

function StyledReport({ markdown }: { markdown: string }) {
  const sections = useMemo(() => parseReportSections(markdown), [markdown]);

  // Extract main title from markdown
  const titleMatch = markdown.match(/^#\s+(.+?)$/m);
  const mainTitle = titleMatch ? titleMatch[1].replace(/[✅🚀📊🏆📦🎯⚠️❓]/g, '').trim() : 'Отчёт';

  return (
    <div className="mb-12 space-y-4">
      {/* Report Header */}
      <div className="border border-green-500/30 bg-gradient-to-b from-green-950/30 to-transparent rounded-lg p-6 backdrop-blur">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">✅</span>
          <h2 className="text-xl font-bold text-green-400 font-mono">{mainTitle}</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-500/50 font-mono">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>сгенерировано</span>
          <span>•</span>
          <span>{new Date().toLocaleDateString('ru-RU')}</span>
        </div>
      </div>

      {/* Report Sections */}
      <div className="grid gap-4">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="border border-green-500/20 bg-gradient-to-br from-green-950/20 via-black to-transparent rounded-lg overflow-hidden transition-all hover:border-green-500/40"
          >
            {/* Section Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-green-500/5 border-b border-green-500/10">
              <span className="text-lg">{section.icon}</span>
              <h3 className="text-sm font-semibold text-green-400 font-mono uppercase tracking-wide">
                {section.title}
              </h3>
            </div>
            
            {/* Section Content */}
            <div className="px-4 py-4 font-mono text-sm text-green-500/80 leading-relaxed">
              {section.content ? formatContent(section.content) : (
                <span className="text-green-500/40 italic">Нет данных</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Copy Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() => {
            navigator.clipboard.writeText(markdown);
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono text-green-500/60 border border-green-500/20 rounded hover:border-green-500/40 hover:text-green-500/80 hover:bg-green-500/5 transition-all"
        >
          <span>📋</span>
          <span>копировать markdown</span>
        </button>
      </div>
    </div>
  );
}

export default function ReportPage() {
  const [report, setReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collectedData, setCollectedData] = useState<unknown>(null);

  // Load collected data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('ezreport_collected_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setCollectedData(parsed);
      } catch (e) {
        console.error('Failed to parse saved data:', e);
        setError('Не удалось загрузить сохранённые данные.');
      }
    }
  }, []);

  const handleGenerateReport = async () => {
    if (!collectedData) {
      setError('Нет данных для генерации отчёта. Сначала выполните сбор данных.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await generatePartnerReport(collectedData);
      setReport(response.report);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Report generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb items={[{ label: 'data', href: '/data' }, { label: 'report' }]} />
          <ConsoleHeading level={1}>
            Partner Sync Report
          </ConsoleHeading>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 border border-red-500 bg-black p-4">
            <div className="text-red-500 font-mono text-sm">[ERROR] {error}</div>
          </div>
        )}

        {/* Template Preview or Generated Report */}
        {report ? (
          <StyledReport markdown={report} />
        ) : (
          <div className="mb-12">
            {/* Compact Template Preview */}
            <div className="border border-green-500/20 bg-gradient-to-b from-green-950/20 to-transparent rounded-lg p-4 backdrop-blur">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-500/10">
                <span className="text-green-500/60 text-xs font-mono">template.md</span>
                <div className="flex-1" />
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500/30" />
                  <span className="w-2 h-2 rounded-full bg-green-500/20" />
                  <span className="w-2 h-2 rounded-full bg-green-500/10" />
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {TEMPLATE_SECTIONS.map((section, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center p-3 rounded bg-green-500/5 border border-green-500/10 hover:border-green-500/30 hover:bg-green-500/10 transition-all cursor-default group"
                  >
                    <span className="text-lg mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      {section.icon}
                    </span>
                    <span className="text-[10px] font-mono text-green-500/50 group-hover:text-green-500/80 transition-colors text-center leading-tight">
                      {section.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Make EzReport Button */}
        <div className="text-center py-8">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="text-4xl md:text-6xl font-bold tracking-tight cursor-pointer transition-all duration-300 hover:scale-105 disabled:cursor-wait group"
          >
            <span className="text-zinc-600 group-hover:text-zinc-500 transition-colors">make </span>
            {isGenerating ? (
              <>
                <span className="text-purple-500 animate-pulse">ez</span>
                <span className="text-purple-400 animate-pulse">report</span>
              </>
            ) : (
              <>
                <span className="text-green-800 group-hover:text-green-600 transition-colors">ez</span>
                <span className="text-zinc-700 group-hover:text-zinc-500 transition-colors">report</span>
              </>
            )}
          </button>
          {isGenerating && (
            <p className="mt-4 text-purple-400 font-mono text-sm animate-pulse">
              generating...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
