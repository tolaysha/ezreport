import {
  SprintReportParams,
  CollectDataResponse,
  GenerateReportResponse,
  AnalyzeResponse,
  AnalyzeDataParams,
} from '@/types/workflow';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export async function ping(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ping`, {
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

/**
 * Collect sprint data from Jira
 */
export async function collectData(
  params: SprintReportParams
): Promise<CollectDataResponse> {
  const response = await fetch(`${API_BASE_URL}/api/collect-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`
    );
  }

  return response.json();
}

/**
 * Generate sprint report using AI
 */
export async function generateReport(
  params: SprintReportParams
): Promise<GenerateReportResponse> {
  const response = await fetch(`${API_BASE_URL}/api/generate-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`
    );
  }

  return response.json();
}

/**
 * Run strategic analysis using AI (collects data from Jira first)
 */
export async function analyze(
  params: SprintReportParams
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`
    );
  }

  return response.json();
}

/**
 * Run AI analysis on already collected data (no Jira fetch)
 */
export async function analyzeData(
  params: AnalyzeDataParams
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analyze-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`
    );
  }

  return response.json();
}

/**
 * Generate partner report from collected data
 */
export async function generatePartnerReport(
  collectedData: unknown
): Promise<{ report: string; notionUrl?: string }> {
  // Extract sprint name from collected data for the request
  const data = collectedData as { basicBoardData?: { currentSprint?: { sprint: { name: string } } } };
  const sprintName = data?.basicBoardData?.currentSprint?.sprint?.name;

  const response = await fetch(`${API_BASE_URL}/api/generate-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sprintName,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`
    );
  }

  const result: GenerateReportResponse = await response.json();
  return {
    report: result.report || '',
    notionUrl: result.notionPage?.url,
  };
}
