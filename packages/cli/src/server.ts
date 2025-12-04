/**
 * HTTP Server for EzReport Web Console
 *
 * Simple REST API:
 * - GET /api/ping - Health check
 * - POST /api/collect-data - Collect sprint data from Jira
 * - POST /api/generate-report - Generate report using AI
 * - POST /api/analyze - Strategic analysis (collects data + AI)
 * - POST /api/analyze-data - AI analysis of provided data
 */

import express, { Request, Response } from 'express';
import cors from 'cors';

import type {
  SprintReportParams,
  AnalyzeDataParams,
  CollectDataResponse,
  GenerateReportResponse,
  AnalyzeResponse,
  SprintCardData,
  VersionMeta,
} from '@ezreport/shared';

import { runSprintReportWorkflow } from './services/sprintReportWorkflow';
import { collectBasicBoardSprintData, performStrategicAnalysis } from './services/collectBasicBoardSprintData';
import { logger } from './utils/logger';

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

    // Data collection step - no AI calls
    // Strategic analysis should be triggered separately via /api/analyze-data
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
      basicBoardData,
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
      report: cliResult.report,
      reportValidation: cliResult.reportValidation,
      notionPage: cliResult.notionPage,
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

    const response: AnalyzeResponse = {
      analysis: analysis ?? null,
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
app.post('/api/analyze-data', async (req: Request, res: Response) => {
  const params = req.body as AnalyzeDataParams;
  
  clearLogs();
  addLog('Running AI analysis on provided data...');

  try {
    if (!params.currentSprint) {
      res.status(400).json({ error: 'currentSprint is required' });
      return;
    }

    addLog(`Sprint: ${params.currentSprint.sprint.name}`);
    addLog(`Issues count: ${params.currentSprint.issues.length}`);
    addLog('Running AI analysis...');

    // Run strategic analysis directly with provided data
    const analysis = await performStrategicAnalysis(
      params.activeVersion as VersionMeta | undefined,
      params.currentSprint as SprintCardData,
      params.previousSprint as SprintCardData | undefined,
      params.mockMode ?? false,
    );

    addLog('Analysis complete');

    const response: AnalyzeResponse = {
      analysis: analysis ?? null,
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
