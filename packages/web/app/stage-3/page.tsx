'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SprintReportParams, GenerateReportResponse } from '@/types/workflow';
import { generateReport } from '@/lib/apiClient';
import {
  ConsolePanel,
  ConsoleHeading,
  ConsoleButton,
  ConsoleInput,
  ConsoleCheckbox,
  BackendStatus,
} from '@/components/console';

export default function Stage3Page() {
  const [response, setResponse] = useState<GenerateReportResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // Form state
  const [boardId, setBoardId] = useState('133');
  const [mockMode, setMockMode] = useState(false);

  const buildParams = (): SprintReportParams => {
    return {
      boardId: boardId.trim() || undefined,
      mockMode,
    };
  };

  const handleGenerateReport = async () => {
    const params = buildParams();

    setIsRunning(true);
    setError(null);

    try {
      const result = await generateReport(params);
      setResponse(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Generate report failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

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
              label="Board ID:"
              value={boardId}
              onChange={setBoardId}
              disabled={isRunning}
              placeholder="e.g., 133"
            />

            <ConsoleCheckbox
              label="MOCK_MODE"
              checked={mockMode}
              onChange={setMockMode}
              disabled={isRunning}
            />
          </div>

          {isRunning && (
            <div className="mb-4 text-green-500 font-mono text-sm animate-pulse">
              [ ГЕНЕРАЦИЯ ОТЧЁТА... ]
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <ConsoleButton onClick={handleGenerateReport} disabled={isRunning}>
              [СГЕНЕРИРОВАТЬ ОТЧЁТ]
            </ConsoleButton>
          </div>
        </ConsolePanel>

        {/* Validation Results */}
        <ConsolePanel>
          <ConsoleHeading level={2} className="mb-4">
            [ РЕЗУЛЬТАТЫ ВАЛИДАЦИИ ]
          </ConsoleHeading>

          {!response ? (
            <div className="text-green-500/50 font-mono text-sm">
              [ Запустите генерацию для получения результатов ]
            </div>
          ) : (
            <div className="space-y-6">
              {/* Report Validation */}
              {response.reportValidation && (
                <div className="border border-green-500/50 p-4">
                  <div className="text-green-400 font-mono text-sm mb-3">
                    REPORT VALIDATION:
                  </div>

                  <div className="font-mono text-sm mb-3">
                    <span className="text-green-500">REPORT_VALID: </span>
                    <span
                      className={
                        response.reportValidation.isValid
                          ? 'text-green-400'
                          : 'text-red-500'
                      }
                    >
                      {response.reportValidation.isValid ? 'YES' : 'NO'}
                    </span>
                  </div>

                  {response.reportValidation.errors.length > 0 && (
                    <div className="mb-3">
                      <div className="text-red-500 font-mono text-sm mb-1">
                        ERRORS:
                      </div>
                      {response.reportValidation.errors.map((err, idx) => (
                        <div key={idx} className="text-red-500 font-mono text-sm">
                          [ERROR] ({err.code || 'no-code'}) {err.message}
                          {err.details && ` - ${err.details}`}
                        </div>
                      ))}
                    </div>
                  )}

                  {response.reportValidation.warnings.length > 0 && (
                    <div className="mb-3">
                      <div className="text-yellow-500 font-mono text-sm mb-1">
                        WARNINGS:
                      </div>
                      {response.reportValidation.warnings.map((warn, idx) => (
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

                  {response.reportValidation.partnerReadiness && (
                    <div className="mt-4 pt-3 border-t border-green-500/30">
                      <div className="font-mono text-sm mb-2">
                        <span className="text-green-500">PARTNER_READY: </span>
                        <span
                          className={
                            response.reportValidation.partnerReadiness.isPartnerReady
                              ? 'text-green-400'
                              : 'text-yellow-500'
                          }
                        >
                          {response.reportValidation.partnerReadiness.isPartnerReady
                            ? 'YES'
                            : 'NO'}
                        </span>
                      </div>
                      {response.reportValidation.partnerReadiness.comments &&
                        response.reportValidation.partnerReadiness.comments.length >
                          0 && (
                          <div className="mt-2">
                            <div className="text-green-500/70 font-mono text-sm mb-1">
                              COMMENTS:
                            </div>
                            {response.reportValidation.partnerReadiness.comments.map(
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

              {/* Sprint Summary */}
              {response.sprint && (
                <div className="border border-green-500/50 p-4">
                  <div className="text-green-400 font-mono text-sm mb-2">
                    SPRINT SUMMARY:
                  </div>
                  {response.sprint.name && (
                    <div className="font-mono text-sm text-green-500">
                      SPRINT: {response.sprint.name}
                    </div>
                  )}
                  {(response.sprint.startDate || response.sprint.endDate) && (
                    <div className="font-mono text-sm text-green-500">
                      DATES: {response.sprint.startDate || '?'} -{' '}
                      {response.sprint.endDate || '?'}
                    </div>
                  )}
                </div>
              )}

              {/* Report Summary */}
              {response.report && (
                <div className="border border-green-500/50 p-4">
                  <div className="text-green-400 font-mono text-sm mb-2">
                    REPORT SUMMARY:
                  </div>
                  <div className="font-mono text-xs text-green-500/80">
                    {response.report.overview
                      ? `Overview: ${response.report.overview.substring(0, 150)}...`
                      : '[ No overview ]'}
                  </div>
                </div>
              )}

              {/* Notion Page Link */}
              {response.notionPage?.url && (
                <div className="border border-green-500/50 p-4">
                  <div className="text-green-400 font-mono text-sm mb-2">
                    NOTION PAGE:
                  </div>
                  <a
                    href={response.notionPage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-green-300 hover:text-green-100 underline"
                  >
                    {response.notionPage.url}
                  </a>
                </div>
              )}

              {!response.reportValidation && !response.report && (
                <div className="border border-yellow-500/50 bg-yellow-500/5 p-4">
                  <div className="text-yellow-500 font-mono text-sm mb-2">
                    ⚠️ Нет данных для валидации
                  </div>
                  <div className="text-yellow-500/70 font-mono text-xs space-y-1">
                    <p>Возможные причины:</p>
                    <ul className="list-disc list-inside pl-2">
                      <li>Jira не настроен (проверьте .env файл)</li>
                      <li>OpenAI не настроен</li>
                      <li>Отчёт не был сгенерирован</li>
                    </ul>
                    <p className="mt-2">Включите Mock Mode для тестирования без внешних сервисов.</p>
                  </div>
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
        {response?.reportValidation?.isValid &&
          response?.reportValidation?.partnerReadiness?.isPartnerReady && (
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
