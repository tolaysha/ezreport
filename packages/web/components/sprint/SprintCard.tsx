'use client';

import { useState } from 'react';
import type { SprintCardData } from '@/types/workflow';
import { getGoalMatchColor, getGoalMatchLabel, getStatusColor } from './helpers';

interface SprintCardProps {
  title: string;
  data: SprintCardData | undefined;
  variant: 'previous' | 'current';
}

export function SprintCard({ title, data, variant }: SprintCardProps) {
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

  const borderColor = variant === 'current' ? 'border-green-500' : 'border-green-500/50';
  const doneIssues = data.issues.filter((i) => i.statusCategory === 'done');
  const inProgressIssues = data.issues.filter((i) => i.statusCategory === 'indeterminate');
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

      {/* Goal Match Assessment */}
      {data.goalMatchLevel !== 'unknown' && (
        <div className="mb-4 p-3 border border-green-500/30 bg-green-500/5">
          <div className="text-green-500/70 font-mono text-xs mb-1">
            СООТВЕТСТВИЕ ЗАДАЧ ЦЕЛИ:
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-mono text-sm font-bold ${getGoalMatchColor(data.goalMatchLevel)}`}>
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
            <div className="text-green-400 font-mono text-lg font-bold">{doneIssues.length}</div>
            <div className="text-green-500/50 font-mono text-xs">Done</div>
          </div>
          <div className="border border-yellow-500/30 p-2">
            <div className="text-yellow-500 font-mono text-lg font-bold">{inProgressIssues.length}</div>
            <div className="text-yellow-500/50 font-mono text-xs">In Progress</div>
          </div>
          <div className="border border-gray-500/30 p-2">
            <div className="text-gray-400 font-mono text-lg font-bold">{todoIssues.length}</div>
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
            <div key={issue.key} className="flex items-start gap-2 text-xs font-mono">
              <span className="text-green-500/70 shrink-0">{issue.key}</span>
              <span className={`shrink-0 ${getStatusColor(issue.statusCategory)}`}>
                [{issue.status}]
              </span>
              <span className="text-green-500/90 truncate">{issue.summary}</span>
              {issue.storyPoints && (
                <span className="text-green-500/50 shrink-0">({issue.storyPoints}sp)</span>
              )}
            </div>
          ))}
        </div>
        {data.issues.length > 5 && (
          <button
            onClick={() => setShowAllIssues(!showAllIssues)}
            className="mt-2 text-green-500/70 font-mono text-xs hover:text-green-400 transition-colors"
          >
            {showAllIssues ? '[Свернуть]' : `[Показать все ${data.issues.length} задач]`}
          </button>
        )}
      </div>
    </div>
  );
}

