'use client';

import { useState } from 'react';
import { RunStepResponse } from '@/types/workflow';
import { Accordion } from './Accordion';

interface ResultsPanelProps {
  response: RunStepResponse | null;
}

export function ResultsPanel({ response }: ResultsPanelProps) {
  const [showRawJson, setShowRawJson] = useState(false);

  if (!response) {
    return (
      <div className="border border-green-500 p-6 bg-black shadow-[0_0_10px_rgba(0,255,0,0.3)]">
        <div className="text-green-500 font-mono text-sm">
          [ NO RESULTS YET ]
        </div>
      </div>
    );
  }

  const result = response.result;

  return (
    <div className="border border-green-500 p-6 bg-black shadow-[0_0_10px_rgba(0,255,0,0.3)]">
      <div className="text-green-500 font-mono text-sm mb-4">
        [ LAST EXECUTED: {response.step.toUpperCase()} ]
      </div>

      <Accordion title="[STEP 1] Data & Validation" defaultOpen={true}>
        {result?.sprint && (
          <div className="mb-4">
            <div className="text-green-400 font-mono text-sm mb-2">SPRINT INFO:</div>
            {result.sprint.name && (
              <div className="font-mono text-sm">SPRINT: {result.sprint.name}</div>
            )}
            {result.sprint.id && (
              <div className="font-mono text-sm">ID: {result.sprint.id}</div>
            )}
            {(result.sprint.startDate || result.sprint.endDate) && (
              <div className="font-mono text-sm">
                DATES: {result.sprint.startDate || '?'} - {result.sprint.endDate || '?'}
              </div>
            )}
            {result.sprint.goal && (
              <div className="font-mono text-sm">GOAL: {result.sprint.goal}</div>
            )}
          </div>
        )}

        {result?.dataValidation && (
          <div>
            <div className="text-green-400 font-mono text-sm mb-2">DATA VALIDATION:</div>
            <div className="font-mono text-sm mb-2">
              DATA_VALID: {result.dataValidation.isValid ? 'YES' : 'NO'}
            </div>
            {result.dataValidation.goalIssueMatchLevel && (
              <div className="font-mono text-sm mb-2">
                GOAL_MATCH: {result.dataValidation.goalIssueMatchLevel}
              </div>
            )}
            {result.dataValidation.goalIssueMatchComment && (
              <div className="font-mono text-sm mb-2 whitespace-pre-wrap">
                {result.dataValidation.goalIssueMatchComment}
              </div>
            )}
            {result.dataValidation.errors.length > 0 && (
              <div className="mt-2">
                <div className="text-red-500 font-mono text-sm mb-1">ERRORS:</div>
                {result.dataValidation.errors.map((err, idx) => (
                  <div key={idx} className="text-red-500 font-mono text-sm">
                    [ERROR] ({err.code || 'no-code'}) {err.message}
                    {err.details && ` - ${err.details}`}
                  </div>
                ))}
              </div>
            )}
            {result.dataValidation.warnings.length > 0 && (
              <div className="mt-2">
                <div className="text-yellow-500 font-mono text-sm mb-1">WARNINGS:</div>
                {result.dataValidation.warnings.map((warn, idx) => (
                  <div key={idx} className="text-yellow-500 font-mono text-sm">
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
      </Accordion>

      <Accordion title="[STEP 2] Generated Report">
        {result?.report ? (
          <div className="space-y-4">
            {result.report.overview && (
              <div>
                <div className="text-green-400 font-mono text-sm mb-1">== Overview ==</div>
                <pre className="font-mono text-sm whitespace-pre-wrap">{result.report.overview}</pre>
              </div>
            )}
            {result.report.notDone && (
              <div>
                <div className="text-green-400 font-mono text-sm mb-1">== Not Done ==</div>
                <pre className="font-mono text-sm whitespace-pre-wrap">{result.report.notDone}</pre>
              </div>
            )}
            {result.report.achievements && (
              <div>
                <div className="text-green-400 font-mono text-sm mb-1">== Achievements ==</div>
                <pre className="font-mono text-sm whitespace-pre-wrap">{result.report.achievements}</pre>
              </div>
            )}
            {result.report.artifacts && (
              <div>
                <div className="text-green-400 font-mono text-sm mb-1">== Artifacts ==</div>
                <pre className="font-mono text-sm whitespace-pre-wrap">{result.report.artifacts}</pre>
              </div>
            )}
            {result.report.nextSprint && (
              <div>
                <div className="text-green-400 font-mono text-sm mb-1">== Next Sprint ==</div>
                <pre className="font-mono text-sm whitespace-pre-wrap">{result.report.nextSprint}</pre>
              </div>
            )}
            {result.report.blockers && (
              <div>
                <div className="text-green-400 font-mono text-sm mb-1">== Blockers ==</div>
                <pre className="font-mono text-sm whitespace-pre-wrap">{result.report.blockers}</pre>
              </div>
            )}
            {result.report.pmQuestions && (
              <div>
                <div className="text-green-400 font-mono text-sm mb-1">== PM Questions ==</div>
                <pre className="font-mono text-sm whitespace-pre-wrap">{result.report.pmQuestions}</pre>
              </div>
            )}
          </div>
        ) : (
          <div className="font-mono text-sm text-gray-500">
            [ No report generated ]
          </div>
        )}
      </Accordion>

      <Accordion title="[STEP 3] Final Validation">
        {result?.reportValidation ? (
          <div>
            <div className="font-mono text-sm mb-2">
              REPORT_VALID: {result.reportValidation.isValid ? 'YES' : 'NO'}
            </div>
            {result.reportValidation.errors.length > 0 && (
              <div className="mt-2">
                <div className="text-red-500 font-mono text-sm mb-1">ERRORS:</div>
                {result.reportValidation.errors.map((err, idx) => (
                  <div key={idx} className="text-red-500 font-mono text-sm">
                    [ERROR] ({err.code || 'no-code'}) {err.message}
                    {err.details && ` - ${err.details}`}
                  </div>
                ))}
              </div>
            )}
            {result.reportValidation.warnings.length > 0 && (
              <div className="mt-2">
                <div className="text-yellow-500 font-mono text-sm mb-1">WARNINGS:</div>
                {result.reportValidation.warnings.map((warn, idx) => (
                  <div key={idx} className="text-yellow-500 font-mono text-sm">
                    [WARN] ({warn.code || 'no-code'}) {warn.message}
                    {warn.details && ` - ${warn.details}`}
                  </div>
                ))}
              </div>
            )}
            {result.reportValidation.partnerReadiness && (
              <div className="mt-2">
                <div className="font-mono text-sm mb-1">
                  PARTNER_READY:{' '}
                  {result.reportValidation.partnerReadiness.isPartnerReady ? 'YES' : 'NO'}
                </div>
                {result.reportValidation.partnerReadiness.comments &&
                  result.reportValidation.partnerReadiness.comments.length > 0 && (
                    <div className="mt-1">
                      {result.reportValidation.partnerReadiness.comments.map((comment, idx) => (
                        <div key={idx} className="font-mono text-sm">
                          - {comment}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>
        ) : (
          <div className="font-mono text-sm text-gray-500">
            [ No validation results ]
          </div>
        )}
      </Accordion>

      {result?.notionPage && (
        <div className="border border-green-500 p-4 mt-4">
          <div className="text-green-400 font-mono text-sm mb-2">NOTION PAGE:</div>
          {result.notionPage.id && (
            <div className="font-mono text-sm">ID: {result.notionPage.id}</div>
          )}
          {result.notionPage.url && (
            <div className="font-mono text-sm">
              URL:{' '}
              <a
                href={result.notionPage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-300 hover:text-green-100 underline"
              >
                {result.notionPage.url}
              </a>
            </div>
          )}
        </div>
      )}

      {response.logs && response.logs.length > 0 && (
        <div className="border border-green-500 p-4 mt-4">
          <div className="text-green-400 font-mono text-sm mb-2">LOGS:</div>
          <div className="space-y-1">
            {response.logs.map((log, idx) => (
              <div key={idx} className="font-mono text-xs">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="border border-green-500 text-green-500 px-4 py-2 font-mono hover:bg-green-500 hover:text-black transition-colors text-sm"
        >
          [Toggle Raw JSON]
        </button>
        {showRawJson && (
          <div className="mt-4 border border-green-500 p-4 overflow-auto max-h-96">
            <pre className="font-mono text-xs text-green-500">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
