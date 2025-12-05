'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GenerateReportResponse } from '@/types/workflow';
import { generateReport } from '@/lib/apiClient';
import {
  ConsolePanel,
  ConsoleHeading,
  ConsoleButton,
  ConsoleInput,
} from '@/components/console';
import { useColor } from '@/lib/colorContext';

// =============================================================================
// Report Structure Definition
// =============================================================================

interface StructureItem {
  id: string;
  label: string;
  level: number;
}

const REPORT_STRUCTURE: StructureItem[] = [
  { id: 'meta', label: '0. META', level: 0 },
  { id: 'meta-project', label: 'projectName', level: 1 },
  { id: 'meta-version', label: 'version', level: 1 },
  { id: 'meta-sprint', label: 'sprint', level: 1 },
  { id: 'meta-next', label: 'nextSprint', level: 1 },

  { id: 'version', label: '1. VERSION BLOCK', level: 0 },
  { id: 'version-callout', label: 'Version Callout', level: 1 },

  { id: 'sprint', label: '2. SPRINT BLOCK', level: 0 },
  { id: 'sprint-callout', label: 'Sprint Callout', level: 1 },

  { id: 'result', label: '3. SPRINT RESULT SECTION', level: 0 },
  { id: 'result-timeline', label: '3.1 Sprint Timeline', level: 1 },
  { id: 'result-overview', label: '3.2 Sprint Overview', level: 1 },
  { id: 'result-achievements', label: '3.3 Achievements', level: 1 },
  { id: 'result-notdone', label: '3.4 Not Done', level: 1 },

  { id: 'artifacts', label: '4. ARTIFACTS SECTION', level: 0 },
  { id: 'artifacts-item', label: '4.1 Artifact Item (repeatable)', level: 1 },

  { id: 'next', label: '5. NEXT SPRINT SECTION', level: 0 },
  { id: 'next-goal', label: '5.1 Next Sprint Goal', level: 1 },
  { id: 'next-timeline', label: '5.2 Next Sprint Timeline', level: 1 },
  { id: 'next-blockers', label: '5.3 Blockers', level: 1 },

  { id: 'pm', label: '6. PM QUESTIONS SECTION', level: 0 },
  { id: 'pm-item', label: '6.1 Question Item (repeatable)', level: 1 },
];

// =============================================================================
// Main Page Component
// =============================================================================

