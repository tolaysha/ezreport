/**
 * Board Sprint Data Collection Service
 *
 * Collects basic sprint data for a given board, including:
 * - Previous (last closed) sprint
 * - Current (active) sprint
 * - Version info
 *
 * NOTE: This is a pure data collection step with NO AI calls.
 * Strategic analysis and goal alignment should be triggered
 * separately via the /api/board/:id/analyse endpoint.
 */

import type {
  SprintMeta,
  SprintIssue,
  SprintCardData,
  BasicBoardSprintData,
} from '@ezreport/shared';

import { IS_MOCK, isJiraConfigured } from '../config';
import { logger } from '../utils/logger';

// Mocks
import {
  generateMockPreviousSprint,
  generateMockCurrentSprint,
  generateMockPreviousSprintIssues,
  generateMockCurrentSprintIssues,
  generateMockActiveVersion,
} from '../mocks/sprintMocks';

// Jira
import {
  createJiraClient,
  fetchSprintsForBoard,
  fetchIssuesForSprint,
  fetchProjectAndActiveVersion,
  toSprintMeta,
  toSprintIssue,
} from '../jira/boardFetcher';


// Re-export for backward compatibility
export { performStrategicAnalysis } from '../ai/strategicAnalyzer';

// =============================================================================
// Types
// =============================================================================

export interface CollectBasicBoardParams {
  boardId: string;
  mockMode?: boolean;
}

// =============================================================================
// Artifact Issue Selection
// =============================================================================

/**
 * Pick issues recommended for artifacts / demo.
 */
