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

export default function Stage3Page() {
  const [response, setResponse] = useState<RunStepResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runningStep, setRunningStep] = useState<string | null>(null);
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

  const handleRunFull = async () => {
    const params = buildParams();
    if (!params) return;

    setIsRunning(true);
    setRunningStep('full');
    setError(null);

    try {
      const result = await runStep('full', params);
      setResponse(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Full workflow failed:', err);
    } finally {
      setIsRunning(false);
      setRunningStep(null);
    }
  };

  const handleRunValidate = async () => {
    const params = buildParams();
    if (!params) return;

    setIsRunning(true);
    setRunningStep('validate');
    setError(null);

    try {
      const result = await runStep('validate', params);
      setResponse(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Validate step failed:', err);
    } finally {
      setIsRunning(false);
      setRunningStep(null);
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
            <span className="text-green-500 font-mono text-sm">Stage 3</span>
          </div>
          <ConsoleHeading level={1} className="mb-2">
            [STAGE 3] Финальная валидация
          </ConsoleHeading>
          <p className="text-green-500 font-mono text-sm opacity-80">
            Проверка полного отчёта по правилам и готовность для партнёра
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
              {runningStep === 'full'
                ? '[ RUNNING FULL WORKFLOW... ]'
                : '[ RUNNING VALIDATION... ]'}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <ConsoleButton onClick={handleRunFull} disabled={isRunning}>
              [RUN FULL WORKFLOW]
            </ConsoleButton>
            <ConsoleButton
              onClick={handleRunValidate}
              disabled={isRunning}
              variant="secondary"
            >
              [RUN ONLY VALIDATION]
            </ConsoleButton>
          </div>
        </ConsolePanel>

        {/* Validation Results */}
        <ConsolePanel>
          <ConsoleHeading level={2} className="mb-4">
            [ РЕЗУЛЬТАТЫ ВАЛИДАЦИИ ]
          </ConsoleHeading>

          {!response ? (
            <div className="text-green-500 font-mono text-sm">
              [ NO RESULTS YET ]
            </div>
          ) : (
            <div className="space-y-6">
              {/* Report Validation */}
              {result?.reportValidation && (
                <div className="border border-green-500/50 p-4">
                  <div className="text-green-400 font-mono text-sm mb-3">
                    REPORT VALIDATION:
                  </div>

                  <div className="font-mono text-sm mb-3">
                    <span className="text-green-500">REPORT_VALID: </span>
                    <span
                      className={
                        result.reportValidation.isValid
                          ? 'text-green-400'
                          : 'text-red-500'
                      }
                    >
                      {result.reportValidation.isValid ? 'YES' : 'NO'}
                    </span>
                  </div>

                  {result.reportValidation.errors.length > 0 && (
                    <div className="mb-3">
                      <div className="text-red-500 font-mono text-sm mb-1">
                        ERRORS:
                      </div>
                      {result.reportValidation.errors.map((err, idx) => (
                        <div key={idx} className="text-red-500 font-mono text-sm">
                          [ERROR] ({err.code || 'no-code'}) {err.message}
                          {err.details && ` - ${err.details}`}
                        </div>
                      ))}
                    </div>
                  )}

                  {result.reportValidation.warnings.length > 0 && (
                    <div className="mb-3">
                      <div className="text-yellow-500 font-mono text-sm mb-1">
                        WARNINGS:
                      </div>
                      {result.reportValidation.warnings.map((warn, idx) => (
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

                  {result.reportValidation.partnerReadiness && (
                    <div className="mt-4 pt-3 border-t border-green-500/30">
                      <div className="font-mono text-sm mb-2">
                        <span className="text-green-500">PARTNER_READY: </span>
                        <span
                          className={
                            result.reportValidation.partnerReadiness.isPartnerReady
                              ? 'text-green-400'
                              : 'text-yellow-500'
                          }
                        >
                          {result.reportValidation.partnerReadiness.isPartnerReady
                            ? 'YES'
                            : 'NO'}
                        </span>
                      </div>
                      {result.reportValidation.partnerReadiness.comments &&
                        result.reportValidation.partnerReadiness.comments.length >
                          0 && (
                          <div className="mt-2">
                            <div className="text-green-500/70 font-mono text-sm mb-1">
                              COMMENTS:
                            </div>
                            {result.reportValidation.partnerReadiness.comments.map(
                              (comment, idx) => (
                                <div
                                  key={idx}
                                  className="font-mono text-sm text-green-500/80"
                                >
                                  - {comment}
                                </div>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

              {/* Sprint Summary (optional) */}
              {result?.sprint && (
                <div className="border border-green-500/50 p-4">
                  <div className="text-green-400 font-mono text-sm mb-2">
                    SPRINT SUMMARY:
                  </div>
                  {result.sprint.name && (
                    <div className="font-mono text-sm text-green-500">
                      SPRINT: {result.sprint.name}
                    </div>
                  )}
                  {(result.sprint.startDate || result.sprint.endDate) && (
                    <div className="font-mono text-sm text-green-500">
                      DATES: {result.sprint.startDate || '?'} -{' '}
                      {result.sprint.endDate || '?'}
                    </div>
                  )}
                </div>
              )}

              {/* Report Summary (optional) */}
              {result?.report && (
                <div className="border border-green-500/50 p-4">
                  <div className="text-green-400 font-mono text-sm mb-2">
                    REPORT SUMMARY:
                  </div>
                  <div className="font-mono text-xs text-green-500/80">
                    {result.report.overview
                      ? `Overview: ${result.report.overview.substring(0, 150)}...`
                      : '[ No overview ]'}
                  </div>
                </div>
              )}

              {/* Notion Page Link */}
              {result?.notionPage?.url && (
                <div className="border border-green-500/50 p-4">
                  <div className="text-green-400 font-mono text-sm mb-2">
                    NOTION PAGE:
                  </div>
                  <a
                    href={result.notionPage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-green-300 hover:text-green-100 underline"
                  >
                    {result.notionPage.url}
                  </a>
                </div>
              )}

              {!result?.reportValidation && (
                <div className="font-mono text-sm text-gray-500">
                  [ No validation results ]
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

        {/* Success Message */}
        {result?.reportValidation?.isValid &&
          result?.reportValidation?.partnerReadiness?.isPartnerReady && (
            <div className="mt-8 border border-green-500 bg-green-950/30 p-6 text-center">
              <div className="text-green-400 font-mono text-lg mb-2">
                ✓ ОТЧЁТ ГОТОВ К ОТПРАВКЕ ПАРТНЁРУ
              </div>
              <p className="text-green-500 font-mono text-sm">
                Все проверки пройдены. Отчёт можно отправлять.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}

