'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import type {
  SprintReportParams,
  CollectDataResponse,
  StrategicAnalysis,
} from '@/types/workflow';
import { collectData, analyzeData, generateExpertAnalysis } from '@/lib/apiClient';
import {
  ConsolePanel,
  ConsoleHeading,
  BackendStatus,
  Breadcrumb,
} from '@/components/console';
import { SprintCard, VersionCard, AnalysisPanel, ExpertRole, ExpertAnalysisResult } from '@/components/sprint';
import { useColor } from '@/lib/colorContext';


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
        <span className="text-purple-400/70 font-mono text-sm">STRATEGIC ANALYSIS</span>
      </div>
      {isAnalyzing ? (
        <div className="py-4">
          <div className="text-purple-400 font-mono text-sm animate-ai-pulse">
            🤖 Generating AI analysis...
          </div>
        </div>
      ) : (
        <>
          <div className="text-purple-400/60 font-mono text-sm mb-4">
            Data loaded. Run AI analysis to get strategic assessment.
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRunAnalysis();
            }}
            disabled={isAnalyzing || !hasCurrentSprint}
            className="border border-purple-500 text-purple-400 px-4 py-2 font-mono text-sm hover:bg-purple-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            [RUN] 🤖 Run AI Analysis
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
  const { colorScheme } = useColor();
  const [collectResponse, setCollectResponse] = useState<CollectDataResponse | null>(null);
  const [analysisResult, setAnalysisResult] = useState<StrategicAnalysis | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Expert analysis state
  const [expertAnalysis, setExpertAnalysis] = useState<ExpertAnalysisResult | null>(null);
  const [isGeneratingExpert, setIsGeneratingExpert] = useState(false);
  const [selectedExpertRole, setSelectedExpertRole] = useState<ExpertRole | null>(null);
  
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
      addToHistory(`start`, 'ERROR: Board ID is required. Usage: start <board_id>', 'error');
      return;
    }

    setIsRunning(true);
    setAnalysisResult(null);

    try {
      const params: SprintReportParams = { boardId: boardId.trim() };
      const result = await collectData(params);
      setCollectResponse(result);
      
      const projectName = result.basicBoardData?.projectName || 'Unknown';
      const hasCurrent = result.basicBoardData?.availability.hasCurrentSprint;
      const hasPrevious = result.basicBoardData?.availability.hasPreviousSprint;
      
      addToHistory(
        `start ${boardId}`, 
        `✓ Data loaded: ${projectName}\n  Current Sprint: ${hasCurrent ? '✓' : '✗'}\n  Previous Sprint: ${hasPrevious ? '✓' : '✗'}`,
        'success'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      addToHistory(`start ${boardId}`, `ERROR: ${errorMessage}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!collectResponse?.basicBoardData?.currentSprint) {
      addToHistory('analyze', 'ERROR: No data to analyze. First run start <board_id>', 'error');
      return;
    }

    setIsAnalyzing(true);

    try {
      const result = await analyzeData({
        activeVersion: collectResponse.basicBoardData.activeVersion,
        currentSprint: collectResponse.basicBoardData.currentSprint,
        previousSprint: collectResponse.basicBoardData.previousSprint,
        mockMode: false,
      });
      if (result.analysis) {
        setAnalysisResult(result.analysis);
        addToHistory('analyze', '✓ AI analysis completed', 'success');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      addToHistory('analyze', `ERROR: ${errorMessage}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateExpertAnalysis = async (role: ExpertRole) => {
    if (!collectResponse?.basicBoardData?.currentSprint || !analysisResult) {
      return;
    }

    setIsGeneratingExpert(true);
    setSelectedExpertRole(role);

    try {
      const result = await generateExpertAnalysis({
        role,
        currentSprint: collectResponse.basicBoardData.currentSprint,
        previousSprint: collectResponse.basicBoardData.previousSprint,
        analysis: analysisResult,
      });
      setExpertAnalysis(result);
    } catch (err) {
      // Error handling without console logging
    } finally {
      setIsGeneratingExpert(false);
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
      addToHistory('start', 'ERROR: Specify Board ID. Usage: start <board_id>', 'error');
    } else if (trimmed === 'analyze') {
      handleRunAnalysis();
    } else if (trimmed === 'help') {
      addToHistory('help', 
        'Available commands:\n' +
        '  start <board_id>  - Load sprint data\n' +
        '  analyze           - Run AI analysis\n' +
        '  clear             - Clear terminal\n' +
        '  help              - Show help',
        'info'
      );
    } else if (trimmed === 'clear') {
      setHistory([]);
    } else {
      addToHistory(cmd, `ERROR: Unknown command "${trimmed}". Type help for assistance.`, 'error');
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
      className={`min-h-screen ${colorScheme.bg} p-4 md:p-8`}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb items={[{ label: 'data' }]} />
          <ConsoleHeading level={1}>
            Sprint Data Collection
          </ConsoleHeading>
        </div>

        {/* Terminal Console */}
        <ConsolePanel className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <ConsoleHeading level={2}>[ TERMINAL ]</ConsoleHeading>
            <BackendStatus />
          </div>
          
          {/* Terminal output area */}
          <div 
            ref={terminalRef}
            className={`bg-black/50 border ${colorScheme.border}/30 p-4 font-mono text-sm`}
          >
            {/* Welcome message */}
            <div className={`${colorScheme.primary} opacity-70 mb-2`}>
              ezreport data collector v1.0
            </div>
            <div className={`${colorScheme.primary} opacity-50 mb-4`}>
              Enter <span className={colorScheme.secondary}>start {'<board_id>'}</span> to load data
            </div>
            
            {/* History */}
            {history.map((entry, idx) => (
              <div key={idx} className="mb-2">
                {entry.command && (
                  <div className="flex items-center gap-2">
                    <span className={colorScheme.primary}>{'>'}</span>
                    <span className={colorScheme.secondary}>{entry.command}</span>
                  </div>
                )}
                <div className={`whitespace-pre-wrap pl-4 ${
                  entry.type === 'error' ? 'text-red-400' :
                  entry.type === 'success' ? colorScheme.secondary :
                  `${colorScheme.primary} opacity-70`
                }`}>
                  {entry.response}
                </div>
              </div>
            ))}
            
            {/* Loading indicator in terminal */}
            {(isRunning || isAnalyzing) && (
              <div className={`flex items-center gap-2 ${colorScheme.primary} animate-pulse`}>
                <span className="animate-spin">◌</span>
                <span>{isAnalyzing ? 'AI analysis...' : 'Loading...'}</span>
              </div>
            )}
            
            {/* Input line */}
            <div className="flex items-center gap-2 mt-4">
              <span className={colorScheme.primary}>{'>'}</span>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full bg-transparent outline-none caret-transparent ${colorScheme.secondary}`}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={isRunning || isAnalyzing}
                  placeholder={isRunning || isAnalyzing ? 'Please wait...' : ''}
                />
                {/* Block cursor */}
                <span 
                  className={`absolute top-0 ${colorScheme.primary} ${showCursor && !isRunning && !isAnalyzing ? 'opacity-100' : 'opacity-0'}`}
                  style={{ left: `${input.length}ch` }}
                >
                  █
                </span>
              </div>
            </div>
            
            {/* Hint */}
            <div className={`mt-3 ${colorScheme.primary} opacity-40 text-xs`}>
              Commands: start {'<board_id>'} | analyze | help | clear
            </div>
          </div>
        </ConsolePanel>

        {/* Results */}
        <ConsolePanel>
          <div className="flex items-center justify-between mb-4">
            <ConsoleHeading level={2}>[ DATA ]</ConsoleHeading>
          </div>

          {!collectResponse ? (
            <div className={`${colorScheme.primary} opacity-50 font-mono text-sm`}>
              [ Run start {'<board_id>'} command to load data ]
            </div>
          ) : basicBoardData ? (
            <div className="space-y-6">
              {/* Project Info */}
              {basicBoardData.projectName && (
                <div className={`flex items-center gap-3 pb-3 border-b ${colorScheme.border}/30`}>
                  <span className={`${colorScheme.secondary} font-mono text-lg font-bold`}>
                    {basicBoardData.projectName}
                  </span>
                  {basicBoardData.projectKey && (
                    <span className={`${colorScheme.primary} opacity-50 font-mono text-sm`}>
                      ({basicBoardData.projectKey})
                    </span>
                  )}
                </div>
              )}

              {/* No data warning */}
              {!hasData && (
                <div className="border border-yellow-500/50 bg-yellow-500/5 p-4">
                  <div className="text-yellow-500 font-mono text-sm mb-2">⚠️ Data not loaded</div>
                  <div className="text-yellow-500/70 font-mono text-xs space-y-1">
                    <p>Possible reasons:</p>
                    <ul className="list-disc list-inside pl-2">
                      <li>Jira not configured (check .env file)</li>
                      <li>Invalid Board ID</li>
                      <li>No access to board</li>
                      <li>No sprints on board</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Version Card */}
              <VersionCard version={basicBoardData.activeVersion} />

              {/* Two Sprint Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SprintCard
                  title="[ PREVIOUS SPRINT ]"
                  data={basicBoardData.previousSprint}
                  variant="previous"
                  overview={analysisResult?.sprintOverviews?.find(
                    o => o.sprintId === basicBoardData.previousSprint?.sprint.id
                  )?.text}
                />
                <SprintCard
                  title="[ CURRENT SPRINT ]"
                  data={basicBoardData.currentSprint}
                  variant="current"
                  overview={analysisResult?.sprintOverviews?.find(
                    o => o.sprintId === basicBoardData.currentSprint?.sprint.id
                  )?.text}
                />
              </div>

              {/* Availability Info */}
              <div className={`${colorScheme.primary} opacity-50 font-mono text-xs`}>
                Availability: Previous={basicBoardData.availability.hasPreviousSprint ? '✓' : '✗'},
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
                onGenerateExpertAnalysis={handleGenerateExpertAnalysis}
                expertAnalysis={expertAnalysis}
                isGeneratingExpert={isGeneratingExpert}
                selectedExpertRole={selectedExpertRole}
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
              <span className={`${colorScheme.primary.replace('-500', '-800')} group-hover:${colorScheme.primary.replace('-500', '-600')} transition-colors`}>ez</span>
              <span className="text-zinc-700 group-hover:text-zinc-500 transition-colors">report</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
