/**
 * HTTP Server for EzReport Web Console
 *
 * Simple REST API with server-side state:
 * - GET /api/ping - Health check
 * - POST /api/collect-data - Collect sprint data from Jira (saves to state)
 * - POST /api/analyze-data - AI analysis (uses state, saves result)
 * - POST /api/generate-report - Generate report (uses state)
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
  BasicBoardSprintData,
  StrategicAnalysis,
} from '@ezreport/shared';

import { collectBasicBoardSprintData, performStrategicAnalysis } from './services/collectBasicBoardSprintData';
import { generatePartnerReportMarkdown } from './services/partnerReport';
import { logger } from './utils/logger';

// =============================================================================
// Server State
// =============================================================================

interface ServerState {
  basicBoardData: BasicBoardSprintData | null;
  analysis: StrategicAnalysis | null;
}

const state: ServerState = {
  basicBoardData: null,
  analysis: null,
};

function clearState(): void {
  state.basicBoardData = null;
  state.analysis = null;
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
// Express App
// =============================================================================

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/ping', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Clear server state
app.post('/api/clear', (_req: Request, res: Response) => {
  clearState();
  clearLogs();
  res.json({ status: 'ok', message: 'State cleared' });
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

    // Save to state
    state.basicBoardData = basicBoardData;
    state.analysis = null; // Clear analysis when new data is collected

    addLog(`Previous sprint: ${basicBoardData.availability.hasPreviousSprint ? 'found' : 'not found'}`);
    addLog(`Current sprint: ${basicBoardData.availability.hasCurrentSprint ? 'found' : 'not found'}`);
    addLog('Data collection complete');

    // Return previousSprint in the 'sprint' field since report is generated for completed sprints
    const response: CollectDataResponse = {
      sprint: basicBoardData.previousSprint ? {
        id: basicBoardData.previousSprint.sprint.id,
        name: basicBoardData.previousSprint.sprint.name,
        goal: basicBoardData.previousSprint.sprint.goal,
        startDate: basicBoardData.previousSprint.sprint.startDate,
        endDate: basicBoardData.previousSprint.sprint.endDate,
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

// Generate report from collected data (uses state)
app.post('/api/generate-report', async (req: Request, res: Response) => {
  const { mockMode } = req.body as { mockMode?: boolean };
  
  clearLogs();
  addLog('Generating report...');

  if (mockMode) {
    process.env.MOCK_MODE = 'true';
  }

  try {
    // Check if we have data in state
    if (!state.basicBoardData) {
      res.status(400).json({ 
        error: 'No data available. Please go to Data tab and collect data first.',
        logs: [...logs],
      });
      return;
    }

    if (!state.basicBoardData.previousSprint) {
      res.status(400).json({ 
        error: 'No previous sprint found in collected data. Report is generated for completed sprints.',
        logs: [...logs],
      });
      return;
    }

    addLog(`Sprint: ${state.basicBoardData.previousSprint.sprint.name}`);
    addLog(`Analysis: ${state.analysis ? 'available' : 'not available'}`);

    // Generate report markdown using state data
    const reportMarkdown = await generatePartnerReportMarkdown({
      basicBoardData: state.basicBoardData,
      analysis: state.analysis ?? undefined,
    });

    addLog('Report generation complete');

    const response: GenerateReportResponse = {
      sprint: {
        id: String(state.basicBoardData.previousSprint.sprint.id),
        name: state.basicBoardData.previousSprint.sprint.name,
        goal: state.basicBoardData.previousSprint.sprint.goal,
        startDate: state.basicBoardData.previousSprint.sprint.startDate,
        endDate: state.basicBoardData.previousSprint.sprint.endDate,
      },
      reportMarkdown,
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

// AI analysis of collected data (uses state or provided data)
app.post('/api/analyze-data', async (req: Request, res: Response) => {
  const params = req.body as AnalyzeDataParams;
  
  clearLogs();
  addLog('Running AI analysis...');

  try {
    // Use provided data or fall back to state
    const currentSprint = params.currentSprint ?? state.basicBoardData?.currentSprint;
    const previousSprint = params.previousSprint ?? state.basicBoardData?.previousSprint;
    const activeVersion = params.activeVersion ?? state.basicBoardData?.activeVersion;

    if (!currentSprint) {
      res.status(400).json({ 
        error: 'No sprint data available. Please go to Data tab and collect data first.',
        logs: [...logs],
      });
      return;
    }

    addLog(`Sprint: ${currentSprint.sprint.name}`);
    addLog(`Issues count: ${currentSprint.issues.length}`);
    addLog('Running AI analysis...');

    // Run strategic analysis
    const analysis = await performStrategicAnalysis(
      activeVersion as VersionMeta | undefined,
      currentSprint as SprintCardData,
      previousSprint as SprintCardData | undefined,
      params.mockMode ?? false,
    );

    // Save analysis to state
    state.analysis = analysis ?? null;

    addLog('Analysis complete');

    const response: AnalyzeResponse = {
      analysis: analysis ?? null,
      logs: [...logs],
    };

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addLog(`ERROR: ${message}`);
    logger.error('AI analysis failed', { error: message });

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
  console.log(`\nEndpoints (stateful workflow):`);
  console.log(`  GET  /api/ping            - Health check`);
  console.log(`  POST /api/clear           - Clear server state`);
  console.log(`  POST /api/collect-data    - Step 1: Collect sprint data from Jira`);
  console.log(`  POST /api/analyze-data    - Step 2: AI analysis of collected data`);
  console.log(`  POST /api/generate-report - Step 3: Generate report from state`);
  console.log(`\nMOCK_MODE: ${process.env.MOCK_MODE === 'true' ? 'ON' : 'OFF'}\n`);
});
