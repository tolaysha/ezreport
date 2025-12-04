'use client';

import { useState } from 'react';
import Link from 'next/link';
import type {
  SprintReportParams,
  CollectDataResponse,
  GenerateReportResponse,
  StrategicAnalysis,
} from '@/types/workflow';
import { collectData, generateReport, analyzeData } from '@/lib/apiClient';
import {
  ConsolePanel,
  ConsoleHeading,
  ConsoleButton,
  ConsoleInput,
  BackendStatus,
} from '@/components/console';
import { SprintCard, VersionCard, AnalysisPanel } from '@/components/sprint';

// =============================================================================
// Loading Indicator
// =============================================================================

function LoadingIndicator() {
  return (
    <div className="py-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full animate-psychedelic" />
          <span className="w-1.5 h-1.5 rounded-full animate-psychedelic" style={{ animationDelay: '0.1s' }} />
          <span className="w-1.5 h-1.5 rounded-full animate-psychedelic" style={{ animationDelay: '0.2s' }} />
        </div>
        <span className="font-mono text-sm font-bold animate-psychedelic">
          ██ COLLECTING DATA ██
        </span>
      </div>
      <div className="space-y-1 font-mono text-xs">
        <div className="flex items-center gap-2 animate-psychedelic">
          <span>▓▓▒▒░░</span>
          <span>Fetching project info from Jira...</span>
        </div>
        <div className="flex items-center gap-2 animate-psychedelic" style={{ animationDelay: '0.2s' }}>
          <span>▓▓▒▒░░</span>
          <span>Loading sprints and issues...</span>
        </div>
        <div className="flex items-center gap-2 animate-psychedelic" style={{ animationDelay: '0.4s' }}>
          <span>▓▓▒▒░░</span>
          <span>Running AI analysis...</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// AI Analysis Trigger Panel
// =============================================================================

interface AnalysisTriggerPanelProps {
  isAnalyzing: boolean;
  hasCurrentSprint: boolean;
  onRunAnalysis: () => void;
}

function AnalysisTriggerPanel({ isAnalyzing, hasCurrentSprint, onRunAnalysis }: AnalysisTriggerPanelProps) {
  return (
    <div className="border border-purple-500/30 bg-purple-500/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-purple-400/70 font-mono text-sm">[ 📊 СТРАТЕГИЧЕСКИЙ АНАЛИЗ ]</span>
          <span className="text-purple-400/70 font-mono text-xs px-1 py-0.5 bg-purple-500/10 rounded">
            🤖 AI
          </span>
        </div>
      </div>
      {isAnalyzing ? (
        <div className="py-4">
          <div className="text-purple-400 font-mono text-sm animate-ai-pulse">
            🤖 Генерация AI анализа...
          </div>
        </div>
      ) : (
        <>
          <div className="text-purple-400/60 font-mono text-sm mb-4">
            Данные загружены. Запустите AI анализ для получения стратегической оценки.
          </div>
          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing || !hasCurrentSprint}
            className="border border-purple-500 text-purple-400 px-4 py-2 font-mono text-sm hover:bg-purple-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            [RUN] 🤖 Запустить AI Анализ
          </button>
        </>
      )}
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function Stage1Page() {
  const [collectResponse, setCollectResponse] = useState<CollectDataResponse | null>(null);
  const [reportResponse, setReportResponse] = useState<GenerateReportResponse | null>(null);
  const [analysisResult, setAnalysisResult] = useState<StrategicAnalysis | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [boardId, setBoardId] = useState('133');

  const buildParams = (): SprintReportParams => ({
    boardId: boardId.trim() || undefined,
  });

  const handleCollectData = async () => {
    const params = buildParams();
    if (!params.boardId) {
      setError('Board ID обязателен');
      return;
    }

    setIsRunning(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await collectData({ ...params, skipAnalysis: true });
      setCollectResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!collectResponse?.basicBoardData?.currentSprint) {
      setError('Нет данных для анализа. Сначала загрузите данные спринта.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeData({
        activeVersion: collectResponse.basicBoardData.activeVersion,
        currentSprint: collectResponse.basicBoardData.currentSprint,
        previousSprint: collectResponse.basicBoardData.previousSprint,
        mockMode: false,
      });
      if (result.analysis) {
        setAnalysisResult(result.analysis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const result = await generateReport(buildParams());
      setReportResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  const basicBoardData = collectResponse?.basicBoardData;
  const hasData = basicBoardData?.availability.hasPreviousSprint || basicBoardData?.availability.hasCurrentSprint;

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-green-500 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-green-500 font-mono text-sm hover:text-green-300 transition-colors">
              [HOME]
            </Link>
            <span className="text-green-500/50">/</span>
            <span className="text-green-500 font-mono text-sm">Stage 1</span>
          </div>
          <ConsoleHeading level={1} className="mb-2">
            [STAGE 1] Сбор данных и валидация
          </ConsoleHeading>
          <p className="text-green-500 font-mono text-sm opacity-80">
            Сбор данных о спринтах из Jira и оценка соответствия задач целям
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 border border-red-500 bg-black p-4">
            <div className="text-red-500 font-mono text-sm">[ERROR] {error}</div>
          </div>
        )}

        {/* Control Panel */}
        <ConsolePanel className="mb-8">
          <ConsoleHeading level={2} className="mb-4">[ ПАРАМЕТРЫ ]</ConsoleHeading>
          <BackendStatus />
          <div className="space-y-4 mb-6">
            <ConsoleInput
              label="Board ID:"
              value={boardId}
              onChange={setBoardId}
              disabled={isRunning}
              placeholder="e.g., 133"
            />
            <div className="text-green-500/60 font-mono text-xs">
              На основе Board ID будут получены текущий (активный) и прошедший (закрытый) спринты
            </div>
          </div>
          <ConsoleButton onClick={handleCollectData} disabled={isRunning}>
            [RUN] Collect Sprint Data
          </ConsoleButton>
        </ConsolePanel>

        {/* Results */}
        <ConsolePanel>
          <ConsoleHeading level={2} className="mb-4">[ РЕЗУЛЬТАТЫ ]</ConsoleHeading>

          {isRunning ? (
            <LoadingIndicator />
          ) : !collectResponse ? (
            <div className="text-green-500/50 font-mono text-sm">
              [ Нажмите "Collect Sprint Data" для загрузки данных ]
            </div>
          ) : basicBoardData ? (
            <div className="space-y-6">
              {/* Project Info */}
              {basicBoardData.projectName && (
                <div className="flex items-center gap-3 pb-3 border-b border-green-500/30">
                  <span className="text-green-400 font-mono text-lg font-bold">
                    {basicBoardData.projectName}
                  </span>
                  {basicBoardData.projectKey && (
                    <span className="text-green-500/50 font-mono text-sm">
                      ({basicBoardData.projectKey})
                    </span>
                  )}
                </div>
              )}

              {/* No data warning */}
              {!hasData && (
                <div className="border border-yellow-500/50 bg-yellow-500/5 p-4">
                  <div className="text-yellow-500 font-mono text-sm mb-2">⚠️ Данные не загружены</div>
                  <div className="text-yellow-500/70 font-mono text-xs space-y-1">
                    <p>Возможные причины:</p>
                    <ul className="list-disc list-inside pl-2">
                      <li>Jira не настроен (проверьте .env файл)</li>
                      <li>Неверный Board ID</li>
                      <li>Нет доступа к доске</li>
                      <li>На доске нет спринтов</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Version Card */}
              <VersionCard version={basicBoardData.activeVersion} />

              {/* Strategic Analysis Panel */}
              {analysisResult ? (
                <AnalysisPanel 
                  analysis={analysisResult}
                  versionGoal={basicBoardData.activeVersion?.description}
                  sprintGoal={basicBoardData.currentSprint?.sprint.goal}
                />
              ) : (
                <AnalysisTriggerPanel
                  isAnalyzing={isAnalyzing}
                  hasCurrentSprint={!!basicBoardData.currentSprint}
                  onRunAnalysis={handleRunAnalysis}
                />
              )}

              {/* Two Sprint Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SprintCard
                  title="[ ПРОШЕДШИЙ СПРИНТ ]"
                  data={basicBoardData.previousSprint}
                  variant="previous"
                />
                <SprintCard
                  title="[ ТЕКУЩИЙ СПРИНТ ]"
                  data={basicBoardData.currentSprint}
                  variant="current"
                />
              </div>

              {/* Availability Info */}
              <div className="text-green-500/50 font-mono text-xs">
                Доступность: Previous={basicBoardData.availability.hasPreviousSprint ? '✓' : '✗'},
                Current={basicBoardData.availability.hasCurrentSprint ? '✓' : '✗'}
              </div>
            </div>
          ) : (
            <div className="font-mono text-sm text-gray-500">[ No data available ]</div>
          )}

          {/* Raw JSON Toggle */}
          <div className="mt-6 pt-4 border-t border-green-500/30">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-green-500 font-mono text-sm hover:text-green-300 transition-colors"
            >
              [Toggle Raw JSON]
            </button>
            {showRawJson && (collectResponse || reportResponse) && (
              <div className="mt-4 border border-green-500/50 p-4 overflow-auto max-h-96">
                <pre className="font-mono text-xs text-green-500">
                  {JSON.stringify({ collectResponse, reportResponse }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </ConsolePanel>

        {/* Generate Report Button */}
        {hasData && (
          <div className="mt-8">
            <button
              onClick={handleGenerateReport}
              disabled={isRunning}
              className="w-full border-2 border-cyan-500 text-cyan-500 px-6 py-4 font-mono text-lg hover:bg-cyan-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)]"
            >
              {isRunning ? '[ ГЕНЕРАЦИЯ... ]' : '[ СГЕНЕРИРОВАТЬ ОТЧЁТ ]'}
            </button>
            <div className="text-cyan-500/60 font-mono text-xs text-center mt-2">
              Данные из Jira + промпт + шаблон → итоговый отчёт
            </div>
          </div>
        )}

        {/* Navigation to Stage 2 */}
        {reportResponse?.report && (
          <div className="mt-8 text-center">
            <Link
              href="/stage-2"
              className="inline-block border border-green-500 text-green-500 px-6 py-3 font-mono hover:bg-green-500 hover:text-black transition-colors"
            >
              [NEXT] Перейти к Stage 2 — Просмотр отчёта →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
