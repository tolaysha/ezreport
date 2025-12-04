'use client';

import type { StrategicAnalysis, DemoRecommendation, SprintCardData } from '@/types/workflow';
import { getAlignmentColor, getAlignmentLabel, getScoreColor, getDemoFormatIcon, getComplexityColor, getConfidenceColor, getConfidenceLabel } from './helpers';

// =============================================================================
// Expert Role Types
// =============================================================================

export type ExpertRole = 'tech_director' | 'product_director' | 'finance_director';

export interface ExpertRoleConfig {
  id: ExpertRole;
  label: string;
  icon: string;
  description: string;
}

export const EXPERT_ROLES: ExpertRoleConfig[] = [
  {
    id: 'tech_director',
    label: 'Технический директор',
    icon: '🔧',
    description: 'Архитектура, техдолг, производительность команды',
  },
  {
    id: 'product_director',
    label: 'Директор по продукту',
    icon: '🎯',
    description: 'Ценность для пользователя, приоритеты, roadmap',
  },
  {
    id: 'finance_director',
    label: 'Финансовый директор',
    icon: '💰',
    description: 'ROI, стоимость, эффективность инвестиций',
  },
];

export interface ExpertAnalysisResult {
  role: ExpertRole;
  roleName: string;
  summary: string;
  keyInsights: string[];
  risks: string[];
  recommendations: string[];
}

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
// In Development Panel
// =============================================================================

