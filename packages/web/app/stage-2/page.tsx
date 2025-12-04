'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SprintReportWorkflowParams, RunStepResponse } from '@/types/workflow';
import { runStep } from '@/lib/apiClient';
import { REPORT_BLOCKS, ReportBlockConfig } from '@/lib/blocksConfig';
import {
  ConsolePanel,
  ConsoleHeading,
  ConsoleButton,
  ConsoleInput,
  ConsoleCheckbox,
  BackendStatus,
} from '@/components/console';
import { Accordion } from '@/components/Accordion';

export default function Stage2Page() {
  const [collectResponse, setCollectResponse] = useState<RunStepResponse | null>(
    null
  );
  const [generateResponse, setGenerateResponse] =
    useState<RunStepResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runningStep, setRunningStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Form state - defaults for "toys" project
  const [sprintId, setSprintId] = useState('');
  const [sprintName, setSprintName] = useState('toys');
  const [boardId, setBoardId] = useState('toys');
  const [mockMode, setMockMode] = useState(true);
  const [extraJson, setExtraJson] = useState('');
  const [extraJsonError, setExtraJsonError] = useState('');
  const [showExtraJson, setShowExtraJson] = useState(false);

  const buildParams = (): SprintReportWorkflowParams | null => {
    const params: SprintReportWorkflowParams = {
      mockMode,
    };

    if (sprintId.trim()) params.sprintId = sprintId.trim();
    if (sprintName.trim()) params.sprintName = sprintName.trim();
    if (boardId.trim()) params.boardId = boardId.trim();

    if (extraJson.trim()) {
      try {
        const parsed = JSON.parse(extraJson);
        params.extra = parsed;
        setExtraJsonError('');
      } catch {
        setExtraJsonError('Parse error: invalid JSON');
        return null;
      }
    }

    return params;
  };

  const handleRunCollect = async () => {
    const params = buildParams();
    if (!params) return;

    setIsRunning(true);
    setRunningStep('collect');
    setError(null);

    try {
      const result = await runStep('collect', params);
      setCollectResponse(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Collect step failed:', err);
    } finally {
      setIsRunning(false);
      setRunningStep(null);
    }
  };

  const handleRunGenerate = async () => {
    const params = buildParams();
    if (!params) return;

    setIsRunning(true);
    setRunningStep('generate');
    setError(null);

    try {
      const result = await runStep('generate', params);
      setGenerateResponse(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Generate step failed:', err);
    } finally {
      setIsRunning(false);
      setRunningStep(null);
    }
  };

  const handleBlockGo = async () => {
    // For now, all blocks trigger the same generate call
    await handleRunGenerate();
  };

  // Use the latest result for display (generate takes priority)
  const latestResult = generateResponse?.result || collectResponse?.result;
  const latestResponse = generateResponse || collectResponse;

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
            <span className="text-green-500 font-mono text-sm">Stage 2</span>
          </div>
          <ConsoleHeading level={1} className="mb-2">
            [STAGE 2] Генерация отчёта по блокам
          </ConsoleHeading>
          <p className="text-green-500 font-mono text-sm opacity-80">
            Пошаговая генерация каждого блока отчёта с просмотром промптов и
            входных данных
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
              label="Sprint ID:"
              value={sprintId}
              onChange={setSprintId}
              disabled={isRunning}
              placeholder="e.g., 12345"
            />

            <ConsoleInput
              label="Sprint Name:"
              value={sprintName}
              onChange={setSprintName}
              disabled={isRunning}
              placeholder="e.g., Sprint 42"
            />

            <ConsoleInput
              label="Board ID:"
              value={boardId}
              onChange={setBoardId}
              disabled={isRunning}
              placeholder="e.g., board-123"
            />

            <ConsoleCheckbox
              label="MOCK_MODE"
              checked={mockMode}
              onChange={setMockMode}
              disabled={isRunning}
            />

            <div>
              <button
                onClick={() => setShowExtraJson(!showExtraJson)}
                disabled={isRunning}
                className="flex items-center text-green-500 font-mono text-sm hover:text-green-300 transition-colors disabled:opacity-50"
              >
                <ChevronRight
                  className={`w-4 h-4 mr-1 transition-transform ${showExtraJson ? 'rotate-90' : ''}`}
                />
                Extra JSON params
              </button>
              {showExtraJson && (
                <div className="mt-2">
                  <ConsoleInput
                    label=""
                    value={extraJson}
                    onChange={setExtraJson}
                    disabled={isRunning}
                    placeholder='{"key": "value"}'
                    type="textarea"
                  />
                  {extraJsonError && (
                    <div className="text-red-500 font-mono text-xs mt-1">
                      {extraJsonError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {isRunning && (
            <div className="mb-4 text-green-500 font-mono text-sm animate-pulse">
              {runningStep === 'collect'
                ? '[ RUNNING STEP 1 (COLLECT)... ]'
                : '[ RUNNING GENERATE... ]'}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <ConsoleButton
              onClick={handleRunCollect}
              disabled={isRunning}
              variant="secondary"
            >
              [RUN STEP 1 FIRST]
            </ConsoleButton>
            <ConsoleButton onClick={handleRunGenerate} disabled={isRunning}>
              [RUN GENERATION FOR ALL BLOCKS]
            </ConsoleButton>
          </div>
        </ConsolePanel>

        {/* Block Cards */}
        <div className="mb-8">
          <ConsoleHeading level={2} className="mb-4">
            [ БЛОКИ ОТЧЁТА ]
          </ConsoleHeading>

          <div className="space-y-4">
            {REPORT_BLOCKS.map((block) => (
              <BlockCard
                key={block.id}
                block={block}
                result={latestResult}
                onGo={handleBlockGo}
                isRunning={isRunning}
              />
            ))}
          </div>
        </div>

        {/* Logs & Raw JSON */}
        <ConsolePanel>
          <ConsoleHeading level={2} className="mb-4">
            [ ОТЛАДКА ]
          </ConsoleHeading>

          {/* Logs */}
          <div className="mb-4">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center text-green-500 font-mono text-sm hover:text-green-300 transition-colors"
            >
              <ChevronRight
                className={`w-4 h-4 mr-1 transition-transform ${showLogs ? 'rotate-90' : ''}`}
              />
              Logs
            </button>
            {showLogs && latestResponse?.logs && latestResponse.logs.length > 0 && (
              <div className="mt-2 border border-green-500/50 p-4 max-h-60 overflow-auto">
                <div className="space-y-1">
                  {latestResponse.logs.map((log, idx) => (
                    <div key={idx} className="font-mono text-xs text-green-500">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {showLogs &&
              (!latestResponse?.logs || latestResponse.logs.length === 0) && (
                <div className="mt-2 text-green-500/50 font-mono text-sm">
                  [ No logs ]
                </div>
              )}
          </div>

          {/* Raw JSON */}
          <div>
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="flex items-center text-green-500 font-mono text-sm hover:text-green-300 transition-colors"
            >
              <ChevronRight
                className={`w-4 h-4 mr-1 transition-transform ${showRawJson ? 'rotate-90' : ''}`}
              />
              Raw JSON
            </button>
            {showRawJson && latestResponse && (
              <div className="mt-2 border border-green-500/50 p-4 overflow-auto max-h-96">
                <pre className="font-mono text-xs text-green-500">
                  {JSON.stringify(latestResponse, null, 2)}
                </pre>
              </div>
            )}
            {showRawJson && !latestResponse && (
              <div className="mt-2 text-green-500/50 font-mono text-sm">
                [ No data ]
              </div>
            )}
          </div>
        </ConsolePanel>

        {/* Navigation to Stage 3 */}
        {latestResult?.report && (
          <div className="mt-8 text-center">
            <Link
              href="/stage-3"
              className="inline-block border border-green-500 text-green-500 px-6 py-3 font-mono hover:bg-green-500 hover:text-black transition-colors"
            >
              [NEXT] Перейти к Stage 3 — Финальная валидация →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface BlockCardProps {
  block: ReportBlockConfig;
  result: RunStepResponse['result'] | undefined;
  onGo: () => void;
  isRunning: boolean;
}

function BlockCard({ block, result, onGo, isRunning }: BlockCardProps) {
  const inputPreview = block.getInputPreview(result ?? null);
  const blockText = block.getBlockText(result?.report ?? null);

  return (
    <Accordion title={`[BLOCK] ${block.title}`}>
      <div className="space-y-4">
        {/* Description */}
        <div className="text-green-500/70 font-mono text-sm">
          {block.description}
        </div>

        {/* Prompt */}
        <div>
          <div className="text-green-400 font-mono text-xs mb-1">PROMPT:</div>
          <pre className="font-mono text-xs text-green-500 bg-green-950/30 p-3 rounded whitespace-pre-wrap border border-green-500/30">
            {block.promptTemplate}
          </pre>
        </div>

        {/* Input Data Preview */}
        <div>
          <div className="text-green-400 font-mono text-xs mb-1">
            INPUT DATA (preview):
          </div>
          <pre className="font-mono text-xs text-green-500 bg-green-950/30 p-3 rounded whitespace-pre-wrap border border-green-500/30 max-h-40 overflow-auto">
            {JSON.stringify(inputPreview, null, 2)}
          </pre>
        </div>

        {/* Result */}
        <div>
          <div className="text-green-400 font-mono text-xs mb-1">RESULT:</div>
          <pre className="font-mono text-xs text-green-500 bg-green-950/30 p-3 rounded whitespace-pre-wrap border border-green-500/30 max-h-60 overflow-auto">
            {blockText || '<no data yet>'}
          </pre>
        </div>

        {/* Go Button */}
        <div className="pt-2">
          <ConsoleButton
            onClick={onGo}
            disabled={isRunning}
            variant="secondary"
            className="text-sm px-3 py-2"
          >
            [Go] Сгенерировать
          </ConsoleButton>
        </div>
      </div>
    </Accordion>
  );
}