export default function AnalysePage() {
  const { colorScheme } = useColor();
  const [response, setResponse] = useState<GenerateReportResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boardId, setBoardId] = useState('133');

  const handleGenerate = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const result = await generateReport({
        boardId: boardId.trim() || undefined,
      });
      setResponse(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Generate report failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const report = response?.report;

  return (
    <div className={`min-h-screen ${colorScheme.bg} p-4 md:p-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`mb-8 border-b ${colorScheme.border} pb-4`}>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/menu"
              className={`${colorScheme.primary} font-mono text-sm hover:${colorScheme.secondary} transition-colors`}
            >
              [HOME]
            </Link>
            <span className={`${colorScheme.primary} opacity-50`}>/</span>
            <Link
              href="/data"
              className={`${colorScheme.primary} font-mono text-sm hover:${colorScheme.secondary} transition-colors`}
            >
              Data
            </Link>
            <span className={`${colorScheme.primary} opacity-50`}>/</span>
            <span className={`${colorScheme.primary} font-mono text-sm`}>Analyse</span>
          </div>
          <ConsoleHeading level={1} className="mb-2">
            [ANALYSE] Генерация отчёта
          </ConsoleHeading>
          <p className={`${colorScheme.primary} font-mono text-sm opacity-80`}>
            Генерация полного отчёта по данным спринта
          </p>
        </div>

        {error && (
          <div className="mb-6 border border-red-500 bg-black p-4">
            <div className="text-red-500 font-mono text-sm">[ERROR] {error}</div>
          </div>
        )}

        {/* Controls */}
        <div className="mb-8 flex items-center gap-4">
          <ConsoleInput
            label="Board ID:"
            value={boardId}
            onChange={setBoardId}
            disabled={isRunning}
            placeholder="e.g., 133"
          />
          <ConsoleButton onClick={handleGenerate} disabled={isRunning}>
            {isRunning ? '[ GENERATING... ]' : '[GENERATE REPORT]'}
          </ConsoleButton>
          {response && (
            <span className={`${colorScheme.primary} opacity-70 font-mono text-sm`}>
              ✓ Отчёт сгенерирован
            </span>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Structure */}
          <ConsolePanel>
            <ConsoleHeading level={2} className="mb-4">
              [ 🧩 STRUCTURE (SKELETON) ]
            </ConsoleHeading>

            <div className="space-y-1">
              {REPORT_STRUCTURE.map((item) => (
                <div
                  key={item.id}
                  className={`font-mono text-sm ${
                    item.level === 0
                      ? `${colorScheme.secondary} font-bold mt-3 first:mt-0`
                      : `${colorScheme.primary} opacity-70 pl-4`
                  }`}
                >
                  {item.level === 1 && (
                    <span className={`${colorScheme.primary} opacity-40 mr-2`}>└─</span>
                  )}
                  {item.label}
                </div>
              ))}
            </div>
          </ConsolePanel>

          {/* Right: Preview */}
          <ConsolePanel>
            <ConsoleHeading level={2} className="mb-4">
              [ 📄 REPORT PREVIEW ]
            </ConsoleHeading>

            {!report ? (
              <div className={`${colorScheme.primary} opacity-50 font-mono text-sm`}>
                [ Нажмите GENERATE REPORT для генерации ]
              </div>
            ) : !report.sprint && !report.overview ? (
              <div className="border border-yellow-500/50 bg-yellow-500/5 p-4">
                <div className="text-yellow-500 font-mono text-sm mb-2">
                  ⚠️ Отчёт не сгенерирован
                </div>
                <div className="text-yellow-500/70 font-mono text-xs space-y-1">
                  <p>Возможные причины:</p>
                  <ul className="list-disc list-inside pl-2">
                    <li>Jira не настроен (проверьте .env файл)</li>
                    <li>Нет данных спринта для генерации</li>
                    <li>OpenAI не настроен</li>
                  </ul>
                  <p className="mt-2">Сначала выполните Data для сбора данных.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* Version Callout */}
                <div className={`border ${colorScheme.border}/50 p-3 ${colorScheme.accent}/5`}>
                  <div className={`${colorScheme.secondary} font-mono text-xs mb-1`}>
                    🚀 VERSION CALLOUT
                  </div>
                  <pre className={`font-mono text-xs ${colorScheme.primary} whitespace-pre-wrap`}>
                    {report.version ? `Version ${report.version.number} — ${report.version.goal}` : '—'}
                  </pre>
                </div>

                {/* Sprint Callout */}
                <div className={`border ${colorScheme.border}/50 p-3 ${colorScheme.accent}/5`}>
                  <div className={`${colorScheme.secondary} font-mono text-xs mb-1`}>
                    ✅ SPRINT CALLOUT
                  </div>
                  <pre className={`font-mono text-xs ${colorScheme.primary} whitespace-pre-wrap`}>
                    {report.sprint ? `Sprint ${report.sprint.number}: ${report.sprint.goal} (${report.sprint.progressPercent}%)` : '—'}
                  </pre>
                </div>

                {/* Overview */}
                <div className={`border ${colorScheme.border}/30 p-3`}>
                  <div className={`${colorScheme.secondary} font-mono text-xs mb-1`}>
                    3.2 OVERVIEW
                  </div>
                  <pre className={`font-mono text-xs ${colorScheme.primary} opacity-90 whitespace-pre-wrap`}>
                    {report.overview || '—'}
                  </pre>
                </div>

                {/* Achievements */}
                <div className={`border ${colorScheme.border}/30 p-3`}>
                  <div className={`${colorScheme.secondary} font-mono text-xs mb-1`}>
                    3.3 ACHIEVEMENTS
                  </div>
                  <pre className={`font-mono text-xs ${colorScheme.primary} opacity-90 whitespace-pre-wrap`}>
                    {report.achievements?.length > 0 
                      ? report.achievements.map(a => `• ${a.title}: ${a.description}`).join('\n')
                      : '—'}
                  </pre>
                </div>

                {/* Not Done */}
                <div className={`border ${colorScheme.border}/30 p-3`}>
                  <div className={`${colorScheme.secondary} font-mono text-xs mb-1`}>
                    3.4 NOT DONE
                  </div>
                  <pre className={`font-mono text-xs ${colorScheme.primary} opacity-90 whitespace-pre-wrap`}>
                    {report.notDone?.length > 0 
                      ? report.notDone.map(n => `• ${n.title}: ${n.reason}`).join('\n')
                      : 'Всё запланированное реализовано.'}
                  </pre>
                </div>

                {/* Artifacts */}
                <div className={`border ${colorScheme.border}/30 p-3`}>
                  <div className={`${colorScheme.secondary} font-mono text-xs mb-1`}>
                    4. ARTIFACTS
                  </div>
                  <pre className={`font-mono text-xs ${colorScheme.primary} opacity-90 whitespace-pre-wrap`}>
                    {report.artifacts?.length > 0 
                      ? report.artifacts.map(a => `• ${a.title}: ${a.description}`).join('\n')
                      : 'Нет артефактов.'}
                  </pre>
                </div>

                {/* Next Sprint */}
                <div className={`border ${colorScheme.border}/30 p-3`}>
                  <div className={`${colorScheme.secondary} font-mono text-xs mb-1`}>
                    5. NEXT SPRINT
                  </div>
                  <pre className={`font-mono text-xs ${colorScheme.primary} opacity-90 whitespace-pre-wrap`}>
                    {report.nextSprint ? `Sprint ${report.nextSprint.sprintNumber}: ${report.nextSprint.goal}` : '—'}
                  </pre>
                </div>

                {/* Blockers */}
                <div className={`border ${colorScheme.border}/30 p-3`}>
                  <div className={`${colorScheme.secondary} font-mono text-xs mb-1`}>
                    5.3 BLOCKERS
                  </div>
                  <pre className={`font-mono text-xs ${colorScheme.primary} opacity-90 whitespace-pre-wrap`}>
                    {report.blockers?.length > 0 
                      ? report.blockers.map(b => `• ${b.title}: ${b.description}`).join('\n')
                      : 'Нет'}
                  </pre>
                </div>

                {/* PM Questions */}
                <div className={`border ${colorScheme.border}/30 p-3`}>
                  <div className={`${colorScheme.secondary} font-mono text-xs mb-1`}>
                    6. PM QUESTIONS
                  </div>
                  <pre className={`font-mono text-xs ${colorScheme.primary} opacity-90 whitespace-pre-wrap`}>
                    {report.pmQuestions?.length > 0 
                      ? report.pmQuestions.map(q => `• ${q.title}: ${q.description}`).join('\n')
                      : 'Нет'}
                  </pre>
                </div>
              </div>
            )}
          </ConsolePanel>
        </div>

        {/* Navigation to Report */}
        <div className="mt-8 text-center">
          <Link
            href="/report"
            className={`inline-block border text-lg px-8 py-4 font-mono transition-colors ${
              report
                ? 'border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)]'
                : `${colorScheme.border}/50 ${colorScheme.primary} opacity-50 cursor-default`
            }`}
          >
            [NEXT] Перейти к финальному отчёту →
          </Link>
          {!report && (
            <div className={`${colorScheme.primary} opacity-40 font-mono text-xs mt-2`}>
              Сначала сгенерируйте отчёт
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
