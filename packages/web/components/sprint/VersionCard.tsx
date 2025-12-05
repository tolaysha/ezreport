'use client';

import type { VersionMeta } from '@/types/workflow';
import { getScoreColor } from './helpers';

interface VersionCardProps {
  version: VersionMeta | undefined;
}

export function VersionCard({ version }: VersionCardProps) {
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
      <div className="text-cyan-500/80 font-mono text-sm mb-3">
        <span className="text-cyan-500/50">Цель:</span>{' '}
        {version.description ? (
          version.description
        ) : (
          <span className="text-red-500">⚠️ Цель версии не указана</span>
        )}
      </div>
      <div className="flex items-center gap-4 text-cyan-500/70 font-mono text-xs">
        {version.releaseDate ? (
          <span>📅 Релиз: {version.releaseDate}</span>
        ) : (
          <span className="text-red-500">📅 Релиз: не указана</span>
        )}
        {version.progressPercent !== undefined ? (
          <span>
            📊 Прогресс:{' '}
            <span className={getScoreColor(version.progressPercent)}>
              {version.progressPercent}%
            </span>
          </span>
        ) : (
          <span className="text-red-500">📊 Прогресс: нет данных</span>
        )}
        <span className={version.released ? 'text-green-400' : 'text-yellow-500'}>
          {version.released ? '✓ Выпущена' : '◐ В разработке'}
        </span>
      </div>
    </div>
  );
}


