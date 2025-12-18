'use client';

import { useState } from 'react';
import type { SprintCardData, SprintEpic, DemoArtifact } from '@/types/workflow';
import { getStatusColor } from './helpers';

interface SprintCardProps {
  title: string;
  data: SprintCardData | undefined;
  variant: 'previous' | 'current';
  /** AI-generated overview (2 sentences) */
  overview?: string;
}

// Helper to get issue type color
function getIssueTypeColor(type: string): string {
  switch (type) {
    case 'История':
    case 'Story':
      return 'text-blue-400';
    case 'Баг':
    case 'Bug':
      return 'text-red-400';
    case 'Задача':
    case 'Task':
      return 'text-green-400';
    default:
      return 'text-gray-400';
  }
}

// Helper to format estimate from seconds to human-readable
function formatEstimate(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  const hours = seconds / 3600;
  if (hours >= 8) {
    const days = Math.floor(hours / 8);
    const remainingHours = hours % 8;
    if (remainingHours > 0) {
      return `${days}d ${remainingHours.toFixed(0)}h`;
    }
    return `${days}d`;
  }
  if (hours >= 1) {
    return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h`;
  }
  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
}

// Epic Item Component
function EpicItem({ epic }: { epic: SprintEpic }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const doneCount = epic.issues.filter(i => i.statusCategory === 'done').length;
  
  return (
    <div className="border border-green-500/20 bg-green-500/5">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="w-full p-2 flex items-center justify-between hover:bg-green-500/10 transition-colors"
      >
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-green-500/50">{isExpanded ? '▼' : '▶'}</span>
          <span className="text-green-500/70">{epic.key}</span>
          <span className={`truncate ${epic.done ? 'text-green-500/50 line-through' : 'text-green-500'}`}>
            {epic.name || epic.summary}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-green-400 font-mono text-xs">{doneCount}/{epic.issues.length}</span>
        </div>
      </button>
      {isExpanded && (
        <div className="border-t border-green-500/20 p-2 space-y-1">
          {epic.issues.map((issue) => (
            <div key={issue.key} className="flex items-start gap-2 text-xs font-mono pl-4">
              <span className="text-green-500/50 shrink-0">{issue.key}</span>
              <span className={`shrink-0 ${getStatusColor(issue.statusCategory)}`}>
                [{issue.status}]
              </span>
              <span className="text-green-500/80 truncate">{issue.summary}</span>
              {issue.originalEstimateSeconds && (
                <span className="text-cyan-400/70 shrink-0">⏱{formatEstimate(issue.originalEstimateSeconds)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Demo Artifact Item Component
function ArtifactItem({ artifact, onImageClick }: { artifact: DemoArtifact; onImageClick: (url: string) => void }) {
  return (
    <div className="border border-orange-500/20 bg-orange-500/5 p-2">
      <div className="flex items-start gap-2 mb-2">
        <span className="text-orange-500/70 font-mono text-xs shrink-0">{artifact.issueKey}</span>
        <span className="text-orange-400 font-mono text-xs truncate">{artifact.issueSummary}</span>
      </div>
      {artifact.commentExcerpt && (
        <div className="text-orange-300/70 font-mono text-xs mb-2 italic">
          &quot;{artifact.commentExcerpt}&quot;
        </div>
      )}
      <div 
        className="cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onImageClick(artifact.imageUrl)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={artifact.thumbnailUrl || artifact.imageUrl} 
          alt={artifact.filename}
          className="max-w-full h-auto max-h-32 object-contain border border-orange-500/30"
          onError={(e) => {
            // Hide broken images
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      <div className="flex items-center gap-2 mt-1 text-xs font-mono text-orange-500/50">
        <span>{artifact.filename}</span>
        {artifact.author && <span>• {artifact.author}</span>}
      </div>
    </div>
  );
}

// Image Modal Component
function ImageModal({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button 
        className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
        onClick={onClose}
      >
        ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={imageUrl} 
        alt="Demo artifact"
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function SprintCard({ title, data, variant, overview }: SprintCardProps) {
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [showEpics, setShowEpics] = useState(true);
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
  const epics = data.epics;

  return (
    <div className={`border ${borderColor} bg-black p-4`}>
      {/* Header */}
      <div className="mb-4 pb-2 border-b border-green-500/30">
        <div className="text-green-400 font-mono text-sm mb-1">{title}</div>
        <div className="text-green-500 font-mono text-lg font-bold">
          {data.sprint.name}
        </div>
        <div className="font-mono text-xs mt-1">
          {data.sprint.startDate && data.sprint.endDate ? (
            <span className="text-green-500/70">
              {data.sprint.startDate} — {data.sprint.endDate}
            </span>
          ) : (
            <span className="text-red-500">
              ⚠️ Даты спринта не указаны
            </span>
          )}
        </div>
      </div>

      {/* Goal */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-green-500/70 font-mono text-xs">ЦЕЛЬ:</span>
          {data.sprint.goal && data.sprint.goalIsGenerated && (
            <span className="text-purple-400/80 font-mono text-xs px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded">
              🤖 AI
            </span>
          )}
        </div>
        {data.sprint.goal ? (
          <div className={`font-mono text-sm ${data.sprint.goalIsGenerated ? 'text-purple-400/90 italic' : 'text-green-500'}`}>
            {data.sprint.goal}
          </div>
        ) : (
          <div className="text-red-500 font-mono text-sm">
            ⚠️ Цель спринта не указана
          </div>
        )}
      </div>

      {/* AI Overview */}
      {overview && (
        <div className="mb-4 border border-purple-500/30 bg-purple-500/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-400/70 font-mono text-xs">OVERVIEW</span>
            <span className="text-purple-400/80 font-mono text-xs px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded">
              🤖 AI
            </span>
          </div>
          <div className="text-purple-400 font-mono text-sm italic">
            {overview}
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

      {/* Epics Section */}
      {epics && epics.length > 0 && (
        <div className="mb-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowEpics(!showEpics);
            }}
            className="text-green-500/70 font-mono text-xs mb-2 hover:text-green-400 transition-colors flex items-center gap-1"
          >
            <span>{showEpics ? '▼' : '▶'}</span>
            <span>ЭПИКИ ({epics.length}):</span>
          </button>
          {showEpics && (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {epics.map((epic) => (
                <EpicItem key={epic.key} epic={epic} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Demo Artifacts Section */}
      {data.demoArtifacts && data.demoArtifacts.length > 0 && (
        <div className="mb-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowArtifacts(!showArtifacts);
            }}
            className="text-orange-500/70 font-mono text-xs mb-2 hover:text-orange-400 transition-colors flex items-center gap-1"
          >
            <span>{showArtifacts ? '▼' : '▶'}</span>
            <span>📸 АРТЕФАКТЫ ({data.demoArtifacts.length}):</span>
          </button>
          {showArtifacts && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {data.demoArtifacts.map((artifact, idx) => (
                <ArtifactItem 
                  key={`${artifact.issueKey}-${idx}`} 
                  artifact={artifact} 
                  onImageClick={setSelectedImage}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage} 
          onClose={() => setSelectedImage(null)} 
        />
      )}

      {/* Issues List */}
      <div className="mb-4">
        <div className="text-green-500/70 font-mono text-xs mb-2">
          СПИСОК ЗАДАЧ ({data.issues.length}):
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {displayedIssues.map((issue) => (
            <div key={issue.key} className="flex items-start gap-2 text-xs font-mono">
              <span className="text-green-500/70 shrink-0">{issue.key}</span>
              {issue.issueType && (
                <span className={`shrink-0 ${getIssueTypeColor(issue.issueType)}`}>
                  [{issue.issueType}]
                </span>
              )}
              <span className={`shrink-0 ${getStatusColor(issue.statusCategory)}`}>
                [{issue.status}]
              </span>
              <span className="text-green-500/90 truncate">{issue.summary}</span>
              {issue.storyPoints && (
                <span className="text-green-500/50 shrink-0">({issue.storyPoints}sp)</span>
              )}
              {issue.originalEstimateSeconds && (
                <span className="text-cyan-400/70 shrink-0">⏱{formatEstimate(issue.originalEstimateSeconds)}</span>
              )}
            </div>
          ))}
        </div>
        {data.issues.length > 5 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAllIssues(!showAllIssues);
            }}
            className="mt-2 text-green-500/70 font-mono text-xs hover:text-green-400 transition-colors"
          >
            {showAllIssues ? '[Свернуть]' : `[Показать все ${data.issues.length} задач]`}
          </button>
        )}
      </div>
    </div>
  );
}