function InDevelopmentPanel() {
  return (
    <div className="border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-400/70 font-mono text-sm">🚧 В РАЗРАБОТКЕ</span>
      </div>
      <div className="space-y-3">
        <div className="border border-amber-500/20 bg-black/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-400 font-mono text-sm">📊 Валидация оценки задач в Story Points</span>
            <span className="text-amber-500/50 font-mono text-xs px-2 py-0.5 border border-amber-500/30 rounded">
              скоро
            </span>
          </div>
          <div className="text-amber-500/60 font-mono text-xs">
            Анализ точности оценки задач: сравнение оценки и фактического времени, 
            выявление систематических отклонений, рекомендации по калибровке команды.
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Expert View Panel
// =============================================================================

interface ExpertViewPanelProps {
  currentSprint: SprintCardData | undefined;
  previousSprint: SprintCardData | undefined;
  analysis: StrategicAnalysis | undefined;
  onGenerateExpertAnalysis: (role: ExpertRole) => Promise<void>;
  expertAnalysis: ExpertAnalysisResult | null;
  isGenerating: boolean;
  selectedRole: ExpertRole | null;
}

function ExpertViewPanel({
  currentSprint,
  previousSprint,
  analysis,
  onGenerateExpertAnalysis,
  expertAnalysis,
  isGenerating,
  selectedRole,
}: ExpertViewPanelProps) {
  const hasData = currentSprint && analysis;

  return (
    <div className="border border-indigo-500/30 bg-indigo-500/5 p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-indigo-400/70 font-mono text-sm">👔 ВЗГЛЯД ЭКСПЕРТА</span>
        <span className="text-indigo-500/50 font-mono text-xs px-1.5 py-0.5 bg-indigo-500/10 rounded">🤖 AI</span>
      </div>

      {!hasData ? (
        <div className="text-indigo-500/60 font-mono text-xs">
          Сначала выполните стратегический анализ, чтобы получить экспертную оценку.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Role Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {EXPERT_ROLES.map((role) => (
              <button
                key={role.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateExpertAnalysis(role.id);
                }}
                disabled={isGenerating}
                className={`border p-3 text-left transition-all ${
                  selectedRole === role.id
                    ? 'border-indigo-400 bg-indigo-500/20'
                    : 'border-indigo-500/30 bg-black/30 hover:border-indigo-500/50 hover:bg-indigo-500/10'
                } ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{role.icon}</span>
                  <span className="text-indigo-400 font-mono text-sm font-medium">{role.label}</span>
                </div>
                <div className="text-indigo-500/60 font-mono text-xs">
                  {role.description}
                </div>
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isGenerating && (
            <div className="border border-indigo-500/30 bg-black/30 p-4">
              <div className="flex items-center gap-3">
                <span className="animate-spin text-indigo-400">◌</span>
                <span className="text-indigo-400 font-mono text-sm animate-pulse">
                  Генерация экспертного анализа...
                </span>
              </div>
            </div>
          )}

          {/* Expert Analysis Result */}
          {expertAnalysis && !isGenerating && (
            <div className="border border-indigo-500/40 bg-black/40 p-4 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-indigo-500/30">
                <span className="text-2xl">
                  {EXPERT_ROLES.find(r => r.id === expertAnalysis.role)?.icon}
                </span>
                <span className="text-indigo-300 font-mono text-lg font-bold">
                  {expertAnalysis.roleName}
                </span>
              </div>

              {/* Summary */}
              <div className="border-l-2 border-indigo-500/50 pl-3">
                <div className="text-indigo-300 font-mono text-sm">
                  {expertAnalysis.summary}
                </div>
              </div>

              {/* Key Insights */}
              {expertAnalysis.keyInsights.length > 0 && (
                <div>
                  <div className="text-indigo-400/70 font-mono text-xs mb-2">💡 КЛЮЧЕВЫЕ ВЫВОДЫ</div>
                  <ul className="space-y-1">
                    {expertAnalysis.keyInsights.map((insight, idx) => (
                      <li key={idx} className="text-indigo-300/80 font-mono text-xs flex items-start gap-2">
                        <span className="text-indigo-500">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risks */}
              {expertAnalysis.risks.length > 0 && (
                <div>
                  <div className="text-red-400/70 font-mono text-xs mb-2">⚠️ РИСКИ</div>
                  <ul className="space-y-1">
                    {expertAnalysis.risks.map((risk, idx) => (
                      <li key={idx} className="text-red-300/80 font-mono text-xs flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {expertAnalysis.recommendations.length > 0 && (
                <div>
                  <div className="text-green-400/70 font-mono text-xs mb-2">✅ РЕКОМЕНДАЦИИ</div>
                  <ul className="space-y-1">
                    {expertAnalysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-green-300/80 font-mono text-xs flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
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
  onGenerateExpertAnalysis?: (role: ExpertRole) => Promise<void>;
  expertAnalysis?: ExpertAnalysisResult | null;
  isGeneratingExpert?: boolean;
  selectedExpertRole?: ExpertRole | null;
}

export function AnalysisPanel({ 
  analysis, 
  versionGoal, 
  sprintGoal, 
  currentSprint, 
  previousSprint,
  onGenerateExpertAnalysis,
  expertAnalysis,
  isGeneratingExpert = false,
  selectedExpertRole = null,
}: AnalysisPanelProps) {
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

      {/* Completion Prediction */}
      {analysis.completionPrediction && (
        <div className="border border-orange-500/40 bg-orange-500/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-orange-400 font-mono text-sm">🎯 ПРОГНОЗ ВЫПОЛНЕНИЯ</span>
              <span className="text-purple-400/70 font-mono text-xs px-1.5 py-0.5 bg-purple-500/10 rounded">🤖 AI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-2xl font-bold ${getConfidenceColor(analysis.completionPrediction.confidencePercent)} animate-ai-glow`}>
                {analysis.completionPrediction.confidencePercent}%
              </span>
            </div>
          </div>
          
          {/* Confidence Level Label */}
          <div className="mb-3">
            <span className={`font-mono text-sm ${getConfidenceColor(analysis.completionPrediction.confidencePercent)}`}>
              {getConfidenceLabel(analysis.completionPrediction.confidencePercent)}
            </span>
          </div>
          
          {/* Comment */}
          <div className="text-orange-300/80 font-mono text-xs mb-3 animate-ai-glow-slow">
            {analysis.completionPrediction.comment}
          </div>
          
          {/* Risks */}
          {analysis.completionPrediction.risks && analysis.completionPrediction.risks.length > 0 && (
            <div className="border-t border-orange-500/30 pt-3">
              <div className="text-red-400/70 font-mono text-xs mb-2">⚠️ РИСКИ:</div>
              <ul className="space-y-1">
                {analysis.completionPrediction.risks.map((risk, idx) => (
                  <li key={idx} className="text-red-300/70 font-mono text-xs flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

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

      {/* In Development Section */}
      <InDevelopmentPanel />

      {/* Expert View Section */}
      {onGenerateExpertAnalysis && (
        <ExpertViewPanel
          currentSprint={currentSprint}
          previousSprint={previousSprint}
          analysis={analysis}
          onGenerateExpertAnalysis={onGenerateExpertAnalysis}
          expertAnalysis={expertAnalysis ?? null}
          isGenerating={isGeneratingExpert}
          selectedRole={selectedExpertRole}
        />
      )}
    </div>
  );
}


