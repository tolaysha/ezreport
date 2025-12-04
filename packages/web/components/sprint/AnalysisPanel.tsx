'use client';

import type { StrategicAnalysis, DemoRecommendation } from '@/types/workflow';
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
// Analysis Panel
// =============================================================================

interface AnalysisPanelProps {
  analysis: StrategicAnalysis | undefined;
  versionGoal: string | undefined;
  sprintGoal: string | undefined;
}

export function AnalysisPanel({ analysis, versionGoal, sprintGoal }: AnalysisPanelProps) {
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
      {/* Header with Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-mono text-sm">[ 📊 СТРАТЕГИЧЕСКИЙ АНАЛИЗ ]</span>
          <span className="text-purple-400/70 font-mono text-xs px-1 py-0.5 bg-purple-500/10 rounded">
            🤖
          </span>
        </div>
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

