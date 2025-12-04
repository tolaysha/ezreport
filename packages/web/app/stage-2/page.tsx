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

export default function Stage2Page() {
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
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-green-500 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/"
              className="text-green-500 font-mono text-sm hover:text-green-300 transition-colors"
            >
              [HOME]
            </Link>
            <span className="text-green-500/50">/</span>
            <Link
              href="/stage-1"
              className="text-green-500 font-mono text-sm hover:text-green-300 transition-colors"
            >
              Stage 1
            </Link>
            <span className="text-green-500/50">/</span>
            <span className="text-green-500 font-mono text-sm">Stage 2</span>
          </div>
          <ConsoleHeading level={1} className="mb-2">
            [STAGE 2] Генерация отчёта
          </ConsoleHeading>
          <p className="text-green-500 font-mono text-sm opacity-80">
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
            <span className="text-green-500/70 font-mono text-sm">
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
                      ? 'text-green-400 font-bold mt-3 first:mt-0'
                      : 'text-green-500/70 pl-4'
                  }`}
                >
                  {item.level === 1 && (
                    <span className="text-green-500/40 mr-2">└─</span>
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
              <div className="text-green-500/50 font-mono text-sm">
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
                  <p className="mt-2">Сначала выполните Stage 1 для сбора данных.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* Version Callout */}
                <div className="border border-green-500/50 p-3 bg-green-500/5">
                  <div className="text-green-400 font-mono text-xs mb-1">
                    🚀 VERSION CALLOUT
                  </div>
                  <pre className="font-mono text-xs text-green-500 whitespace-pre-wrap">
                    {report.version || '—'}
                  </pre>
                </div>

                {/* Sprint Callout */}
                <div className="border border-green-500/50 p-3 bg-green-500/5">
                  <div className="text-green-400 font-mono text-xs mb-1">
                    ✅ SPRINT CALLOUT
                  </div>
                  <pre className="font-mono text-xs text-green-500 whitespace-pre-wrap">
                    {report.sprint || '—'}
                  </pre>
                </div>

                {/* Overview */}
                <div className="border border-green-500/30 p-3">
                  <div className="text-green-400 font-mono text-xs mb-1">
                    3.2 OVERVIEW
                  </div>
                  <pre className="font-mono text-xs text-green-500/90 whitespace-pre-wrap">
                    {report.overview || '—'}
                  </pre>
                </div>

                {/* Achievements */}
                <div className="border border-green-500/30 p-3">
                  <div className="text-green-400 font-mono text-xs mb-1">
                    3.3 ACHIEVEMENTS
                  </div>
                  <pre className="font-mono text-xs text-green-500/90 whitespace-pre-wrap">
                    {report.achievements || '—'}
                  </pre>
                </div>

                {/* Not Done */}
                <div className="border border-green-500/30 p-3">
                  <div className="text-green-400 font-mono text-xs mb-1">
                    3.4 NOT DONE
                  </div>
                  <pre className="font-mono text-xs text-green-500/90 whitespace-pre-wrap">
                    {report.notDone || 'Всё запланированное реализовано.'}
                  </pre>
                </div>

                {/* Artifacts */}
                <div className="border border-green-500/30 p-3">
                  <div className="text-green-400 font-mono text-xs mb-1">
                    4. ARTIFACTS
                  </div>
                  <pre className="font-mono text-xs text-green-500/90 whitespace-pre-wrap">
                    {report.artifacts || 'Нет артефактов.'}
                  </pre>
                </div>

                {/* Next Sprint */}
                <div className="border border-green-500/30 p-3">
                  <div className="text-green-400 font-mono text-xs mb-1">
                    5. NEXT SPRINT
                  </div>
                  <pre className="font-mono text-xs text-green-500/90 whitespace-pre-wrap">
                    {report.nextSprint || '—'}
                  </pre>
                </div>

                {/* Blockers */}
                <div className="border border-green-500/30 p-3">
                  <div className="text-green-400 font-mono text-xs mb-1">
                    5.3 BLOCKERS
                  </div>
                  <pre className="font-mono text-xs text-green-500/90 whitespace-pre-wrap">
                    {report.blockers || 'Нет'}
                  </pre>
                </div>

                {/* PM Questions */}
                <div className="border border-green-500/30 p-3">
                  <div className="text-green-400 font-mono text-xs mb-1">
                    6. PM QUESTIONS
                  </div>
                  <pre className="font-mono text-xs text-green-500/90 whitespace-pre-wrap">
                    {report.pmQuestions || 'Нет'}
                  </pre>
                </div>
              </div>
            )}
          </ConsolePanel>
        </div>

        {/* Navigation to Stage 3 */}
        {report && (
          <div className="mt-8 text-center">
            <Link
              href="/stage-3"
              className="inline-block border border-green-500 text-green-500 px-6 py-3 font-mono hover:bg-green-500 hover:text-black transition-colors"
            >
              [NEXT] Перейти к Stage 3 — Финальная валидация →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
