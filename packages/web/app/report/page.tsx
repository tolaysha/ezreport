'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ConsoleHeading,
  Breadcrumb,
} from '@/components/console';
import { generatePartnerReport, publishToNotion } from '@/lib/apiClient';
import { useColor } from '@/lib/colorContext';

// ═══════════════════════════════════════════════════════════════
// 🏎️ PIXEL RACER - Tetris-style dodge game
// ═══════════════════════════════════════════════════════════════

const GRID_ROWS = 17;  // 5 lanes * 3 + 2 borders
const LANE_HEIGHT = 3;
const NUM_LANES = 5;
const PLAYER_X = 8;
const GAME_TICK = 70;
const PIXEL_SIZE = 4;
const MIN_SPAWN_DISTANCE = 18;

// Car shape from user matrix:
// 1 0 1 0
// 0 1 1 1
// 1 0 1 0
const CAR_SHAPE = [
  [0, 0], [2, 0],           // top: ■ · ■ ·
  [1, 1], [2, 1], [3, 1],   // mid: · ■ ■ ■
  [0, 2], [2, 2],           // bot: ■ · ■ ·
];

interface Enemy {
  id: number;
  x: number;
  lane: number;
}

function DodgeGame({ containerWidth }: { containerWidth: number }) {
  // Calculate grid columns based on container width
  const gridCols = Math.floor((containerWidth - 10) / (PIXEL_SIZE + 1)) || 100;
  
  const [playerLane, setPlayerLane] = useState(2);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [nextId, setNextId] = useState(0);

  const resetGame = useCallback(() => {
    setPlayerLane(2);
    setEnemies([]);
    setScore(0);
    setGameOver(false);
    setNextId(0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) {
        if (e.key === ' ' || e.key === 'Enter') resetGame();
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'w') {
        setPlayerLane(p => Math.max(0, p - 1));
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        setPlayerLane(p => Math.min(NUM_LANES - 1, p + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, resetGame]);

  useEffect(() => {
    if (gameOver) return;

    const tick = setInterval(() => {
      setEnemies(prev => {
        let updated = prev.map(e => ({ ...e, x: e.x - 1 }));
        
        const passed = updated.filter(e => e.x < -4);
        updated = updated.filter(e => e.x >= -4);
        if (passed.length) setScore(s => s + passed.length * 10);

        const playerY = 1 + playerLane * LANE_HEIGHT;
        const playerPixels = CAR_SHAPE.map(([dx, dy]) => ({
          x: PLAYER_X + dx,
          y: playerY + dy,
        }));

        for (const enemy of updated) {
          const enemyY = 1 + enemy.lane * LANE_HEIGHT;
          const enemyPixels = CAR_SHAPE.map(([dx, dy]) => ({
            x: enemy.x + dx,
            y: enemyY + dy,
          }));

          const hit = playerPixels.some(pp =>
            enemyPixels.some(ep => pp.x === ep.x && pp.y === ep.y)
          );

          if (hit) {
            setGameOver(true);
            setHighScore(h => Math.max(h, score));
            return prev;
          }
        }

        // Spawn enemies - more traffic
        if (Math.random() > 0.82) {
          const lane = Math.floor(Math.random() * NUM_LANES);
          // Check if any enemy is too close on the same lane
          const tooClose = updated.some(e => e.lane === lane && e.x > gridCols - MIN_SPAWN_DISTANCE);
          if (!tooClose) {
            setNextId(id => id + 1);
            updated.push({ id: nextId, x: gridCols, lane });
          }
        }

        return updated;
      });
    }, GAME_TICK);

    return () => clearInterval(tick);
  }, [gameOver, playerLane, score, nextId, gridCols]);

  // Build grid
  const grid: string[][] = Array.from({ length: GRID_ROWS }, () =>
    Array(gridCols).fill('empty')
  );

  // Border lines (top & bottom of road)
  for (let x = 0; x < gridCols; x++) {
    grid[0][x] = 'border';
    grid[GRID_ROWS - 1][x] = 'border';
  }

  // Road markings - dashed lines between lanes
  for (let lane = 1; lane < NUM_LANES; lane++) {
    const y = lane * LANE_HEIGHT; // line between lanes
    for (let x = 0; x < gridCols; x++) {
      // Dashed pattern: 3 on, 5 off
      if (x % 8 < 3) {
        grid[y][x] = 'marking';
      }
    }
  }

  // Player
  const playerY = 1 + playerLane * LANE_HEIGHT;
  CAR_SHAPE.forEach(([dx, dy]) => {
    const px = PLAYER_X + dx;
    const py = playerY + dy;
    if (py >= 0 && py < GRID_ROWS && px >= 0 && px < gridCols) {
      grid[py][px] = gameOver ? 'crash' : 'player';
    }
  });

  // Enemies
  enemies.forEach(enemy => {
    const ey = 1 + enemy.lane * LANE_HEIGHT;
    CAR_SHAPE.forEach(([dx, dy]) => {
      const px = enemy.x + dx;
      const py = ey + dy;
      if (py >= 0 && py < GRID_ROWS && px >= 0 && px < gridCols) {
        grid[py][px] = 'enemy';
      }
    });
  });

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      {/* Header */}
      <div className="font-mono text-[10px] text-zinc-500 flex items-center gap-3">
        <span className="text-zinc-400">RACER</span>
        <span>SCORE:<span className="text-purple-400 ml-1">{score}</span></span>
        <span>HI:<span className="text-purple-300 ml-1">{highScore}</span></span>
        <span className="text-zinc-700">│</span>
        <span className="text-zinc-600">{gameOver ? 'SPACE' : '↑↓'}</span>
      </div>

      {/* Game Grid */}
      <div 
        className="overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, ${PIXEL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, ${PIXEL_SIZE}px)`,
          gap: '1px',
        }}
      >
        {grid.flat().map((cell, i) => {
          let style: React.CSSProperties = { 
            width: PIXEL_SIZE, 
            height: PIXEL_SIZE,
          };
          
          if (cell === 'player') {
            // AI purple color
            style.backgroundColor = '#a855f7';
            style.boxShadow = 'inset 1px 1px 0 #c084fc';
          } else if (cell === 'enemy') {
            // Theme green color
            style.backgroundColor = '#22c55e';
            style.boxShadow = 'inset 1px 1px 0 #4ade80';
          } else if (cell === 'crash') {
            style.backgroundColor = '#ef4444';
          } else if (cell === 'border') {
            style.backgroundColor = '#52525b';
          } else if (cell === 'marking') {
            style.backgroundColor = '#3f3f46';
          }

          return <div key={i} style={style} />;
        })}
      </div>
    </div>
  );
}

