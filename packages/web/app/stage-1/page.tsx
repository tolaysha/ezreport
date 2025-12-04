'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  SprintReportParams,
  CollectDataResponse,
  GenerateReportResponse,
  SprintCardData,
  GoalMatchLevel,
  AlignmentLevel,
  VersionMeta,
  StrategicAnalysis,
  DemoRecommendation,
} from '@/types/workflow';
import { collectData, generateReport } from '@/lib/apiClient';
import {
  ConsolePanel,
  ConsoleHeading,
  ConsoleButton,
  ConsoleInput,
  BackendStatus,
} from '@/components/console';

// =============================================================================
// Version Card Component
// =============================================================================

interface VersionCardProps {
  version: VersionMeta | undefined;
}

function VersionCard({ version }: VersionCardProps) {
  if (!version) {
    return (
      <div className="border border-yellow-500/30 bg-black/50 p-4">
        <div className="text-yellow-500/70 font-mono text-sm mb-2">
          [ 🎯 АКТИВНАЯ ВЕРСИЯ ]
        </div>
        <div className="text-yellow-500/50 font-mono text-sm">
          ⚠️ Версия не определена
        </div>
        <div className="text-gray-500 font-mono text-xs mt-2">
          Укажите активную версию в Jira для отображения
        </div>
      </div>
    );
  }

  return (
    <div className="border border-cyan-500/50 bg-cyan-500/5 p-4">
      <div className="text-cyan-400 font-mono text-sm mb-2">
        [ 🎯 АКТИВНАЯ ВЕРСИЯ ]
      </div>
      <div className="text-cyan-500 font-mono text-xl font-bold mb-2">
        {version.name}
      </div>
      {version.description && (
        <div className="text-cyan-500/80 font-mono text-sm mb-3">
          <span className="text-cyan-500/50">Цель:</span> {version.description}
        </div>
      )}
      <div className="flex items-center gap-4 text-cyan-500/70 font-mono text-xs">
        {version.releaseDate && (
          <span>📅 Релиз: {version.releaseDate}</span>
        )}
        {version.progressPercent !== undefined && (
          <span>
            📊 Прогресс:{' '}
            <span className={getScoreColor(version.progressPercent)}>
              {version.progressPercent}%
            </span>
          </span>
        )}
        <span className={version.released ? 'text-green-400' : 'text-yellow-500'}>
          {version.released ? '✓ Выпущена' : '◐ В разработке'}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Analysis Panel Component
// =============================================================================

interface AnalysisPanelProps {
  analysis: StrategicAnalysis | undefined;
  versionGoal: string | undefined;
  sprintGoal: string | undefined;
}

function AnalysisPanel({ analysis, versionGoal, sprintGoal }: AnalysisPanelProps) {
  if (!analysis) {
    return (
      <div className="border border-gray-500/30 bg-black/50 p-4">
        <div className="text-gray-500/70 font-mono text-sm mb-2">
          [ 📊 СТРАТЕГИЧЕСКИЙ АНАЛИЗ ]
        </div>
        <div className="text-gray-500/50 font-mono text-sm">
          Анализ недоступен. Требуется активный спринт.
        </div>
      </div>
    );
  }

  const { versionSprintAlignment, sprintTasksAlignment, overallScore, summary } = analysis;

  return (
    <div className="border border-green-500/50 p-4 space-y-4 relative overflow-hidden">
      {/* AI Glow Animation Styles */}
      <style jsx>{`
        @keyframes aiGlow {
          0%, 100% { 
            text-shadow: 0 0 5px rgba(168, 85, 247, 0.5);
            opacity: 0.9;
          }
          50% { 
            text-shadow: 0 0 15px rgba(168, 85, 247, 0.8), 0 0 25px rgba(168, 85, 247, 0.4);
            opacity: 1;
          }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-mono text-sm">[ 📊 СТРАТЕГИЧЕСКИЙ АНАЛИЗ ]</span>
          <span className="text-purple-400/70 font-mono text-xs px-1 py-0.5 bg-purple-500/10 rounded">
            🤖
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-500/70 font-mono text-xs">Балл:</span>
          <span 
            className={`font-mono text-lg font-bold ${getScoreColor(overallScore)}`}
            style={{ animation: 'aiGlow 2s ease-in-out infinite' }}
          >
            {overallScore}
          </span>
          <span className="text-green-500/50 font-mono text-xs">
            / 100
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="border-l-2 border-green-500/30 pl-3">
        <div 
          className="text-purple-400/90 font-mono text-sm"
          style={{ animation: 'aiGlow 3s ease-in-out infinite' }}
        >
          {summary}
        </div>
      </div>

      {/* Version-Sprint Goals Alignment */}
      <div className="border border-green-500/30 p-3 space-y-3">
        <div className="text-green-500/70 font-mono text-xs">
          ЦЕЛЬ ВЕРСИИ → ЦЕЛЬ СПРИНТА
        </div>
        
        {/* Goals Display - REAL DATA (Green) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-cyan-500/5 border border-cyan-500/30 p-2 rounded">
            <div className="text-cyan-500/70 font-mono text-xs mb-1">🎯 Цель версии:</div>
            <div className="text-cyan-400 font-mono text-xs">
              {versionGoal || 'Не указана'}
            </div>
          </div>
          <div className="bg-green-500/5 border border-green-500/30 p-2 rounded">
            <div className="text-green-500/70 font-mono text-xs mb-1">🏃 Цель спринта:</div>
            <div className="text-green-400 font-mono text-xs">
              {sprintGoal || 'Не указана'}
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="pt-3 border-t border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-400/70 font-mono text-xs px-1 py-0.5 bg-purple-500/10 rounded">🤖</span>
            <span 
              className={`font-mono text-sm font-bold ${getAlignmentColor(versionSprintAlignment.level)}`}
              style={{ animation: 'aiGlow 2s ease-in-out infinite' }}
            >
              {getAlignmentLabel(versionSprintAlignment.level)}
            </span>
          </div>
          <div 
            className="text-purple-400/80 font-mono text-xs"
            style={{ animation: 'aiGlow 3s ease-in-out infinite' }}
          >
            {versionSprintAlignment.comment}
          </div>
        </div>
      </div>

      {/* Sprint-Tasks Alignment */}
      <div className="border border-green-500/30 p-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-green-500/70 font-mono text-xs">ЦЕЛЬ СПРИНТА → ЗАДАЧИ:</span>
          <span className="text-purple-400/70 font-mono text-xs px-1 py-0.5 bg-purple-500/10 rounded">🤖</span>
          <span 
            className={`font-mono text-sm font-bold ${getAlignmentColor(sprintTasksAlignment.level)}`}
            style={{ animation: 'aiGlow 2s ease-in-out infinite' }}
          >
            {getAlignmentLabel(sprintTasksAlignment.level)}
          </span>
          {sprintTasksAlignment.directlyRelatedPercent !== undefined && (
            <span className="text-purple-400/70 font-mono text-xs">
              ({sprintTasksAlignment.directlyRelatedPercent}%)
            </span>
          )}
        </div>
        <div 
          className="text-purple-400/80 font-mono text-xs"
          style={{ animation: 'aiGlow 3s ease-in-out infinite' }}
        >
          {sprintTasksAlignment.comment}
        </div>
      </div>

      {/* Demo Recommendations */}
      {analysis.demoRecommendations && analysis.demoRecommendations.length > 0 && (
        <div className="border border-green-500/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-500/70 font-mono text-xs">🎬 ДЕМО:</span>
            <span className="text-purple-400/70 font-mono text-xs px-1 py-0.5 bg-purple-500/10 rounded">🤖</span>
          </div>
          <div className="space-y-2">
            {analysis.demoRecommendations.map((rec, idx) => (
              <DemoRecommendationMini key={rec.issueKey || idx} recommendation={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Demo Recommendation Card Component
// =============================================================================

function getDemoFormatIcon(format: DemoRecommendation['suggestedFormat']): string {
  switch (format) {
    case 'video': return '🎥';
    case 'screenshot': return '📸';
    case 'live': return '🖥️';
    case 'slides': return '📊';
    default: return '📋';
  }
}

function getComplexityColor(complexity: number): string {
  if (complexity <= 2) return 'text-green-400';
  if (complexity <= 3) return 'text-yellow-500';
  return 'text-red-500';
}

interface DemoRecommendationCardProps {
  recommendation: DemoRecommendation;
}

function DemoRecommendationMini({ recommendation }: DemoRecommendationCardProps) {
  const { issueKey, summary, wowFactor, demoComplexity, suggestedFormat } = recommendation;
  
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className="text-green-500/70">{issueKey}</span>
      <span className="text-green-400 truncate flex-1">{summary}</span>
      <span className="text-purple-400/70 shrink-0" style={{ animation: 'aiGlow 3s ease-in-out infinite' }}>
        {getDemoFormatIcon(suggestedFormat)}
      </span>
      <span className={`shrink-0 ${getComplexityColor(demoComplexity)}`}>
        {demoComplexity}/5
      </span>
    </div>
  );
}

// =============================================================================
// Sprint Card Component
// =============================================================================

interface SprintCardProps {
  title: string;
  data: SprintCardData | undefined;
  variant: 'previous' | 'current';
}

function getGoalMatchColor(level: GoalMatchLevel): string {
  switch (level) {
    case 'strong':
      return 'text-green-400';
    case 'medium':
      return 'text-yellow-500';
    case 'weak':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

function getGoalMatchLabel(level: GoalMatchLevel): string {
  switch (level) {
    case 'strong':
      return 'Сильное';
    case 'medium':
      return 'Среднее';
    case 'weak':
      return 'Слабое';
    default:
      return 'Неизвестно';
  }
}

function getAlignmentColor(level: AlignmentLevel): string {
  switch (level) {
    case 'aligned':
      return 'text-green-400';
    case 'partial':
      return 'text-yellow-500';
    case 'misaligned':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

function getAlignmentLabel(level: AlignmentLevel): string {
  switch (level) {
    case 'aligned':
      return '✓ Согласовано';
    case 'partial':
      return '◐ Частично';
    case 'misaligned':
      return '✗ Рассогласовано';
    default:
      return '? Неизвестно';
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-400';
  if (score >= 40) return 'text-yellow-500';
  return 'text-red-500';
}

function getStatusColor(statusCategory: string): string {
  switch (statusCategory) {
    case 'done':
      return 'text-green-400';
    case 'indeterminate':
      return 'text-yellow-500';
    default:
      return 'text-gray-400';
  }
}

function SprintCard({ title, data, variant }: SprintCardProps) {
  const [showAllIssues, setShowAllIssues] = useState(false);

  if (!data) {
    return (
      <div className="border border-yellow-500/30 bg-black/50 p-4">
        <div className="text-yellow-500/70 font-mono text-sm mb-2">{title}</div>
        <div className="text-yellow-500/50 font-mono text-sm mb-2">
          ⚠️ Спринт не найден
        </div>
        <div className="text-gray-500 font-mono text-xs">
          {variant === 'previous' 
            ? 'Нет закрытых спринтов на доске' 
            : 'Нет активного спринта на доске'}
        </div>
      </div>
    );
  }

  const borderColor =
    variant === 'current' ? 'border-green-500' : 'border-green-500/50';
  const doneIssues = data.issues.filter((i) => i.statusCategory === 'done');
  const inProgressIssues = data.issues.filter(
    (i) => i.statusCategory === 'indeterminate',
  );
  const todoIssues = data.issues.filter((i) => i.statusCategory === 'new');

  const displayedIssues = showAllIssues ? data.issues : data.issues.slice(0, 5);

  return (
    <div className={`border ${borderColor} bg-black p-4`}>
      {/* Header */}
      <div className="mb-4 pb-2 border-b border-green-500/30">
        <div className="text-green-400 font-mono text-sm mb-1">{title}</div>
        <div className="text-green-500 font-mono text-lg font-bold">
          {data.sprint.name}
        </div>
        {data.sprint.startDate && data.sprint.endDate && (
          <div className="text-green-500/70 font-mono text-xs mt-1">
            {data.sprint.startDate} — {data.sprint.endDate}
          </div>
        )}
      </div>

      {/* Goal */}
      {data.sprint.goal && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-green-500/70 font-mono text-xs">ЦЕЛЬ:</span>
            {data.sprint.goalIsGenerated && (
              <span className="text-purple-400/80 font-mono text-xs px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded">
                🤖 AI
              </span>
            )}
          </div>
          <div className={`font-mono text-sm ${data.sprint.goalIsGenerated ? 'text-purple-400/90 italic' : 'text-green-500'}`}>
            {data.sprint.goal}
          </div>
        </div>
      )}

      {/* Goal Match Assessment - only show if sprint has a goal */}
      {data.goalMatchLevel !== 'unknown' && (
        <div className="mb-4 p-3 border border-green-500/30 bg-green-500/5">
          <div className="text-green-500/70 font-mono text-xs mb-1">
            СООТВЕТСТВИЕ ЗАДАЧ ЦЕЛИ:
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`font-mono text-sm font-bold ${getGoalMatchColor(data.goalMatchLevel)}`}
            >
              {getGoalMatchLabel(data.goalMatchLevel)}
            </span>
            <span className="text-green-500/50 font-mono text-xs">
              ({data.goalMatchLevel})
            </span>
          </div>
          <div className="text-green-500/80 font-mono text-xs">
            {data.goalMatchComment}
          </div>
        </div>
      )}

      {/* Issues Stats */}
      <div className="mb-4">
        <div className="text-green-500/70 font-mono text-xs mb-2">ЗАДАЧИ:</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="border border-green-500/30 p-2">
            <div className="text-green-400 font-mono text-lg font-bold">
              {doneIssues.length}
            </div>
            <div className="text-green-500/50 font-mono text-xs">Done</div>
          </div>
          <div className="border border-yellow-500/30 p-2">
            <div className="text-yellow-500 font-mono text-lg font-bold">
              {inProgressIssues.length}
            </div>
            <div className="text-yellow-500/50 font-mono text-xs">
              In Progress
            </div>
          </div>
          <div className="border border-gray-500/30 p-2">
            <div className="text-gray-400 font-mono text-lg font-bold">
              {todoIssues.length}
            </div>
            <div className="text-gray-500/50 font-mono text-xs">To Do</div>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="mb-4">
        <div className="text-green-500/70 font-mono text-xs mb-2">
          СПИСОК ЗАДАЧ ({data.issues.length}):
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {displayedIssues.map((issue) => (
            <div
              key={issue.key}
              className="flex items-start gap-2 text-xs font-mono"
            >
              <span className="text-green-500/70 shrink-0">{issue.key}</span>
              <span className={`shrink-0 ${getStatusColor(issue.statusCategory)}`}>
                [{issue.status}]
              </span>
              <span className="text-green-500/90 truncate">{issue.summary}</span>
              {issue.storyPoints && (
                <span className="text-green-500/50 shrink-0">
                  ({issue.storyPoints}sp)
                </span>
              )}
            </div>
          ))}
        </div>
        {data.issues.length > 5 && (
          <button
            onClick={() => setShowAllIssues(!showAllIssues)}
            className="mt-2 text-green-500/70 font-mono text-xs hover:text-green-400 transition-colors"
          >
            {showAllIssues
              ? '[Свернуть]'
              : `[Показать все ${data.issues.length} задач]`}
          </button>
        )}
      </div>

    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function Stage1Page() {
  const [collectResponse, setCollectResponse] = useState<CollectDataResponse | null>(null);
  const [reportResponse, setReportResponse] = useState<GenerateReportResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // Form state - only Board ID is required
  const [boardId, setBoardId] = useState('133');

  const buildParams = (): SprintReportParams => {
    return {
      boardId: boardId.trim() || undefined,
    };
  };

  const handleCollectData = async () => {
    const params = buildParams();
    if (!params.boardId) {
      setError('Board ID обязателен');
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const result = await collectData(params);
      setCollectResponse(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Collect data failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleGenerateReport = async () => {
    const params = buildParams();
    
    setIsRunning(true);
    setError(null);

    try {
      const result = await generateReport(params);
      setReportResponse(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Generate report failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const basicBoardData = collectResponse?.basicBoardData;

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
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
            <span className="text-green-500 font-mono text-sm">Stage 1</span>
          </div>
          <ConsoleHeading level={1} className="mb-2">
            [STAGE 1] Сбор данных и валидация
          </ConsoleHeading>
          <p className="text-green-500 font-mono text-sm opacity-80">
            Сбор данных о спринтах из Jira и оценка соответствия задач целям
          </p>
        </div>

        {error && (
          <div className="mb-6 border border-red-500 bg-black p-4">
            <div className="text-red-500 font-mono text-sm">[ERROR] {error}</div>
          </div>
        )}

        {/* Control Panel */}
        <ConsolePanel className="mb-8">
          <ConsoleHeading level={2} className="mb-4">
            [ ПАРАМЕТРЫ ]
          </ConsoleHeading>

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
              На основе Board ID будут получены текущий (активный) и прошедший
              (закрытый) спринты
            </div>
          </div>

          <ConsoleButton onClick={handleCollectData} disabled={isRunning}>
            [RUN] Collect Sprint Data
          </ConsoleButton>
        </ConsolePanel>

        {/* Results */}
        <ConsolePanel>
          <ConsoleHeading level={2} className="mb-4">
            [ РЕЗУЛЬТАТЫ ]
          </ConsoleHeading>

          {isRunning ? (
            <div className="py-8">
              <style jsx>{`
                @keyframes psychedelicText {
                  0% { color: #ff00ff; text-shadow: 0 0 10px #ff00ff; }
                  16% { color: #ff0080; text-shadow: 0 0 10px #ff0080; }
                  33% { color: #ff8000; text-shadow: 0 0 10px #ff8000; }
                  50% { color: #00ff00; text-shadow: 0 0 10px #00ff00; }
                  66% { color: #00ffff; text-shadow: 0 0 10px #00ffff; }
                  83% { color: #8000ff; text-shadow: 0 0 10px #8000ff; }
                  100% { color: #ff00ff; text-shadow: 0 0 10px #ff00ff; }
                }
                @keyframes pixelGlitch {
                  0%, 100% { transform: translate(0, 0); }
                  10% { transform: translate(-2px, 1px); }
                  20% { transform: translate(2px, -1px); }
                  30% { transform: translate(-1px, 2px); }
                  40% { transform: translate(1px, -2px); }
                  50% { transform: translate(-2px, -1px); }
                  60% { transform: translate(2px, 1px); }
                  70% { transform: translate(1px, 2px); }
                  80% { transform: translate(-1px, -2px); }
                  90% { transform: translate(2px, 2px); }
                }
              `}</style>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1">
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ 
                        animation: 'psychedelicText 0.5s infinite, bounce 0.6s infinite',
                        backgroundColor: 'currentColor'
                      }} 
                    />
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ 
                        animation: 'psychedelicText 0.5s infinite 0.1s, bounce 0.6s infinite 0.1s',
                        backgroundColor: 'currentColor'
                      }} 
                    />
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ 
                        animation: 'psychedelicText 0.5s infinite 0.2s, bounce 0.6s infinite 0.2s',
                        backgroundColor: 'currentColor'
                      }} 
                    />
                  </div>
                  <span 
                    className="font-mono text-sm font-bold"
                    style={{ 
                      animation: 'psychedelicText 0.8s infinite, pixelGlitch 0.3s infinite',
                    }}
                  >
                    ██ COLLECTING DATA ██
                  </span>
                </div>
                <div className="space-y-1 font-mono text-xs">
                  <div 
                    className="flex items-center gap-2"
                    style={{ animation: 'psychedelicText 1.2s infinite' }}
                  >
                    <span>▓▓▒▒░░</span>
                    <span>Fetching project info from Jira...</span>
                  </div>
                  <div 
                    className="flex items-center gap-2"
                    style={{ animation: 'psychedelicText 1.2s infinite 0.2s' }}
                  >
                    <span>▓▓▒▒░░</span>
                    <span>Loading sprints and issues...</span>
                  </div>
                  <div 
                    className="flex items-center gap-2"
                    style={{ animation: 'psychedelicText 1.2s infinite 0.4s' }}
                  >
                    <span>▓▓▒▒░░</span>
                    <span>Running AI analysis...</span>
                  </div>
                </div>
              </div>
            </div>
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
              {!basicBoardData.availability.hasPreviousSprint && 
               !basicBoardData.availability.hasCurrentSprint && (
                <div className="border border-yellow-500/50 bg-yellow-500/5 p-4">
                  <div className="text-yellow-500 font-mono text-sm mb-2">
                    ⚠️ Данные не загружены
                  </div>
                  <div className="text-yellow-500/70 font-mono text-xs space-y-1">
                    <p>Возможные причины:</p>
                    <ul className="list-disc list-inside pl-2">
                      <li>Jira не настроен (проверьте .env файл)</li>
                      <li>Неверный Board ID</li>
                      <li>Нет доступа к доске</li>
                      <li>На доске нет спринтов</li>
                    </ul>
                    <p className="mt-2">Включите Mock Mode для тестирования без Jira.</p>
                  </div>
                </div>
              )}

              {/* Version Card */}
              <VersionCard version={basicBoardData.activeVersion} />

              {/* Strategic Analysis Panel */}
              <AnalysisPanel 
                analysis={basicBoardData.analysis}
                versionGoal={basicBoardData.activeVersion?.description}
                sprintGoal={basicBoardData.currentSprint?.sprint.goal}
              />

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
                Доступность: Previous={' '}
                {basicBoardData.availability.hasPreviousSprint ? '✓' : '✗'},
                Current={' '}
                {basicBoardData.availability.hasCurrentSprint ? '✓' : '✗'}
              </div>

            </div>
          ) : (
            // Fallback if no basicBoardData
            <div className="space-y-6">
              {collectResponse?.sprint && (
                <div className="border border-green-500/50 p-4">
                  <div className="text-green-400 font-mono text-sm mb-2">
                    SPRINT INFO:
                  </div>
                  {collectResponse.sprint.name && (
                    <div className="font-mono text-sm text-green-500">
                      SPRINT: {collectResponse.sprint.name}
                    </div>
                  )}
                  {collectResponse.sprint.id && (
                    <div className="font-mono text-sm text-green-500">
                      ID: {collectResponse.sprint.id}
                    </div>
                  )}
                  {(collectResponse.sprint.startDate || collectResponse.sprint.endDate) && (
                    <div className="font-mono text-sm text-green-500">
                      DATES: {collectResponse.sprint.startDate || '?'} -{' '}
                      {collectResponse.sprint.endDate || '?'}
                    </div>
                  )}
                  {collectResponse.sprint.goal && (
                    <div className="font-mono text-sm text-green-500">
                      GOAL: {collectResponse.sprint.goal}
                    </div>
                  )}
                </div>
              )}

              {!collectResponse?.sprint && (
                <div className="font-mono text-sm text-gray-500">
                  [ No data available ]
                </div>
              )}
            </div>
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
        {basicBoardData && (basicBoardData.availability.hasPreviousSprint || basicBoardData.availability.hasCurrentSprint) && (
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