export function pickRecommendedArtifactIssues(issues: SprintIssue[]): SprintIssue[] {
  const doneIssues = issues.filter((i) => i.statusCategory === 'done');

  if (doneIssues.length === 0) {
    return [];
  }

  const scored = doneIssues.map((issue) => {
    let score = 0;
    if (issue.artifact) score += 100;
    if (issue.storyPoints && issue.storyPoints >= 3) score += issue.storyPoints * 10;
    if (issue.assignee) score += 5;
    return { issue, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const maxItems = Math.min(5, Math.max(3, scored.length));
  return scored.slice(0, maxItems).map((s) => s.issue);
}

// =============================================================================
// Sprint Card Builder
// =============================================================================

function buildSprintCardData(
  sprintMeta: SprintMeta,
  issues: SprintIssue[],
): SprintCardData {
  const recommendedArtifactIssues = pickRecommendedArtifactIssues(issues);

  // No AI calls in data collection step
  // Goal alignment will be assessed later in the analysis step if needed
  const hasGoal = !!sprintMeta.goal && sprintMeta.goal.trim() !== '';

  return {
    sprint: sprintMeta,
    issues,
    goalMatchLevel: hasGoal ? 'unknown' : 'unknown',
    goalMatchComment: hasGoal ? 'Оценка будет выполнена на этапе анализа.' : 'Цель спринта не указана.',
    recommendedArtifactIssues,
  };
}

async function buildSprintCardDataSafe(
  sprint: { id: number; name: string; state: string; startDate?: string; endDate?: string; goal?: string },
  fetchIssues: () => Promise<{ key: string; fields: Record<string, unknown> }[]>,
): Promise<SprintCardData> {
  const sprintMeta = toSprintMeta(sprint as Parameters<typeof toSprintMeta>[0]);
  let issues: SprintIssue[] = [];

  try {
    const rawIssues = await fetchIssues();
    issues = rawIssues.map(toSprintIssue);
    logger.info(`[buildSprintCardDataSafe] Fetched ${issues.length} issues for sprint ${sprint.name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[buildSprintCardDataSafe] Failed to fetch issues for sprint ${sprint.name}`, { error: message });

    return {
      sprint: sprintMeta,
      issues: [],
      goalMatchLevel: 'unknown',
      goalMatchComment: 'Не удалось загрузить задачи спринта.',
      recommendedArtifactIssues: [],
    };
  }

  return buildSprintCardData(sprintMeta, issues);
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Collect basic sprint data for a board.
 * Never throws - returns partial data with availability flags on errors.
 */
export async function collectBasicBoardSprintData(
  params: CollectBasicBoardParams,
): Promise<BasicBoardSprintData> {
  const { boardId, mockMode: explicitMockMode } = params;
  const useMockMode = explicitMockMode ?? IS_MOCK;

  logger.info(`[collectBasicBoardSprintData] Starting for board ${boardId}, mockMode=${useMockMode}`);

  const result: BasicBoardSprintData = {
    boardId,
    previousSprint: undefined,
    currentSprint: undefined,
    availability: { hasPreviousSprint: false, hasCurrentSprint: false },
  };

  // Mock mode
  if (useMockMode) {
    logger.info('[collectBasicBoardSprintData] Using mock data');

    result.activeVersion = generateMockActiveVersion();
    result.previousSprint = buildSprintCardData(
      generateMockPreviousSprint(),
      generateMockPreviousSprintIssues(),
    );
    result.currentSprint = buildSprintCardData(
      generateMockCurrentSprint(),
      generateMockCurrentSprintIssues(),
    );
    
    // No AI calls in data collection step
    // Strategic analysis should be triggered separately via /api/board/:id/analyse
    
    result.availability = { hasPreviousSprint: true, hasCurrentSprint: true };
    logger.info('[collectBasicBoardSprintData] Mock data ready');
    return result;
  }

  // Check Jira configuration
  if (!isJiraConfigured()) {
    logger.error('[collectBasicBoardSprintData] Jira not configured');
    throw new Error('Jira не настроен. Укажите JIRA_BASE_URL, JIRA_EMAIL и JIRA_API_TOKEN в .env файле.');
  }

  // Real mode - fetch from Jira
  const client = createJiraClient();

  // Fetch sprints
  let allSprints;
  try {
    logger.info(`[collectBasicBoardSprintData] Fetching sprints for board ${boardId}`);
    allSprints = await fetchSprintsForBoard(client, boardId);
    logger.info(`[collectBasicBoardSprintData] Found ${allSprints.length} sprints`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`[collectBasicBoardSprintData] No sprints found for board ${boardId}`, { error: message });
    return result;
  }

  if (allSprints.length === 0) {
    logger.warn(`[collectBasicBoardSprintData] No sprints found for board ${boardId}`);
    return result;
  }

  // Find active and closed sprints
  const activeSprint = allSprints.find((s) => s.state === 'active');
  const closedSprints = allSprints
    .filter((s) => s.state === 'closed')
    .sort((a, b) => {
      const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
      const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
      return dateB - dateA;
    });

  // Fetch project and version
  const projectAndVersion = await fetchProjectAndActiveVersion(client, boardId);
  if (projectAndVersion.project) {
    result.projectKey = projectAndVersion.project.key;
    result.projectName = projectAndVersion.project.name;
  }
  result.activeVersion = projectAndVersion.activeVersion;

  // Build previous sprint card
  if (closedSprints.length > 0) {
    const previousSprint = closedSprints[0];
    logger.info(`[collectBasicBoardSprintData] Building previous sprint card: ${previousSprint.name}`);
    result.previousSprint = await buildSprintCardDataSafe(
      previousSprint,
      () => fetchIssuesForSprint(client, previousSprint.id),
    );
    result.availability.hasPreviousSprint = true;
  }

  // Build current sprint card
  if (activeSprint) {
    logger.info(`[collectBasicBoardSprintData] Building current sprint card: ${activeSprint.name}`);
    result.currentSprint = await buildSprintCardDataSafe(
      activeSprint,
      () => fetchIssuesForSprint(client, activeSprint.id),
    );
    result.availability.hasCurrentSprint = true;
  }

  // No AI calls in data collection step
  // Strategic analysis should be triggered separately via /api/board/:id/analyse

  logger.info('[collectBasicBoardSprintData] Data collection complete', {
    hasPreviousSprint: result.availability.hasPreviousSprint,
    hasCurrentSprint: result.availability.hasCurrentSprint,
  });

  return result;
}
