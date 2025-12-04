/**
 * HTTP Server for EzReport Web Console
 *
 * Provides REST API endpoints for the sprint report workflow:
 * - GET /api/workflow/ping - Health check
 * - POST /api/workflow/run-step - Execute workflow steps
 */

import express, { Request, Response } from 'express';
import cors from 'cors';

import {
  collectSprintData,
  generateSprintReportBlocks,
  runSprintReportWorkflow,
  validateSprintData,
  validateSprintReport,
} from './services/sprintReportWorkflow';
import { collectBasicBoardSprintData } from './services/collectBasicBoardSprintData';
import { JIRA_CONFIG } from './config';
import { jiraClient } from './jira/client';
import type {
  CollectedSprintData,
  SprintDataValidationResult,
  SprintReportWorkflowResult as CLIWorkflowResult,
} from './services/workflowTypes';
import type { BasicBoardSprintData, SprintCardData } from './domain/BoardSprintSnapshot';
import type { SprintReportStructured, SprintIssue } from './ai/types';
import { logger } from './utils/logger';

// =============================================================================
// Types (matching web/types/workflow.ts)
// =============================================================================

type WorkflowStep = 'collect' | 'generate' | 'validate' | 'full';

interface SprintReportWorkflowParams {
  sprintId?: string;
  sprintName?: string;
  boardId?: string;
  extra?: Record<string, unknown>;
  mockMode?: boolean;
}