const TEMPLATE_SECTIONS = [
  { icon: '🚀', label: 'version info' },
  { icon: '✅', label: 'sprint status' },
  { icon: '📊', label: 'overview' },
  { icon: '🏆', label: 'achievements' },
  { icon: '📦', label: 'artifacts' },
  { icon: '🎯', label: 'next sprint' },
  { icon: '⚠️', label: 'blockers' },
  { icon: '❓', label: 'pm questions' },
];

// Section icons mapping
const SECTION_ICONS: Record<string, string> = {
  'версия': '🚀',
  'version': '🚀',
  'спринт': '✅',
  'sprint': '✅',
  'overview': '📊',
  'обзор': '📊',
  'достижен': '🏆',
  'achievement': '🏆',
  'ключев': '🏆',
  'артефакт': '📦',
  'artifact': '📦',
  'демо': '📦',
  'demo': '📦',
  'план': '🎯',
  'next': '🎯',
  'следующ': '🎯',
  'блокер': '⚠️',
  'blocker': '⚠️',
  'вопрос': '❓',
  'question': '❓',
  'pm': '❓',
  'не сделан': '📋',
  'not done': '📋',
};

function getSectionIcon(title: string): string {
  const lower = title.toLowerCase();
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '📄';
}

interface ReportSection {
  title: string;
  content: string;
  icon: string;
}

function parseReportSections(markdown: string): ReportSection[] {
  const lines = markdown.split('\n');
  const sections: ReportSection[] = [];
  let currentSection: ReportSection | null = null;
  let contentLines: string[] = [];

  for (const line of lines) {
    // Match ## headers (main sections)
    const h2Match = line.match(/^##\s+\**(.+?)\**\s*$/);
    if (h2Match) {
      // Save previous section
      if (currentSection) {
        currentSection.content = contentLines.join('\n').trim();
        if (currentSection.content || currentSection.title) {
          sections.push(currentSection);
        }
      }
      const title = h2Match[1].replace(/\*+/g, '').trim();
      currentSection = {
        title,
        content: '',
        icon: getSectionIcon(title),
      };
      contentLines = [];
      continue;
    }

    // Skip the main # header and --- separators
    if (line.match(/^#\s+/) || line.match(/^---\s*$/)) {
      continue;
    }

    if (currentSection) {
      contentLines.push(line);
    }
  }

  // Don't forget the last section
  if (currentSection) {
    currentSection.content = contentLines.join('\n').trim();
    if (currentSection.content || currentSection.title) {
      sections.push(currentSection);
    }
  }

  return sections;
}

function FormatContent({ content, colorScheme }: { content: string; colorScheme: { primary: string; secondary: string; border: string; accent: string } }) {
  const lines = content.split('\n');
  
  return (
    <>
      {lines.map((line, idx) => {
        // Bold text
        const boldMatch = line.match(/\*\*(.+?)\*\*/g);
        let formattedLine: React.ReactNode = line;
        
        if (boldMatch) {
          const parts = line.split(/(\*\*.+?\*\*)/);
          formattedLine = parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className={colorScheme.secondary}>{part.slice(2, -2)}</strong>;
            }
            return part;
          });
        }

        // List items
        if (line.trim().startsWith('- ')) {
          return (
            <div key={idx} className="flex gap-2 my-1">
              <span className={`${colorScheme.primary} opacity-60`}>→</span>
              <span>{typeof formattedLine === 'string' ? formattedLine.slice(2) : formattedLine}</span>
            </div>
          );
        }

        // Links
        const linkMatch = line.match(/\[(.+?)\]\((.+?)\)/);
        if (linkMatch) {
          const [, text, url] = linkMatch;
          return (
            <div key={idx} className="my-1">
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
              >
                {text}
              </a>
            </div>
          );
        }

        // Empty lines
        if (!line.trim()) {
          return <div key={idx} className="h-2" />;
        }

        return <div key={idx} className="my-1">{formattedLine}</div>;
      })}
    </>
  );
}

