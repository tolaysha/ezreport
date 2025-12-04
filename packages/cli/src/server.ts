/**
 * HTTP Server for EzReport Web Console
 *
 * Simple REST API:
 * - GET /api/ping - Health check
 * - POST /api/collect-data - Collect sprint data from Jira
 * - POST /api/generate-report - Generate report using AI
 */

import express, { Request, Response } from 'express';
import cors from 'cors';

import { runSprintReportWorkflow } from './services/sprintReportWorkflow';
import { collectBasicBoardSprintData, performStrategicAnalysis } from './services/collectBasicBoardSprintData';
import type { BasicBoardSprintData, SprintCardData } from './domain/BoardSprintSnapshot';
import type { SprintReportStructured, SprintIssue } from './ai/types';
import { logger } from './utils/logger';

// =============================================================================
// Types
// =============================================================================

interface SprintReportParams {
  boardId?: string;
  sprintId?: string;
  sprintName?: string;
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

// Basic Board Sprint Data Types
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

// Response types
interface CollectDataResponse {
  sprint?: SprintInfo;
  basicBoardData?: BasicBoardSprintDataWeb | null;
  dataValidation?: SprintDataValidationResultWeb | null;
  logs?: string[];
}

interface GenerateReportResponse {
  sprint?: SprintInfo;
  report?: SprintReportStructuredWeb | null;
  reportValidation?: SprintReportValidationResultWeb | null;
  notionPage?: NotionPageResult | null;
  logs?: string[];
}

// =============================================================================
// Logs
// =============================================================================

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
// Converters
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

function convertReport(cliReport: SprintReportStructured | null): SprintReportStructuredWeb | null {
  if (!cliReport) return null;

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

function convertValidationErrors(
  errors: Array<{ code: string; message: string; details?: Record<string, unknown> }>,
): ValidationMessage[] {
  return errors.map((e) => ({
    code: e.code,
    message: e.message,
    details: e.details ? JSON.stringify(e.details) : undefined,
  }));
}

// =============================================================================
// Express App
// =============================================================================

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/ping', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Collect sprint data from Jira
app.post('/api/collect-data', async (req: Request, res: Response) => {
  const params = req.body as SprintReportParams;
  
  clearLogs();
  addLog('Collecting sprint data...');
  addLog(`Board ID: ${params.boardId || 'not specified'}`);
  addLog(`Mock mode: ${params.mockMode ? 'ON' : 'OFF'}`);

  try {
    if (!params.boardId) {
      res.status(400).json({ error: 'boardId is required' });
      return;
    }

    const basicBoardData = await collectBasicBoardSprintData({
      boardId: params.boardId,
      mockMode: params.mockMode ?? false,
    });

    addLog(`Previous sprint: ${basicBoardData.availability.hasPreviousSprint ? 'found' : 'not found'}`);
    addLog(`Current sprint: ${basicBoardData.availability.hasCurrentSprint ? 'found' : 'not found'}`);
    addLog('Data collection complete');

    const response: CollectDataResponse = {
      sprint: basicBoardData.currentSprint ? {
        id: basicBoardData.currentSprint.sprint.id,
        name: basicBoardData.currentSprint.sprint.name,
        goal: basicBoardData.currentSprint.sprint.goal,
        startDate: basicBoardData.currentSprint.sprint.startDate,
        endDate: basicBoardData.currentSprint.sprint.endDate,
      } : undefined,
      basicBoardData: convertBasicBoardSprintData(basicBoardData),
      dataValidation: null,
      logs: [...logs],
    };

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addLog(`ERROR: ${message}`);
    logger.error('Collect data failed', { error: message });

    res.status(500).json({
      error: message,
      logs: [...logs],
    });
  }
});

// Generate report using AI
app.post('/api/generate-report', async (req: Request, res: Response) => {
  const params = req.body as SprintReportParams;
  
  clearLogs();
  addLog('Generating report...');

  const sprintNameOrId = params.sprintName || params.sprintId || params.boardId || 'default';

  if (params.mockMode) {
    process.env.MOCK_MODE = 'true';
  }

  try {
    addLog(`Sprint: ${sprintNameOrId}`);
    
    const cliResult = await runSprintReportWorkflow({
      sprintNameOrId,
      dryRun: true,
    });

    addLog('Report generation complete');

    const response: GenerateReportResponse = {
      sprint: cliResult.sprint ? {
        id: String(cliResult.sprint.id),
        name: cliResult.sprint.name,
        goal: cliResult.sprint.goal,
        startDate: cliResult.sprint.startDate,
        endDate: cliResult.sprint.endDate,
      } : undefined,
      report: convertReport(cliResult.report),
      reportValidation: cliResult.reportValidation ? {
        isValid: cliResult.reportValidation.isValid,
        errors: convertValidationErrors(cliResult.reportValidation.errors),
        warnings: convertValidationErrors(cliResult.reportValidation.warnings),
        partnerReadiness: cliResult.reportValidation.partnerReadiness ? {
          isPartnerReady: cliResult.reportValidation.partnerReadiness.isPartnerReady,
          comments: cliResult.reportValidation.partnerReadiness.comments,
        } : undefined,
      } : null,
      notionPage: cliResult.notionPage ? {
        id: cliResult.notionPage.id,
        url: cliResult.notionPage.url,
      } : null,
      logs: [...logs],
    };

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addLog(`ERROR: ${message}`);
    logger.error('Generate report failed', { error: message });

    res.status(500).json({
      error: message,
      logs: [...logs],
    });
  }
});

// Strategic analysis using AI (with data collection)
app.post('/api/analyze', async (req: Request, res: Response) => {
  const params = req.body as SprintReportParams;
  
  clearLogs();
  addLog('Running strategic analysis...');

  try {
    if (!params.boardId) {
      res.status(400).json({ error: 'boardId is required' });
      return;
    }

    addLog(`Board ID: ${params.boardId}`);

    // First collect data
    const basicBoardData = await collectBasicBoardSprintData({
      boardId: params.boardId,
      mockMode: params.mockMode ?? false,
    });

    if (!basicBoardData.currentSprint) {
      addLog('No current sprint found, cannot analyze');
      res.status(400).json({ 
        error: 'No current sprint found',
        logs: [...logs],
      });
      return;
    }

    addLog('Running AI analysis...');

    // Run strategic analysis
    const analysis = await performStrategicAnalysis(
      basicBoardData.activeVersion,
      basicBoardData.currentSprint,
      basicBoardData.previousSprint,
      params.mockMode ?? false,
    );

    addLog('Analysis complete');

    const response = {
      analysis: analysis ? {
        versionSprintAlignment: {
          level: analysis.versionSprintAlignment.level,
          comment: analysis.versionSprintAlignment.comment,
          recommendations: analysis.versionSprintAlignment.recommendations,
        },
        sprintTasksAlignment: {
          level: analysis.sprintTasksAlignment.level,
          comment: analysis.sprintTasksAlignment.comment,
          directlyRelatedPercent: analysis.sprintTasksAlignment.directlyRelatedPercent,
          unrelatedTasks: analysis.sprintTasksAlignment.unrelatedTasks,
        },
        overallScore: analysis.overallScore,
        summary: analysis.summary,
        demoRecommendations: analysis.demoRecommendations?.map(rec => ({
          issueKey: rec.issueKey,
          summary: rec.summary,
          wowFactor: rec.wowFactor,
          demoComplexity: rec.demoComplexity,
          suggestedFormat: rec.suggestedFormat,
        })),
      } : null,
      logs: [...logs],
    };

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addLog(`ERROR: ${message}`);
    logger.error('Strategic analysis failed', { error: message });

    res.status(500).json({
      error: message,
      logs: [...logs],
    });
  }
});

// AI analysis of already collected data (no Jira fetch)
interface AnalyzeDataRequest {
  activeVersion?: VersionMetaWeb;
  currentSprint?: SprintCardDataWeb;
  previousSprint?: SprintCardDataWeb;
  mockMode?: boolean;
}

app.post('/api/analyze-data', async (req: Request, res: Response) => {
  const params = req.body as AnalyzeDataRequest;
  
  clearLogs();
  addLog('Running AI analysis on provided data...');

  try {
    if (!params.currentSprint) {
      res.status(400).json({ error: 'currentSprint is required' });
      return;
    }

    addLog(`Sprint: ${params.currentSprint.sprint.name}`);
    addLog(`Issues count: ${params.currentSprint.issues.length}`);

    // Convert web types back to domain types for analysis
    const activeVersion = params.activeVersion ? {
      id: params.activeVersion.id,
      name: params.activeVersion.name,
      description: params.activeVersion.description,
      releaseDate: params.activeVersion.releaseDate,
      released: params.activeVersion.released,
      progressPercent: params.activeVersion.progressPercent,
    } : undefined;

    const currentSprint: SprintCardData = {
      sprint: {
        id: params.currentSprint.sprint.id,
        name: params.currentSprint.sprint.name,
        state: params.currentSprint.sprint.state,
        startDate: params.currentSprint.sprint.startDate,
        endDate: params.currentSprint.sprint.endDate,
        goal: params.currentSprint.sprint.goal,
        goalIsGenerated: params.currentSprint.sprint.goalIsGenerated,
      },
      issues: params.currentSprint.issues.map(i => ({
        key: i.key,
        summary: i.summary,
        status: i.status,
        statusCategory: i.statusCategory,
        storyPoints: i.storyPoints,
        assignee: i.assignee,
        artifact: i.artifact,
      })),
      goalMatchLevel: params.currentSprint.goalMatchLevel,
      goalMatchComment: params.currentSprint.goalMatchComment,
      recommendedArtifactIssues: params.currentSprint.recommendedArtifactIssues.map(i => ({
        key: i.key,
        summary: i.summary,
        status: i.status,
        statusCategory: i.statusCategory,
        storyPoints: i.storyPoints,
        assignee: i.assignee,
        artifact: i.artifact,
      })),
    };

    const previousSprint: SprintCardData | undefined = params.previousSprint ? {
      sprint: {
        id: params.previousSprint.sprint.id,
        name: params.previousSprint.sprint.name,
        state: params.previousSprint.sprint.state,
        startDate: params.previousSprint.sprint.startDate,
        endDate: params.previousSprint.sprint.endDate,
        goal: params.previousSprint.sprint.goal,
        goalIsGenerated: params.previousSprint.sprint.goalIsGenerated,
      },
      issues: params.previousSprint.issues.map(i => ({
        key: i.key,
        summary: i.summary,
        status: i.status,
        statusCategory: i.statusCategory,
        storyPoints: i.storyPoints,
        assignee: i.assignee,
        artifact: i.artifact,
      })),
      goalMatchLevel: params.previousSprint.goalMatchLevel,
      goalMatchComment: params.previousSprint.goalMatchComment,
      recommendedArtifactIssues: params.previousSprint.recommendedArtifactIssues.map(i => ({
        key: i.key,
        summary: i.summary,
        status: i.status,
        statusCategory: i.statusCategory,
        storyPoints: i.storyPoints,
        assignee: i.assignee,
        artifact: i.artifact,
      })),
    } : undefined;

    addLog('Running AI analysis...');

    // Run strategic analysis
    const analysis = await performStrategicAnalysis(
      activeVersion,
      currentSprint,
      previousSprint,
      params.mockMode ?? false,
    );

    addLog('Analysis complete');

    const response = {
      analysis: analysis ? {
        versionSprintAlignment: {
          level: analysis.versionSprintAlignment.level,
          comment: analysis.versionSprintAlignment.comment,
          recommendations: analysis.versionSprintAlignment.recommendations,
        },
        sprintTasksAlignment: {
          level: analysis.sprintTasksAlignment.level,
          comment: analysis.sprintTasksAlignment.comment,
          directlyRelatedPercent: analysis.sprintTasksAlignment.directlyRelatedPercent,
          unrelatedTasks: analysis.sprintTasksAlignment.unrelatedTasks,
        },
        overallScore: analysis.overallScore,
        summary: analysis.summary,
        demoRecommendations: analysis.demoRecommendations?.map(rec => ({
          issueKey: rec.issueKey,
          summary: rec.summary,
          wowFactor: rec.wowFactor,
          demoComplexity: rec.demoComplexity,
          suggestedFormat: rec.suggestedFormat,
        })),
      } : null,
      logs: [...logs],
    };

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addLog(`ERROR: ${message}`);
    logger.error('AI analysis of provided data failed', { error: message });

    res.status(500).json({
      error: message,
      logs: [...logs],
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
  console.log(`  GET  /api/ping            - Health check`);
  console.log(`  POST /api/collect-data    - Collect sprint data from Jira`);
  console.log(`  POST /api/generate-report - Generate report using AI`);
  console.log(`  POST /api/analyze         - Strategic analysis (collects data + AI)`);
  console.log(`  POST /api/analyze-data    - AI analysis of provided data (no Jira fetch)`);
  console.log(`\nMOCK_MODE: ${process.env.MOCK_MODE === 'true' ? 'ON' : 'OFF'}\n`);
});
