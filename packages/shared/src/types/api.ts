/**
 * API request/response types used across CLI and Web.
 */

import type { BasicBoardSprintData, SprintCardData } from './board';
import type { SprintInfo } from './sprint';
import type { VersionMeta } from './version';
import type { StrategicAnalysis } from './analysis';
import type { SprintDataValidationResult } from './validation';

// =============================================================================
// Request Types
// =============================================================================

export interface SprintReportParams {
  boardId?: string;
  sprintId?: string;
  sprintName?: string;
  mockMode?: boolean;
}

export interface AnalyzeDataParams {
  activeVersion?: VersionMeta;
  currentSprint?: SprintCardData;
  previousSprint?: SprintCardData;
  mockMode?: boolean;
}

// =============================================================================
// Response Types
// =============================================================================

export interface CollectDataResponse {
  sprint?: Partial<SprintInfo>;
  basicBoardData?: BasicBoardSprintData | null;
  dataValidation?: SprintDataValidationResult | null;
  logs?: string[];
}

export interface GenerateReportResponse {
  sprint?: Partial<SprintInfo>;
  reportMarkdown?: string;
  logs?: string[];
}

export interface AnalyzeResponse {
  analysis?: StrategicAnalysis | null;
  logs?: string[];
}

export interface PublishToNotionParams {
  title: string;
  markdown: string;
}

export interface PublishToNotionResponse {
  pageId: string;
  pageUrl: string;
  logs?: string[];
}