function StyledReport({ markdown }: { markdown: string }) {
  const { colorScheme } = useColor();
  const sections = useMemo(() => parseReportSections(markdown), [markdown]);

  // Extract main title from markdown
  const titleMatch = markdown.match(/^#\s+(.+?)$/m);
  const mainTitle = titleMatch ? titleMatch[1].replace(/[✅🚀📊🏆📦🎯⚠️❓]/g, '').trim() : 'Отчёт';

  return (
    <div className="mb-12 space-y-4">
      {/* Report Header */}
      <div className={`border ${colorScheme.border}/30 bg-gradient-to-b from-${colorScheme.accent.replace('bg-', '')}/30 to-transparent rounded-lg p-6 backdrop-blur`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">✅</span>
          <h2 className={`text-xl font-bold ${colorScheme.secondary} font-mono`}>{mainTitle}</h2>
        </div>
        <div className={`flex items-center gap-2 text-xs ${colorScheme.primary} opacity-50 font-mono`}>
          <span className={`w-2 h-2 rounded-full ${colorScheme.accent} animate-pulse`} />
          <span>сгенерировано</span>
          <span>•</span>
          <span>{new Date().toLocaleDateString('ru-RU')}</span>
        </div>
      </div>

      {/* Report Sections */}
      <div className="grid gap-4">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className={`border ${colorScheme.border}/20 bg-gradient-to-br from-${colorScheme.accent.replace('bg-', '')}/20 via-black to-transparent rounded-lg overflow-hidden transition-all hover:${colorScheme.border}/40`}
          >
            {/* Section Header */}
            <div className={`flex items-center gap-3 px-4 py-3 ${colorScheme.accent}/5 border-b ${colorScheme.border}/10`}>
              <span className="text-lg">{section.icon}</span>
              <h3 className={`text-sm font-semibold ${colorScheme.secondary} font-mono uppercase tracking-wide`}>
                {section.title}
              </h3>
            </div>
            
            {/* Section Content */}
            <div className={`px-4 py-4 font-mono text-sm ${colorScheme.primary} opacity-80 leading-relaxed`}>
              {section.content ? <FormatContent content={section.content} colorScheme={colorScheme} /> : (
                <span className={`${colorScheme.primary} opacity-40 italic`}>Нет данных</span>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default function ReportPage() {
  const { colorScheme } = useColor();
  const [report, setReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collectedData, setCollectedData] = useState<unknown>(null);
  const [notionUrl, setNotionUrl] = useState<string | null>(null);
  const [templateWidth, setTemplateWidth] = useState(500);
  const templateRef = useRef<HTMLDivElement>(null);

  // Measure template width
  useEffect(() => {
    const measureWidth = () => {
      if (templateRef.current) {
        setTemplateWidth(templateRef.current.offsetWidth);
      }
    };
    measureWidth();
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, []);

  // Load collected data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('ezreport_collected_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setCollectedData(parsed);
      } catch (e) {
        console.error('Failed to parse saved data:', e);
        setError('Не удалось загрузить сохранённые данные.');
      }
    }
  }, []);

  const handleGenerateReport = async () => {
    if (!collectedData) {
      setError('Нет данных для генерации отчёта. Сначала выполните сбор данных.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setNotionUrl(null);

    try {
      const response = await generatePartnerReport(collectedData);
      if (response.report && response.report.trim()) {
        setReport(response.report);
      } else {
        setError('Сервер вернул пустой отчёт. Попробуйте ещё раз.');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Report generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishToNotion = async () => {
    if (!report) {
      setError('Нет отчёта для публикации.');
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      // Extract title from markdown (first # heading)
      const titleMatch = report.match(/^#\s+(.+?)$/m);
      const title = titleMatch 
        ? titleMatch[1].replace(/[✅🚀📊🏆📦🎯⚠️❓]/g, '').trim()
        : `Sprint Report ${new Date().toLocaleDateString('ru-RU')}`;

      const response = await publishToNotion(title, report);
      setNotionUrl(response.pageUrl);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Publish to Notion failed:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className={`min-h-screen ${colorScheme.bg} p-4 md:p-8`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb items={[{ label: 'data', href: '/data' }, { label: 'report' }]} />
          <ConsoleHeading level={1}>
            Partner Sync Report
          </ConsoleHeading>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 border border-red-500 bg-black p-4">
            <div className="text-red-500 font-mono text-sm">[ERROR] {error}</div>
          </div>
        )}

        {/* Notion URL Success Message */}
        {notionUrl && (
          <div className={`mb-6 border ${colorScheme.border}/30 bg-gradient-to-r from-green-500/10 to-transparent p-4 rounded-lg`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <div className={`font-mono text-sm ${colorScheme.secondary}`}>Опубликовано в Notion!</div>
                <a 
                  href={notionUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 font-mono text-sm"
                >
                  {notionUrl}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Template Preview or Generated Report */}
        {report ? (
          <>
            <StyledReport markdown={report} />
            
            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-4 mb-8">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(report);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-mono ${colorScheme.primary} opacity-60 border ${colorScheme.border}/20 rounded hover:${colorScheme.border}/40 hover:opacity-80 transition-all`}
              >
                <span>📋</span>
                <span>копировать markdown</span>
              </button>
              
              {notionUrl ? (
                <a
                  href={notionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-mono border rounded transition-all text-green-400 border-green-500/30 hover:border-green-500/50 hover:text-green-300"
                >
                  <span>✅</span>
                  <span>открыть в Notion →</span>
                </a>
              ) : (
                <button
                  onClick={handlePublishToNotion}
                  disabled={isPublishing}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-mono border rounded transition-all ${
                    isPublishing 
                      ? 'text-purple-400 border-purple-500/30 animate-pulse cursor-wait' 
                      : `${colorScheme.primary} border-${colorScheme.border}/20 hover:border-${colorScheme.border}/40 hover:opacity-80`
                  }`}
                >
                  <span>{isPublishing ? '⏳' : '📤'}</span>
                  <span>{isPublishing ? 'публикуем...' : 'опубликовать в Notion'}</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="mb-12" ref={templateRef}>
            {/* Compact Template Preview */}
            <div className={`border ${colorScheme.border}/20 bg-gradient-to-b from-${colorScheme.accent.replace('bg-', '')}/20 to-transparent rounded-lg p-4 backdrop-blur`}>
              <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${colorScheme.border}/10`}>
                <span className={`${colorScheme.primary} opacity-60 text-xs font-mono`}>template.md</span>
                <div className="flex-1" />
                <div className="flex gap-1">
                  <span className={`w-2 h-2 rounded-full ${colorScheme.accent} opacity-30`} />
                  <span className={`w-2 h-2 rounded-full ${colorScheme.accent} opacity-20`} />
                  <span className={`w-2 h-2 rounded-full ${colorScheme.accent} opacity-10`} />
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {TEMPLATE_SECTIONS.map((section, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center p-3 rounded ${colorScheme.accent}/5 border ${colorScheme.border}/10 hover:${colorScheme.border}/30 hover:${colorScheme.accent}/10 transition-all cursor-default group`}
                  >
                    <span className="text-lg mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      {section.icon}
                    </span>
                    <span className={`text-[10px] font-mono ${colorScheme.primary} opacity-50 group-hover:opacity-80 transition-colors text-center leading-tight`}>
                      {section.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dodge Game - shown while generating */}
        {isGenerating && (
          <div className="mb-6">
            <DodgeGame containerWidth={templateWidth} />
          </div>
        )}

        {/* Make EzReport Button */}
        <div className="text-center py-8">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="text-4xl md:text-6xl font-bold tracking-tight cursor-pointer transition-all duration-300 hover:scale-105 disabled:cursor-wait group"
          >
            <span className="text-zinc-600 group-hover:text-zinc-500 transition-colors">make </span>
            {isGenerating ? (
              <>
                <span className="text-purple-500 animate-pulse">ez</span>
                <span className="text-purple-400 animate-pulse">report</span>
              </>
            ) : (
              <>
                <span className={`${colorScheme.primary.replace('-500', '-800')} group-hover:${colorScheme.primary.replace('-500', '-600')} transition-colors`}>ez</span>
                <span className="text-zinc-700 group-hover:text-zinc-500 transition-colors">report</span>
              </>
            )}
          </button>
          {isGenerating && (
            <p className="mt-4 text-purple-400 font-mono text-sm animate-pulse">
              generating report... this may take a minute ⏳
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
