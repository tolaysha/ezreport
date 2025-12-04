'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SprintReportWorkflowParams, RunStepResponse } from '@/types/workflow';
import { runStep } from '@/lib/apiClient';
import {
  ConsolePanel,
  ConsoleHeading,
  ConsoleButton,
  ConsoleInput,
  ConsoleCheckbox,
  BackendStatus,
} from '@/components/console';

export default function Stage1Page() {
  const [response, setResponse] = useState<RunStepResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

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
    setError(null);

    try {
      const result = await runStep('collect', params);
      setResponse(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Collect step failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const result = response?.result;

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
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
            <span className="text-green-500 font-mono text-sm">Stage 1</span>
          </div>
          <ConsoleHeading level={1} className="mb-2">
            [STAGE 1] Сбор данных и валидация
          </ConsoleHeading>
          <p className="text-green-500 font-mono text-sm opacity-80">
            Сбор данных из Jira и оценка качества/полноты информации
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
              [ RUNNING STEP 1... ]
            </div>
          )}

          <ConsoleButton onClick={handleRunCollect} disabled={isRunning}>
            [RUN] Collect &amp; Validate Data
          </ConsoleButton>
        </ConsolePanel>

        {/* Results */}
        <ConsolePanel>
          <ConsoleHeading level={2} className="mb-4">
            [ РЕЗУЛЬТАТЫ ]
          </ConsoleHeading>

          {!response ? (
            <div className="text-green-500 font-mono text-sm">
              [ NO RESULTS YET ]
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sprint Info */}
              {result?.sprint && (
                <div className="border border-green-500/50 p-4">
                  <div className="text-green-400 font-mono text-sm mb-2">
                    SPRINT INFO:
                  </div>
                  {result.sprint.name && (
                    <div className="font-mono text-sm text-green-500">
                      SPRINT: {result.sprint.name}
                    </div>
                  )}
                  {result.sprint.id && (
                    <div className="font-mono text-sm text-green-500">
                      ID: {result.sprint.id}
                    </div>
                  )}
                  {(result.sprint.startDate || result.sprint.endDate) && (
                    <div className="font-mono text-sm text-green-500">
                      DATES: {result.sprint.startDate || '?'} -{' '}
                      {result.sprint.endDate || '?'}
                    </div>
                  )}
                  {result.sprint.goal && (
                    <div className="font-mono text-sm text-green-500">
                      GOAL: {result.sprint.goal}
                    </div>
                  )}
                </div>
              )}

              {/* Data Validation */}
              {result?.dataValidation && (
                <div className="border border-green-500/50 p-4">
                  <div className="text-green-400 font-mono text-sm mb-2">
                    DATA VALIDATION:
                  </div>
                  <div className="font-mono text-sm mb-2">
                    <span className="text-green-500">DATA_VALID: </span>
                    <span
                      className={
                        result.dataValidation.isValid
                          ? 'text-green-400'
                          : 'text-red-500'
                      }
                    >
                      {result.dataValidation.isValid ? 'YES' : 'NO'}
                    </span>
                  </div>
                  {result.dataValidation.goalIssueMatchLevel && (
                    <div className="font-mono text-sm mb-2">
                      <span className="text-green-500">GOAL_MATCH: </span>
                      <span
                        className={
                          result.dataValidation.goalIssueMatchLevel === 'strong'
                            ? 'text-green-400'
                            : result.dataValidation.goalIssueMatchLevel ===
                                'medium'
                              ? 'text-yellow-500'
                              : 'text-red-500'
                        }
                      >
                        {result.dataValidation.goalIssueMatchLevel}
                      </span>
                    </div>
                  )}
                  {result.dataValidation.goalIssueMatchComment && (
                    <div className="font-mono text-sm mb-2 text-green-500/80 whitespace-pre-wrap">
                      {result.dataValidation.goalIssueMatchComment}
                    </div>
                  )}

                  {result.dataValidation.errors.length > 0 && (
                    <div className="mt-3">
                      <div className="text-red-500 font-mono text-sm mb-1">
                        ERRORS:
                      </div>
                      {result.dataValidation.errors.map((err, idx) => (
                        <div key={idx} className="text-red-500 font-mono text-sm">
                          [ERROR] ({err.code || 'no-code'}) {err.message}
                          {err.details && ` - ${err.details}`}
                        </div>
                      ))}
                    </div>
                  )}

                  {result.dataValidation.warnings.length > 0 && (
                    <div className="mt-3">
                      <div className="text-yellow-500 font-mono text-sm mb-1">
                        WARNINGS:
                      </div>
                      {result.dataValidation.warnings.map((warn, idx) => (
                        <div
                          key={idx}
                          className="text-yellow-500 font-mono text-sm"
                        >
                          [WARN] ({warn.code || 'no-code'}) {warn.message}
                          {warn.details && ` - ${warn.details}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!result?.sprint && !result?.dataValidation && (
                <div className="font-mono text-sm text-gray-500">
                  [ No data available ]
                </div>
              )}
            </div>
          )}

          {/* Raw JSON Toggle */}
          <div className="mt-6 pt-4 border-t border-green-500/30">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-green-500 font-mono text-sm hover:text-green-300 transition-colors"
            >
              [Toggle Raw JSON]
            </button>
            {showRawJson && response && (
              <div className="mt-4 border border-green-500/50 p-4 overflow-auto max-h-96">
                <pre className="font-mono text-xs text-green-500">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </ConsolePanel>

        {/* Navigation to Stage 2 */}
        {result?.dataValidation?.isValid && (
          <div className="mt-8 text-center">
            <Link
              href="/stage-2"
              className="inline-block border border-green-500 text-green-500 px-6 py-3 font-mono hover:bg-green-500 hover:text-black transition-colors"
            >
              [NEXT] Перейти к Stage 2 — Генерация отчёта →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

