import {
  WorkflowStep,
  SprintReportWorkflowParams,
  RunStepResponse,
} from '@/types/workflow';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export async function ping(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/workflow/ping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Ping failed:', error);
    return false;
  }
}

export async function runStep(
  step: WorkflowStep,
  params: SprintReportWorkflowParams
): Promise<RunStepResponse> {
  const response = await fetch(`${API_BASE_URL}/api/workflow/run-step`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ step, params }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`
    );
  }

  return response.json();
}
