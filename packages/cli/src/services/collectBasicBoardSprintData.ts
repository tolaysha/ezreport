/**
 * Board Sprint Data Collection Service
 *
 * Collects basic sprint data for a given board, including:
 * - Previous (last closed) sprint
 * - Current (active) sprint
 * - Version info and strategic analysis
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

// AI
import { generateSprintGoal } from '../ai/goalGenerator';
import { performStrategicAnalysis } from '../ai/strategicAnalyzer';

// Jira
import {
  createJiraClient,
  fetchSprintsForBoard,
  fetchIssuesForSprint,
  fetchProjectAndActiveVersion,
  toSprintMeta,
  toSprintIssue,
} from '../jira/boardFetcher';

// Goal alignment
import { assessGoalAlignment } from './goalAlignment';

// Re-export for backward compatibility
export { performStrategicAnalysis } from '../ai/strategicAnalyzer';

// =============================================================================
// Types
// =============================================================================

export interface CollectBasicBoardParams {
  boardId: string;
  mockMode?: boolean;
  skipAnalysis?: boolean;
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

async function buildSprintCardData(
  sprintMeta: SprintMeta,
  issues: SprintIssue[],
  mockMode: boolean,
): Promise<SprintCardData> {
  let updatedSprintMeta = { ...sprintMeta };
  
  // Generate goal if not present
  if (!sprintMeta.goal && !mockMode && issues.length > 0) {
    logger.info(`[buildSprintCardData] No goal for ${sprintMeta.name}, generating with AI...`);
    const generatedGoal = await generateSprintGoal(issues, sprintMeta.name);
    if (generatedGoal) {
      updatedSprintMeta = { ...sprintMeta, goal: generatedGoal, goalIsGenerated: true };
    }
  }

  const alignment = await assessGoalAlignment(updatedSprintMeta, issues, mockMode);
  const recommendedArtifactIssues = pickRecommendedArtifactIssues(issues);

  return {
    sprint: updatedSprintMeta,
    issues,
    goalMatchLevel: alignment.level,
    goalMatchComment: alignment.comment,
    recommendedArtifactIssues,
  };
}

async function buildSprintCardDataSafe(
  sprint: { id: number; name: string; state: string; startDate?: string; endDate?: string; goal?: string },
  fetchIssues: () => Promise<{ key: string; fields: Record<string, unknown> }[]>,
  mockMode: boolean,
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

  return buildSprintCardData(sprintMeta, issues, mockMode);
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
  const { boardId, mockMode: explicitMockMode, skipAnalysis } = params;
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
    result.previousSprint = await buildSprintCardData(
      generateMockPreviousSprint(),
      generateMockPreviousSprintIssues(),
      true,
    );
    result.currentSprint = await buildSprintCardData(
      generateMockCurrentSprint(),
      generateMockCurrentSprintIssues(),
      true,
    );
    
    if (!skipAnalysis) {
      result.analysis = await performStrategicAnalysis(
        result.activeVersion,
        result.currentSprint,
        result.previousSprint,
        true,
      );
    }
    
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
      useMockMode,
    );
    result.availability.hasPreviousSprint = true;
  }

  // Build current sprint card
  if (activeSprint) {
    logger.info(`[collectBasicBoardSprintData] Building current sprint card: ${activeSprint.name}`);
    result.currentSprint = await buildSprintCardDataSafe(
      activeSprint,
      () => fetchIssuesForSprint(client, activeSprint.id),
      useMockMode,
    );
    result.availability.hasCurrentSprint = true;
  }

  // Strategic analysis
  if (result.currentSprint && !skipAnalysis) {
    logger.info('[collectBasicBoardSprintData] Performing strategic analysis...');
    result.analysis = await performStrategicAnalysis(
      result.activeVersion,
      result.currentSprint,
      result.previousSprint,
      useMockMode,
    );
  }

  logger.info('[collectBasicBoardSprintData] Data collection complete', {
    hasPreviousSprint: result.availability.hasPreviousSprint,
    hasCurrentSprint: result.availability.hasCurrentSprint,
    hasAnalysis: !!result.analysis,
  });

  return result;
}
