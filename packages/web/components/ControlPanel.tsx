'use client';

import { useState, useEffect } from 'react';
import { WorkflowStep, SprintReportWorkflowParams } from '@/types/workflow';
import { ping } from '@/lib/apiClient';
import { ChevronRight } from 'lucide-react';

interface ControlPanelProps {
  onRunStep: (step: WorkflowStep, params: SprintReportWorkflowParams) => void;
  isRunning: boolean;
}

export function ControlPanel({ onRunStep, isRunning }: ControlPanelProps) {
  const [sprintId, setSprintId] = useState('');
  const [sprintName, setSprintName] = useState('');
  const [boardId, setBoardId] = useState('');
  const [mockMode, setMockMode] = useState(false);
  const [extraJson, setExtraJson] = useState('');
  const [extraJsonError, setExtraJsonError] = useState('');
  const [showExtraJson, setShowExtraJson] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    const checkBackend = async () => {
      const isOnline = await ping();
      setBackendStatus(isOnline ? 'online' : 'offline');
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

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
      } catch (e) {
        setExtraJsonError('Parse error: invalid JSON');
        return null;
      }
    }

    return params;
  };

  const handleRunStep = (step: WorkflowStep) => {
    const params = buildParams();
    if (params !== null) {
      onRunStep(step, params);
    }
  };

  return (
    <div className="border border-green-500 p-6 bg-black shadow-[0_0_10px_rgba(0,255,0,0.3)]">
      <div className="mb-6">
        <div className="text-green-500 font-mono text-sm mb-2">
          {backendStatus === 'checking' && '[BACKEND: CHECKING...]'}
          {backendStatus === 'online' && '[BACKEND: ONLINE]'}
          {backendStatus === 'offline' && <span className="text-red-500">[BACKEND: OFFLINE]</span>}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-green-500 font-mono text-sm mb-1">
            Sprint ID:
          </label>
          <input
            type="text"
            value={sprintId}
            onChange={(e) => setSprintId(e.target.value)}
            disabled={isRunning}
            className="w-full bg-black border border-green-500 text-green-500 px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
            placeholder="e.g., 12345"
          />
        </div>

        <div>
          <label className="block text-green-500 font-mono text-sm mb-1">
            Sprint Name:
          </label>
          <input
            type="text"
            value={sprintName}
            onChange={(e) => setSprintName(e.target.value)}
            disabled={isRunning}
            className="w-full bg-black border border-green-500 text-green-500 px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
            placeholder="e.g., Sprint 42"
          />
        </div>

        <div>
          <label className="block text-green-500 font-mono text-sm mb-1">
            Board ID:
          </label>
          <input
            type="text"
            value={boardId}
            onChange={(e) => setBoardId(e.target.value)}
            disabled={isRunning}
            className="w-full bg-black border border-green-500 text-green-500 px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
            placeholder="e.g., board-123"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="mockMode"
            checked={mockMode}
            onChange={(e) => setMockMode(e.target.checked)}
            disabled={isRunning}
            className="w-4 h-4 bg-black border border-green-500 text-green-500 focus:ring-1 focus:ring-green-500 disabled:opacity-50"
          />
          <label htmlFor="mockMode" className="text-green-500 font-mono text-sm">
            MOCK_MODE
          </label>
        </div>

        <div>
          <button
            onClick={() => setShowExtraJson(!showExtraJson)}
            disabled={isRunning}
            className="flex items-center text-green-500 font-mono text-sm hover:text-green-300 transition-colors disabled:opacity-50"
          >
            <ChevronRight className={`w-4 h-4 mr-1 transition-transform ${showExtraJson ? 'rotate-90' : ''}`} />
            Extra JSON params
          </button>
          {showExtraJson && (
            <div className="mt-2">
              <textarea
                value={extraJson}
                onChange={(e) => setExtraJson(e.target.value)}
                disabled={isRunning}
                className="w-full bg-black border border-green-500 text-green-500 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50 min-h-[100px]"
                placeholder='{"key": "value"}'
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
          [ RUNNING... ]
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => handleRunStep('full')}
          disabled={isRunning}
          className="border border-green-500 text-green-500 px-4 py-3 font-mono hover:bg-green-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Run full workflow
        </button>
        <button
          onClick={() => handleRunStep('collect')}
          disabled={isRunning}
          className="border border-green-500 text-green-500 px-4 py-3 font-mono hover:bg-green-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Run step 1: Collect &amp; Validate Data
        </button>
        <button
          onClick={() => handleRunStep('generate')}
          disabled={isRunning}
          className="border border-green-500 text-green-500 px-4 py-3 font-mono hover:bg-green-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Run step 2: Generate Report
        </button>
        <button
          onClick={() => handleRunStep('validate')}
          disabled={isRunning}
          className="border border-green-500 text-green-500 px-4 py-3 font-mono hover:bg-green-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Run step 3: Validate Report
        </button>
      </div>
    </div>
  );
}