interface SprintInfo {
  id?: string;
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

interface ValidationMessage {
  code?: string;
  message: string;
  details?: string;
}

interface SprintDataValidationResultWeb {
  isValid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  goalIssueMatchLevel?: 'strong' | 'medium' | 'weak';
  goalIssueMatchComment?: string;
}

interface SprintReportStructuredWeb {
  version?: string;
  sprint?: string;
  overview?: string;
  notDone?: string;
  achievements?: string;
  artifacts?: string;
  nextSprint?: string;
  blockers?: string;
  pmQuestions?: string;
}

interface PartnerReadiness {
  isPartnerReady?: boolean;
  comments?: string[];
}

interface SprintReportValidationResultWeb {
  isValid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  partnerReadiness?: PartnerReadiness;
}

interface NotionPageResult {
  id?: string;
  url?: string;
}

// =============================================================================
// Types for Basic Board Sprint Data (Step 1)
// =============================================================================

interface SprintMetaWeb {
  id: string;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
  goal?: string;
  goalIsGenerated?: boolean;
}

interface SprintIssueWeb {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  storyPoints: number | null;
  assignee: string | null;
  artifact: string | null;
}

interface SprintCardDataWeb {
  sprint: SprintMetaWeb;
  issues: SprintIssueWeb[];
  goalMatchLevel: 'strong' | 'medium' | 'weak' | 'unknown';
  goalMatchComment: string;
  recommendedArtifactIssues: SprintIssueWeb[];
}

interface VersionMetaWeb {
  id: string;
  name: string;
  description?: string;
  releaseDate?: string;
  released: boolean;
  progressPercent?: number;
}

type AlignmentLevelWeb = 'aligned' | 'partial' | 'misaligned' | 'unknown';

interface VersionSprintAlignmentWeb {
  level: AlignmentLevelWeb;
  comment: string;
  recommendations?: string[];
}

interface SprintTasksAlignmentWeb {
  level: AlignmentLevelWeb;
  comment: string;
  directlyRelatedPercent?: number;
  unrelatedTasks?: string[];
}

interface DemoRecommendationWeb {
  issueKey: string;
  summary: string;
  wowFactor: string;
  demoComplexity: number;
  suggestedFormat: 'video' | 'screenshot' | 'live' | 'slides';
}

interface StrategicAnalysisWeb {
  versionSprintAlignment: VersionSprintAlignmentWeb;
  sprintTasksAlignment: SprintTasksAlignmentWeb;
  overallScore: number;
  summary: string;
  demoRecommendations?: DemoRecommendationWeb[];
}

interface BasicBoardSprintDataWeb {
  boardId: string;
  projectKey?: string;
  projectName?: string;
  activeVersion?: VersionMetaWeb;
  previousSprint?: SprintCardDataWeb;
  currentSprint?: SprintCardDataWeb;
  analysis?: StrategicAnalysisWeb;
  availability: {
    hasPreviousSprint: boolean;
    hasCurrentSprint: boolean;
  };
}

interface SprintReportWorkflowResultWeb {
  sprint?: SprintInfo;
  dataValidation?: SprintDataValidationResultWeb | null;
  report?: SprintReportStructuredWeb | null;
  reportValidation?: SprintReportValidationResultWeb | null;
  notionPage?: NotionPageResult | null;
  basicBoardData?: BasicBoardSprintDataWeb | null;
}

interface RunStepResponse {
  step: WorkflowStep;
  params: SprintReportWorkflowParams;
  result: SprintReportWorkflowResultWeb | null;
  logs?: string[];
}

// =============================================================================
// State (simple in-memory state for workflow progress)
// =============================================================================

let lastCollectedData: CollectedSprintData | null = null;
let lastDataValidation: SprintDataValidationResult | null = null;
let lastReport: SprintReportStructured | null = null;
const logs: string[] = [];

function addLog(message: string): void {
  const timestamp = new Date().toISOString();
  logs.push(`[${timestamp}] ${message}`);
  logger.info(message);
}

function clearLogs(): void {
  logs.length = 0;
}

// =============================================================================
// Converters (CLI types -> Web types)
// =============================================================================

function convertSprintInfo(cliSprint: CLIWorkflowResult['sprint']): SprintInfo | undefined {
  if (!cliSprint) return undefined;
  return {
    id: String(cliSprint.id),
    name: cliSprint.name,
    goal: cliSprint.goal,
    startDate: cliSprint.startDate,
    endDate: cliSprint.endDate,
  };
}

function convertValidationErrors(
  errors: Array<{ code: string; message: string; details?: Record<string, unknown> }>,
): ValidationMessage[] {
  return errors.map((e) => ({
    code: e.code,
    message: e.message,
    details: e.details ? JSON.stringify(e.details) : undefined,
  }));
}

function convertDataValidation(
  cliValidation: SprintDataValidationResult | null,
): SprintDataValidationResultWeb | null {
  if (!cliValidation) return null;
  return {
    isValid: cliValidation.isValid,
    errors: convertValidationErrors(cliValidation.errors),
    warnings: convertValidationErrors(cliValidation.warnings),
    goalIssueMatchLevel: cliValidation.goalIssueMatch?.matchLevel,
    goalIssueMatchComment: cliValidation.goalIssueMatch?.comment,
  };
}

function convertReport(cliReport: SprintReportStructured | null): SprintReportStructuredWeb | null {
  if (!cliReport) return null;

  // Convert structured report to string-based web format
  return {
    version: cliReport.version
      ? `v${cliReport.version.number} (${cliReport.version.deadline}) - ${cliReport.version.goal}`
      : undefined,
    sprint: cliReport.sprint
      ? `Спринт ${cliReport.sprint.number} (${cliReport.sprint.startDate} - ${cliReport.sprint.endDate})\nЦель: ${cliReport.sprint.goal}\nПрогресс: ${cliReport.sprint.progressPercent}%`
      : undefined,
    overview: cliReport.overview,
    notDone: Array.isArray(cliReport.notDone)
      ? cliReport.notDone
          .map((item) => `• ${item.title}\n  Причина: ${item.reason}\n  Новый срок: ${item.newDeadline}`)
          .join('\n\n')
      : undefined,
    achievements: Array.isArray(cliReport.achievements)
      ? cliReport.achievements.map((item) => `• ${item.title}\n  ${item.description}`).join('\n\n')
      : undefined,
    artifacts: Array.isArray(cliReport.artifacts)
      ? cliReport.artifacts
          .map((item) => `• ${item.title}\n  ${item.description}${item.jiraLink ? `\n  Jira: ${item.jiraLink}` : ''}`)
          .join('\n\n')
      : undefined,
    nextSprint: cliReport.nextSprint
      ? `Спринт ${cliReport.nextSprint.sprintNumber}\nЦель: ${cliReport.nextSprint.goal}`
      : undefined,
    blockers: Array.isArray(cliReport.blockers)
      ? cliReport.blockers.length > 0
        ? cliReport.blockers
            .map((item) => `• ${item.title}\n  ${item.description}\n  Решение: ${item.resolutionProposal}`)
            .join('\n\n')
        : 'Блокеров не выявлено'
      : undefined,
    pmQuestions: Array.isArray(cliReport.pmQuestions)
      ? cliReport.pmQuestions.length > 0
        ? cliReport.pmQuestions.map((item) => `• ${item.title}\n  ${item.description}`).join('\n\n')
        : 'Вопросов нет'
      : undefined,
  };
}

function convertReportValidation(
  cliValidation: CLIWorkflowResult['reportValidation'],
): SprintReportValidationResultWeb | null {
  if (!cliValidation) return null;
  return {
    isValid: cliValidation.isValid,
    errors: convertValidationErrors(cliValidation.errors),
    warnings: convertValidationErrors(cliValidation.warnings),
    partnerReadiness: cliValidation.partnerReadiness
      ? {
          isPartnerReady: cliValidation.partnerReadiness.isPartnerReady,
          comments: cliValidation.partnerReadiness.comments,
        }
      : undefined,
  };
}

function convertCLIResult(cliResult: CLIWorkflowResult): SprintReportWorkflowResultWeb {
  return {
    sprint: convertSprintInfo(cliResult.sprint),
    dataValidation: convertDataValidation(cliResult.dataValidation),
    report: convertReport(cliResult.report),
    reportValidation: convertReportValidation(cliResult.reportValidation),
    notionPage: cliResult.notionPage
      ? { id: cliResult.notionPage.id, url: cliResult.notionPage.url }
      : null,
    basicBoardData: cliResult.basicBoardData
      ? convertBasicBoardSprintData(cliResult.basicBoardData)
      : null,
  };
}

// =============================================================================
// Basic Board Sprint Data Converters
// =============================================================================

function convertSprintIssue(issue: SprintIssue): SprintIssueWeb {
  return {
    key: issue.key,
    summary: issue.summary,
    status: issue.status,
    statusCategory: issue.statusCategory,
    storyPoints: issue.storyPoints,
    assignee: issue.assignee,
    artifact: issue.artifact,
  };
}

function convertSprintCardData(card: SprintCardData): SprintCardDataWeb {
  return {
    sprint: {
      id: card.sprint.id,
      name: card.sprint.name,
      state: card.sprint.state,
      startDate: card.sprint.startDate,
      endDate: card.sprint.endDate,
      goal: card.sprint.goal,
      goalIsGenerated: card.sprint.goalIsGenerated,
    },
    issues: card.issues.map(convertSprintIssue),
    goalMatchLevel: card.goalMatchLevel,
    goalMatchComment: card.goalMatchComment,
    recommendedArtifactIssues: card.recommendedArtifactIssues.map(convertSprintIssue),
  };
}

function convertBasicBoardSprintData(data: BasicBoardSprintData): BasicBoardSprintDataWeb {
  return {
    boardId: data.boardId,
    projectKey: data.projectKey,
    projectName: data.projectName,
    activeVersion: data.activeVersion ? {
      id: data.activeVersion.id,
      name: data.activeVersion.name,
      description: data.activeVersion.description,
      releaseDate: data.activeVersion.releaseDate,
      released: data.activeVersion.released,
      progressPercent: data.activeVersion.progressPercent,
    } : undefined,
    previousSprint: data.previousSprint ? convertSprintCardData(data.previousSprint) : undefined,
    currentSprint: data.currentSprint ? convertSprintCardData(data.currentSprint) : undefined,
    analysis: data.analysis ? {
      versionSprintAlignment: {
        level: data.analysis.versionSprintAlignment.level,
        comment: data.analysis.versionSprintAlignment.comment,
        recommendations: data.analysis.versionSprintAlignment.recommendations,
      },
      sprintTasksAlignment: {
        level: data.analysis.sprintTasksAlignment.level,
        comment: data.analysis.sprintTasksAlignment.comment,
        directlyRelatedPercent: data.analysis.sprintTasksAlignment.directlyRelatedPercent,
        unrelatedTasks: data.analysis.sprintTasksAlignment.unrelatedTasks,
      },
      overallScore: data.analysis.overallScore,
      summary: data.analysis.summary,
      demoRecommendations: data.analysis.demoRecommendations?.map(rec => ({
        issueKey: rec.issueKey,
        summary: rec.summary,
        wowFactor: rec.wowFactor,
        demoComplexity: rec.demoComplexity,
        suggestedFormat: rec.suggestedFormat,
      })),
    } : undefined,
    availability: {
      hasPreviousSprint: data.availability.hasPreviousSprint,
      hasCurrentSprint: data.availability.hasCurrentSprint,
    },
  };
}

// =============================================================================
// Step Handlers
// =============================================================================

async function handleCollect(params: SprintReportWorkflowParams): Promise<SprintReportWorkflowResultWeb> {
  clearLogs();
  addLog('Starting data collection...');
  addLog(`Mock mode: ${params.mockMode ? 'ON' : 'OFF'}`);

  // =========================================================================
  // New Step 1: Collect basic board sprint data (if boardId is provided)
  // =========================================================================
  if (params.boardId) {
    addLog(`Collecting basic board sprint data for board ${params.boardId}...`);

    try {
      const basicBoardData = await collectBasicBoardSprintData({
        boardId: params.boardId,
        mockMode: params.mockMode ?? false,
      });

      const previousIssueCount = basicBoardData.previousSprint?.issues.length ?? 0;
      const currentIssueCount = basicBoardData.currentSprint?.issues.length ?? 0;

      addLog(`Previous sprint: ${basicBoardData.availability.hasPreviousSprint ? 'found' : 'not found'}`);
      if (basicBoardData.previousSprint) {
        addLog(`  - Name: ${basicBoardData.previousSprint.sprint.name}`);
        addLog(`  - Issues: ${previousIssueCount}`);
        addLog(`  - Goal match: ${basicBoardData.previousSprint.goalMatchLevel}`);
      }

      addLog(`Current sprint: ${basicBoardData.availability.hasCurrentSprint ? 'found' : 'not found'}`);
      if (basicBoardData.currentSprint) {
        addLog(`  - Name: ${basicBoardData.currentSprint.sprint.name}`);
        addLog(`  - Issues: ${currentIssueCount}`);
        addLog(`  - Goal match: ${basicBoardData.currentSprint.goalMatchLevel}`);
      }

      addLog('Data collection complete');

      // Return the collected data (legacy collection skipped - not needed for Stage 1)
      return {
        sprint: basicBoardData.currentSprint ? {
          id: basicBoardData.currentSprint.sprint.id,
          name: basicBoardData.currentSprint.sprint.name,
          goal: basicBoardData.currentSprint.sprint.goal,
          startDate: basicBoardData.currentSprint.sprint.startDate,
          endDate: basicBoardData.currentSprint.sprint.endDate,
        } : undefined,
        dataValidation: null,
        report: null,
        reportValidation: null,
        notionPage: null,
        basicBoardData: convertBasicBoardSprintData(basicBoardData),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog(`ERROR during board data collection: ${message}`);
      
      // Return error result
      return {
        sprint: undefined,
        dataValidation: null,
        report: null,
        reportValidation: null,
        notionPage: null,
        basicBoardData: {
          boardId: params.boardId,
          previousSprint: undefined,
          currentSprint: undefined,
          availability: {
            hasPreviousSprint: false,
            hasCurrentSprint: false,
          },
        },
      };
    }
  }

  // =========================================================================
  // Legacy Step 1: Collect by sprint name/id (backward compatibility)
  // =========================================================================
  let sprintNameOrId = params.sprintName || params.sprintId || '';

  // If boardId is provided but basic collection failed, try to get active sprint
  if (params.boardId && !sprintNameOrId) {
    addLog(`Looking for active sprint on board ${params.boardId}...`);
    
    // Temporarily set the board ID in config
    const originalBoardId = JIRA_CONFIG.boardId;
    (JIRA_CONFIG as any).boardId = params.boardId;
    
    try {
      const recentSprints = await jiraClient.getRecentSprints();
      sprintNameOrId = recentSprints.current.name;
      addLog(`Found active sprint: ${sprintNameOrId}`);
    } catch (error) {
      addLog(`Failed to get active sprint from board, using board ID as sprint name`);
      sprintNameOrId = params.boardId;
    } finally {
      // Restore original board ID
      (JIRA_CONFIG as any).boardId = originalBoardId;
    }
  }

  if (!sprintNameOrId) {
    sprintNameOrId = 'default';
  }

  try {
    addLog(`Collecting data for sprint: ${sprintNameOrId}`);
    // Type assertion needed due to type definition mismatch in workflow code
    lastCollectedData = await collectSprintData({
      sprintNameOrId,
      versionMeta: params.extra,
      mockMode: params.mockMode ?? false,
    } as any);
    addLog(`Collected ${lastCollectedData.issues.length} issues`);

    addLog('Validating data...');
    lastDataValidation = await validateSprintData(lastCollectedData);
    addLog(`Data validation: ${lastDataValidation.isValid ? 'PASSED' : 'FAILED'}`);

    return {
      sprint: convertSprintInfo(lastCollectedData.sprintInfo as any),
      dataValidation: convertDataValidation(lastDataValidation),
      report: null,
      reportValidation: null,
      notionPage: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addLog(`ERROR: ${message}`);
    throw error;
  }
}

async function handleGenerate(params: SprintReportWorkflowParams): Promise<SprintReportWorkflowResultWeb> {
  addLog('Starting report generation...');

  // If no collected data, collect first
  if (!lastCollectedData || !lastDataValidation) {
    addLog('No collected data found, collecting first...');
    await handleCollect(params);
  }

  if (!lastCollectedData || !lastDataValidation) {
    throw new Error('Failed to collect data before generation');
  }

  try {
    addLog('Generating report blocks...');
    lastReport = await generateSprintReportBlocks(lastCollectedData, lastDataValidation);
    addLog('Report generation complete');

    return {
      sprint: convertSprintInfo(lastCollectedData.sprintInfo as any),
      dataValidation: convertDataValidation(lastDataValidation),
      report: convertReport(lastReport),
      reportValidation: null,
      notionPage: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addLog(`ERROR: ${message}`);
    throw error;
  }
}

async function handleValidate(params: SprintReportWorkflowParams): Promise<SprintReportWorkflowResultWeb> {
  addLog('Starting report validation...');

  // If no report, generate first
  if (!lastReport || !lastCollectedData) {
    addLog('No report found, generating first...');
    await handleGenerate(params);
  }

  if (!lastReport || !lastCollectedData) {
    throw new Error('Failed to generate report before validation');
  }

  try {
    addLog('Validating report...');
    const reportValidation = await validateSprintReport(lastReport, lastCollectedData);
    addLog(`Report validation: ${reportValidation.isValid ? 'PASSED' : 'FAILED'}`);

    return {
      sprint: convertSprintInfo(lastCollectedData.sprintInfo as any),
      dataValidation: convertDataValidation(lastDataValidation),
      report: convertReport(lastReport),
      reportValidation: convertReportValidation(reportValidation),
      notionPage: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addLog(`ERROR: ${message}`);
    throw error;
  }
}

async function handleFull(params: SprintReportWorkflowParams): Promise<SprintReportWorkflowResultWeb> {
  clearLogs();
  addLog('Starting full workflow...');

  const sprintNameOrId = params.sprintName || params.sprintId || params.boardId || 'default';

  // Set mock mode via environment if requested
  if (params.mockMode) {
    process.env.MOCK_MODE = 'true';
  }

  try {
    const cliResult = await runSprintReportWorkflow({
      sprintNameOrId,
      dryRun: true, // Don't create Notion page from web console for now
    });

    // Store for subsequent calls
    if (cliResult.collectedData) {
      lastCollectedData = cliResult.collectedData;
    }
    if (cliResult.dataValidation) {
      lastDataValidation = cliResult.dataValidation;
    }
    if (cliResult.report) {
      lastReport = cliResult.report;
    }

    addLog('Full workflow complete');

    return convertCLIResult(cliResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addLog(`ERROR: ${message}`);
    throw error;
  }
}

// =============================================================================
// Express App
// =============================================================================

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/workflow/ping', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Run workflow step
app.post('/api/workflow/run-step', async (req: Request, res: Response) => {
  const { step, params } = req.body as { step: WorkflowStep; params: SprintReportWorkflowParams };

  if (!step) {
    res.status(400).json({ error: 'Missing step parameter' });
    return;
  }

  logger.info(`Running step: ${step}`, { params });

  try {
    let result: SprintReportWorkflowResultWeb;

    switch (step) {
      case 'collect':
        result = await handleCollect(params || {});
        break;
      case 'generate':
        result = await handleGenerate(params || {});
        break;
      case 'validate':
        result = await handleValidate(params || {});
        break;
      case 'full':
        result = await handleFull(params || {});
        break;
      default:
        res.status(400).json({ error: `Unknown step: ${step}` });
        return;
    }

    const response: RunStepResponse = {
      step,
      params: params || {},
      result,
      logs: [...logs],
    };

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Step ${step} failed`, { error: message });

    res.status(500).json({
      step,
      params: params || {},
      result: null,
      logs: [...logs, `[ERROR] ${message}`],
      error: message,
    });
  }
});

// =============================================================================
// Start Server
// =============================================================================

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`\n🚀 EzReport API Server running on http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /api/workflow/ping      - Health check`);
  console.log(`  POST /api/workflow/run-step  - Execute workflow step`);
  console.log(`\nMOCK_MODE: ${process.env.MOCK_MODE === 'true' ? 'ON' : 'OFF'}\n`);
});

