'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import type {
  SprintReportParams,
  CollectDataResponse,
  StrategicAnalysis,
} from '@/types/workflow';
import { collectData, analyzeData } from '@/lib/apiClient';
import {
  ConsolePanel,
  ConsoleHeading,
  BackendStatus,
  Breadcrumb,
} from '@/components/console';
import { SprintCard, VersionCard, AnalysisPanel } from '@/components/sprint';


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
        <span className="text-purple-400/70 font-mono text-sm">СТРАТЕГИЧЕСКИЙ АНАЛИЗ</span>
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
            onClick={(e) => {
              e.stopPropagation();
              onRunAnalysis();
            }}
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
// Terminal History Entry
// =============================================================================

interface HistoryEntry {
  command: string;
  response: string;
  type: 'success' | 'error' | 'info';
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function DataPage() {
  const router = useRouter();
  const [collectResponse, setCollectResponse] = useState<CollectDataResponse | null>(null);
  const [analysisResult, setAnalysisResult] = useState<StrategicAnalysis | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Terminal state
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showCursor, setShowCursor] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const addToHistory = (command: string, response: string, type: 'success' | 'error' | 'info') => {
    setHistory(prev => [...prev, { command, response, type }]);
  };

  const handleCollectData = async (boardId: string) => {
    if (!boardId.trim()) {
      addToHistory(`start`, 'ERROR: Board ID обязателен. Использование: start <board_id>', 'error');
      return;
    }

    setIsRunning(true);
    setAnalysisResult(null);
    addToHistory(`start ${boardId}`, 'Загрузка данных...', 'info');

    try {
      const params: SprintReportParams = { boardId: boardId.trim() };
      const result = await collectData(params);
      setCollectResponse(result);
      
      const projectName = result.basicBoardData?.projectName || 'Unknown';
      const hasCurrent = result.basicBoardData?.availability.hasCurrentSprint;
      const hasPrevious = result.basicBoardData?.availability.hasPreviousSprint;
      
      addToHistory(
        '', 
        `✓ Данные загружены: ${projectName}\n  Current Sprint: ${hasCurrent ? '✓' : '✗'}\n  Previous Sprint: ${hasPrevious ? '✓' : '✗'}`,
        'success'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      addToHistory('', `ERROR: ${errorMessage}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!collectResponse?.basicBoardData?.currentSprint) {
      addToHistory('analyze', 'ERROR: Нет данных для анализа. Сначала выполните start <board_id>', 'error');
      return;
    }

    setIsAnalyzing(true);
    addToHistory('analyze', 'Запуск AI анализа...', 'info');

    try {
      const result = await analyzeData({
        activeVersion: collectResponse.basicBoardData.activeVersion,
        currentSprint: collectResponse.basicBoardData.currentSprint,
        previousSprint: collectResponse.basicBoardData.previousSprint,
        mockMode: false,
      });
      if (result.analysis) {
        setAnalysisResult(result.analysis);
        addToHistory('', '✓ AI анализ завершен', 'success');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      addToHistory('', `ERROR: ${errorMessage}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    
    if (!trimmed) return;

    // Parse command
    if (trimmed.startsWith('start ')) {
      const boardId = cmd.trim().slice(6).trim();
      handleCollectData(boardId);
    } else if (trimmed === 'start') {
      addToHistory('start', 'ERROR: Укажите Board ID. Использование: start <board_id>', 'error');
    } else if (trimmed === 'analyze') {
      handleRunAnalysis();
    } else if (trimmed === 'help') {
      addToHistory('help', 
        'Доступные команды:\n' +
        '  start <board_id>  - Загрузить данные спринта\n' +
        '  analyze           - Запустить AI анализ\n' +
        '  clear             - Очистить терминал\n' +
        '  help              - Показать справку',
        'info'
      );
    } else if (trimmed === 'clear') {
      setHistory([]);
    } else {
      addToHistory(cmd, `ERROR: Неизвестная команда "${trimmed}". Введите help для справки.`, 'error');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isRunning && !isAnalyzing) {
      handleCommand(input);
      setInput('');
    }
  };

  const basicBoardData = collectResponse?.basicBoardData;
  const hasData = basicBoardData?.availability.hasPreviousSprint || basicBoardData?.availability.hasCurrentSprint;

  return (
    <div 
      className="min-h-screen bg-black p-4 md:p-8"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb items={[{ label: 'data' }]} />
          <ConsoleHeading level={1}>
            [DATA] Sprint Data Collection
          </ConsoleHeading>
        </div>

        {/* Terminal Console */}
        <ConsolePanel className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <ConsoleHeading level={2}>[ ТЕРМИНАЛ ]</ConsoleHeading>
            <BackendStatus />
          </div>
          
          {/* Terminal output area */}
          <div 
            ref={terminalRef}
            className="bg-black/50 border border-green-500/30 p-4 font-mono text-sm"
          >
            {/* Welcome message */}
            <div className="text-green-500/70 mb-2">
              ezreport data collector v1.0
            </div>
            <div className="text-green-500/50 mb-4">
              Введите <span className="text-green-400">start {'<board_id>'}</span> для загрузки данных
            </div>
            
            {/* History */}
            {history.map((entry, idx) => (
              <div key={idx} className="mb-2">
                {entry.command && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">{'>'}</span>
                    <span className="text-green-400">{entry.command}</span>
                  </div>
                )}
                <div className={`whitespace-pre-wrap pl-4 ${
                  entry.type === 'error' ? 'text-red-400' :
                  entry.type === 'success' ? 'text-green-400' :
                  'text-green-500/70'
                }`}>
                  {entry.response}
                </div>
              </div>
            ))}
            
            {/* Loading indicator in terminal */}
            {(isRunning || isAnalyzing) && (
              <div className="flex items-center gap-2 text-green-500 animate-pulse">
                <span className="animate-spin">◌</span>
                <span>{isAnalyzing ? 'AI анализ...' : 'Загрузка...'}</span>
              </div>
            )}
            
            {/* Input line */}
            <div className="flex items-center gap-2 mt-4">
              <span className="text-green-500">{'>'}</span>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent outline-none caret-transparent text-green-400"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={isRunning || isAnalyzing}
                  placeholder={isRunning || isAnalyzing ? 'Подождите...' : ''}
                />
                {/* Block cursor */}
                <span 
                  className={`absolute top-0 text-green-500 ${showCursor && !isRunning && !isAnalyzing ? 'opacity-100' : 'opacity-0'}`}
                  style={{ left: `${input.length}ch` }}
                >
                  █
                </span>
              </div>
            </div>
            
            {/* Hint */}
            <div className="mt-3 text-green-500/40 text-xs">
              Команды: start {'<board_id>'} | analyze | help | clear
            </div>
          </div>
        </ConsolePanel>

        {/* Results */}
        <ConsolePanel>
          <div className="flex items-center justify-between mb-4">
            <ConsoleHeading level={2}>[ ДАННЫЕ ]</ConsoleHeading>
            {isRunning && (
              <span className="text-green-500 font-mono text-sm flex items-center gap-2">
                <span className="animate-spin">◌</span>
                загрузка...
              </span>
            )}
          </div>

          {!collectResponse ? (
            <div className="text-green-500/50 font-mono text-sm">
              [ Выполните команду start {'<board_id>'} для загрузки данных ]
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
        </ConsolePanel>

        {/* Strategic Analysis Block - separate from data */}
        {collectResponse?.basicBoardData && (
          <ConsolePanel className="mt-8">
            {analysisResult ? (
              <AnalysisPanel 
                analysis={analysisResult}
                versionGoal={basicBoardData?.activeVersion?.description}
                sprintGoal={basicBoardData?.currentSprint?.sprint.goal}
                currentSprint={basicBoardData?.currentSprint}
                previousSprint={basicBoardData?.previousSprint}
              />
            ) : (
              <AnalysisTriggerPanel
                isAnalyzing={isAnalyzing}
                hasCurrentSprint={!!basicBoardData?.currentSprint}
                onRunAnalysis={handleRunAnalysis}
              />
            )}
          </ConsolePanel>
        )}

        {/* Make EzReport Button - appears after strategic analysis */}
        {analysisResult && collectResponse?.basicBoardData && (
          <div className="mt-8 text-center py-8">
            <button
              onClick={() => {
                // Save collected data to localStorage for the report page
                localStorage.setItem('ezreport_collected_data', JSON.stringify({
                  basicBoardData: collectResponse.basicBoardData,
                  analysis: analysisResult,
                }));
                router.push('/report');
              }}
              className="text-4xl md:text-6xl font-bold tracking-tight cursor-pointer transition-all duration-300 hover:scale-105 group"
            >
              <span className="text-zinc-600 group-hover:text-zinc-500 transition-colors">make </span>
              <span className="text-green-800 group-hover:text-green-600 transition-colors">ez</span>
              <span className="text-zinc-700 group-hover:text-zinc-500 transition-colors">report</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
