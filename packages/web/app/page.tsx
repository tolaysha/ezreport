'use client';

import { useState } from 'react';
import { WorkflowStep, SprintReportWorkflowParams, RunStepResponse } from '@/types/workflow';
import { runStep } from '@/lib/apiClient';
import { ControlPanel } from '@/components/ControlPanel';
import { ResultsPanel } from '@/components/ResultsPanel';

export default function Home() {
  const [response, setResponse] = useState<RunStepResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunStep = async (step: WorkflowStep, params: SprintReportWorkflowParams) => {
    setIsRunning(true);
    setError(null);

    try {
      const result = await runStep(step, params);
      setResponse(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Workflow step failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 border-b border-green-500 pb-4">
          <h1 className="text-green-500 font-mono text-2xl md:text-3xl mb-2">
            EzReport Web Console
          </h1>
          <p className="text-green-500 font-mono text-sm opacity-80">
            Sprint Report Workflow Control Panel
          </p>
        </div>

        {error && (
          <div className="mb-6 border border-red-500 bg-black p-4">
            <div className="text-red-500 font-mono text-sm">
              [ERROR] {error}
            </div>
          </div>
        )}

        <div className="space-y-8">
          <div>
            <h2 className="text-green-500 font-mono text-xl mb-4">
              [ CONTROL PANEL ]
            </h2>
            <ControlPanel onRunStep={handleRunStep} isRunning={isRunning} />
          </div>

          <div>
            <h2 className="text-green-500 font-mono text-xl mb-4">
              [ RESULTS ]
            </h2>
            <ResultsPanel response={response} />
          </div>
        </div>
      </div>
    </div>
  );
}
