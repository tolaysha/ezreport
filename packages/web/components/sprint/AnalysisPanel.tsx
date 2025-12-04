'use client';

import type { StrategicAnalysis, DemoRecommendation, SprintCardData } from '@/types/workflow';
import { getAlignmentColor, getAlignmentLabel, getScoreColor, getDemoFormatIcon, getComplexityColor } from './helpers';

// =============================================================================
// Demo Recommendation Mini
// =============================================================================

function DemoRecommendationMini({ recommendation }: { recommendation: DemoRecommendation }) {
  const { issueKey, summary, demoComplexity, suggestedFormat } = recommendation;
  
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className="text-green-500/70">{issueKey}</span>
      <span className="text-green-400 truncate flex-1">{summary}</span>
      <span className="text-purple-400/70 shrink-0 animate-ai-glow">
        {getDemoFormatIcon(suggestedFormat)}
      </span>
      <span className={`shrink-0 ${getComplexityColor(demoComplexity)}`}>
        {demoComplexity}/5
      </span>
    </div>
  );
}

// =============================================================================
// Sprint Statistics Panel
// =============================================================================

interface SprintStatsProps {
  currentSprint: SprintCardData | undefined;
  previousSprint: SprintCardData | undefined;
}

function SprintStatsPanel({ currentSprint, previousSprint }: SprintStatsProps) {
  if (!currentSprint) return null;

  const issues = currentSprint.issues;
  const doneIssues = issues.filter(i => i.statusCategory === 'done');
  const inProgressIssues = issues.filter(i => i.statusCategory === 'indeterminate');
  
  // Подсчет story points
  const totalStoryPoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const completedStoryPoints = doneIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const inProgressStoryPoints = inProgressIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  
  // Completion rate
  const completionRate = issues.length > 0 ? Math.round((doneIssues.length / issues.length) * 100) : 0;
  
  // Team size (unique assignees)
  const uniqueAssignees = new Set(issues.map(i => i.assignee).filter(Boolean));
  const teamSize = uniqueAssignees.size;
  
  // Issues with artifacts (demo-ready)
  const artifactIssues = issues.filter(i => i.artifact);
  
  // Velocity comparison with previous sprint
  const prevCompletedSP = previousSprint?.issues
    .filter(i => i.statusCategory === 'done')
    .reduce((sum, i) => sum + (i.storyPoints || 0), 0) || 0;
  
  const velocityChange = prevCompletedSP > 0 
    ? Math.round(((completedStoryPoints - prevCompletedSP) / prevCompletedSP) * 100)
    : null;

  return (
    <div className="border border-cyan-500/40 bg-cyan-500/5 p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-cyan-400 font-mono text-sm">📊 КЛЮЧЕВЫЕ МЕТРИКИ СПРИНТА</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Story Points Done */}
        <div className="border border-cyan-500/30 bg-black/40 p-3 text-center">
          <div className="text-cyan-400 font-mono text-2xl font-bold">
            {completedStoryPoints}
            <span className="text-cyan-400/50 text-sm">/{totalStoryPoints}</span>
          </div>
          <div className="text-cyan-500/70 font-mono text-xs mt-1">Story Points</div>
        </div>
        
        {/* Completion Rate */}
        <div className="border border-green-500/30 bg-black/40 p-3 text-center">
          <div className={`font-mono text-2xl font-bold ${
            completionRate >= 70 ? 'text-green-400' : 
            completionRate >= 40 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {completionRate}%
          </div>
          <div className="text-green-500/70 font-mono text-xs mt-1">Выполнено</div>
        </div>
        
        {/* Team Size */}
        <div className="border border-purple-500/30 bg-black/40 p-3 text-center">
          <div className="text-purple-400 font-mono text-2xl font-bold">
            {teamSize}
          </div>
          <div className="text-purple-500/70 font-mono text-xs mt-1">Участников</div>
        </div>
        
        {/* Velocity Change */}
        <div className="border border-orange-500/30 bg-black/40 p-3 text-center">
          <div className={`font-mono text-2xl font-bold ${
            velocityChange === null ? 'text-gray-400' :
            velocityChange >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {velocityChange !== null ? (
              <>
                {velocityChange >= 0 ? '+' : ''}{velocityChange}%
              </>
            ) : (
              '—'
            )}
          </div>
          <div className="text-orange-500/70 font-mono text-xs mt-1">vs Прошлый</div>
        </div>
      </div>

      {/* Additional metrics row */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        {/* In Progress SP */}
        <div className="border border-yellow-500/20 bg-black/30 p-2 text-center">
          <div className="text-yellow-400 font-mono text-lg font-bold">
            {inProgressStoryPoints} SP
          </div>
          <div className="text-yellow-500/60 font-mono text-xs">В работе</div>
        </div>
        
        {/* Tasks total */}
        <div className="border border-green-500/20 bg-black/30 p-2 text-center">
          <div className="text-green-400 font-mono text-lg font-bold">
            {doneIssues.length}/{issues.length}
          </div>
          <div className="text-green-500/60 font-mono text-xs">Задач готово</div>
        </div>
        
        {/* Demo-ready */}
        <div className="border border-pink-500/20 bg-black/30 p-2 text-center">
          <div className="text-pink-400 font-mono text-lg font-bold">
            {artifactIssues.length}
          </div>
          <div className="text-pink-500/60 font-mono text-xs">С артефактами</div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Analysis Panel
// =============================================================================

interface AnalysisPanelProps {
  analysis: StrategicAnalysis | undefined;
  versionGoal: string | undefined;
  sprintGoal: string | undefined;
  currentSprint?: SprintCardData;
  previousSprint?: SprintCardData;
}

export function AnalysisPanel({ analysis, versionGoal, sprintGoal, currentSprint, previousSprint }: AnalysisPanelProps) {
  if (!analysis) {
    return (
      <div className="border border-gray-500/30 bg-black/50 p-4">
        <div className="text-gray-500/70 font-mono text-sm mb-2">
          СТРАТЕГИЧЕСКИЙ АНАЛИЗ
        </div>
        <div className="text-gray-500/50 font-mono text-sm">
          Анализ недоступен. Требуется активный спринт.
        </div>
      </div>
    );
  }

  const { versionSprintAlignment, sprintTasksAlignment, overallScore, summary } = analysis;
  
  // Limit demo recommendations to 3
  const limitedDemoRecommendations = analysis.demoRecommendations?.slice(0, 3);

  return (
    <div className="border border-green-500/50 p-4 space-y-4 relative overflow-hidden">
      {/* Header with Score */}
      <div className="flex items-center justify-between">
        <span className="text-green-400 font-mono text-sm">СТРАТЕГИЧЕСКИЙ АНАЛИЗ</span>
        <div className="flex items-center gap-2">
          <span className="text-green-500/70 font-mono text-xs">Балл:</span>
          <span className={`font-mono text-lg font-bold ${getScoreColor(overallScore)} animate-ai-glow`}>
            {overallScore}
          </span>
          <span className="text-green-500/50 font-mono text-xs">/ 100</span>
        </div>
      </div>

      {/* Summary */}
      <div className="border-l-2 border-green-500/30 pl-3">
        <div className="text-purple-400/90 font-mono text-sm animate-ai-glow-slow">
          {summary}
        </div>
      </div>

      {/* Version-Sprint Goals Alignment */}
      <div className="border border-green-500/30 p-3 space-y-3">
        <div className="text-green-500/70 font-mono text-xs">
          ЦЕЛЬ ВЕРСИИ → ЦЕЛЬ СПРИНТА
        </div>
        
        {/* Goals Display */}
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
            <span className={`font-mono text-sm font-bold ${getAlignmentColor(versionSprintAlignment.level)} animate-ai-glow`}>
              {getAlignmentLabel(versionSprintAlignment.level)}
            </span>
          </div>
          <div className="text-purple-400/80 font-mono text-xs animate-ai-glow-slow">
            {versionSprintAlignment.comment}
          </div>
        </div>
      </div>

      {/* Sprint-Tasks Alignment */}
      <div className="border border-green-500/30 p-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-green-500/70 font-mono text-xs">ЦЕЛЬ СПРИНТА → ЗАДАЧИ:</span>
          <span className="text-purple-400/70 font-mono text-xs px-1 py-0.5 bg-purple-500/10 rounded">🤖</span>
          <span className={`font-mono text-sm font-bold ${getAlignmentColor(sprintTasksAlignment.level)} animate-ai-glow`}>
            {getAlignmentLabel(sprintTasksAlignment.level)}
          </span>
          {sprintTasksAlignment.directlyRelatedPercent !== undefined && (
            <span className="text-purple-400/70 font-mono text-xs">
              ({sprintTasksAlignment.directlyRelatedPercent}%)
            </span>
          )}
        </div>
        <div className="text-purple-400/80 font-mono text-xs animate-ai-glow-slow">
          {sprintTasksAlignment.comment}
        </div>
      </div>

      {/* Demo Recommendations - limited to 3 */}
      {limitedDemoRecommendations && limitedDemoRecommendations.length > 0 && (
        <div className="border border-green-500/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-500/70 font-mono text-xs">🎬 ДЕМО:</span>
            <span className="text-purple-400/70 font-mono text-xs px-1 py-0.5 bg-purple-500/10 rounded">🤖</span>
            {analysis.demoRecommendations && analysis.demoRecommendations.length > 3 && (
              <span className="text-green-500/50 font-mono text-xs">
                (топ 3 из {analysis.demoRecommendations.length})
              </span>
            )}
          </div>
          <div className="space-y-2">
            {limitedDemoRecommendations.map((rec, idx) => (
              <DemoRecommendationMini key={rec.issueKey || idx} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Sprint Statistics Panel */}
      <SprintStatsPanel currentSprint={currentSprint} previousSprint={previousSprint} />
    </div>
  );
}


