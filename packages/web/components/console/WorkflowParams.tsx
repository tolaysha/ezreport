'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { SprintReportWorkflowParams } from '@/types/workflow';
import { ConsoleInput } from './ConsoleInput';
import { ConsoleCheckbox } from './ConsoleCheckbox';

interface WorkflowParamsProps {
  disabled?: boolean;
  onParamsChange?: (params: SprintReportWorkflowParams | null) => void;
}

export function WorkflowParams({
  disabled = false,
  onParamsChange,
}: WorkflowParamsProps) {
  const [sprintId, setSprintId] = useState('');
  const [sprintName, setSprintName] = useState('');
  const [boardId, setBoardId] = useState('');
  const [mockMode, setMockMode] = useState(false);
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

  const handleChange = () => {
    const params = buildParams();
    onParamsChange?.(params);
  };

  return (
    <div className="space-y-4">
      <ConsoleInput
        label="Sprint ID:"
        value={sprintId}
        onChange={(v) => {
          setSprintId(v);
          handleChange();
        }}
        disabled={disabled}
        placeholder="e.g., 12345"
      />

      <ConsoleInput
        label="Sprint Name:"
        value={sprintName}
        onChange={(v) => {
          setSprintName(v);
          handleChange();
        }}
        disabled={disabled}
        placeholder="e.g., Sprint 42"
      />

      <ConsoleInput
        label="Board ID:"
        value={boardId}
        onChange={(v) => {
          setBoardId(v);
          handleChange();
        }}
        disabled={disabled}
        placeholder="e.g., board-123"
      />

      <ConsoleCheckbox
        label="MOCK_MODE"
        checked={mockMode}
        onChange={(v) => {
          setMockMode(v);
          handleChange();
        }}
        disabled={disabled}
      />

      <div>
        <button
          onClick={() => setShowExtraJson(!showExtraJson)}
          disabled={disabled}
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
              onChange={(v) => {
                setExtraJson(v);
                handleChange();
              }}
              disabled={disabled}
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
  );
}

export function useWorkflowParams() {
  const [sprintId, setSprintId] = useState('');
  const [sprintName, setSprintName] = useState('');
  const [boardId, setBoardId] = useState('');
  const [mockMode, setMockMode] = useState(false);
  const [extraJson, setExtraJson] = useState('');
  const [extraJsonError, setExtraJsonError] = useState('');

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

  return {
    sprintId,
    setSprintId,
    sprintName,
    setSprintName,
    boardId,
    setBoardId,
    mockMode,
    setMockMode,
    extraJson,
    setExtraJson,
    extraJsonError,
    buildParams,
  };
}

