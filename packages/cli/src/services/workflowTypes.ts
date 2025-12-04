/**
 * Types for the sprint report workflow.
 * Re-exports shared types and defines workflow-specific types.
 */

import type { SupportedLanguage } from '../i18n/language';

// Re-export shared types for backward compatibility
export type {
  SprintIssue,
  SprintInfo,
  VersionMeta,
  VersionBlockInfo,
  SprintReportStructured,
  NotionPageResult,
  ValidationError,
  ValidationWarning,
  GoalIssueMatchAssessment,
  SprintDataValidationResult,
  PartnerReadinessAssessment,
  SprintReportValidationResult,
  BasicBoardSprintData,
} from '@ezreport/shared';

// =============================================================================
// Workflow-specific Types
// =============================================================================

/**
 * Parameters for collecting sprint data
 */
export interface CollectSprintDataParams {
  sprintNameOrId: string;
  boardId?: string;
  versionMeta?: Partial<import('@ezreport/shared').VersionBlockInfo>;
  language?: SupportedLanguage;
  mockMode?: boolean;
}

/**
 * Result of data collection (before validation)
 */
export interface CollectedSprintData {
  sprintInfo: import('@ezreport/shared').SprintInfo;
  issues: import('@ezreport/shared').SprintIssue[];
  demoIssues: import('@ezreport/shared').SprintIssue[];
  versionMeta: Partial<import('@ezreport/shared').VersionBlockInfo> | undefined;
  stats: {
    totalIssues: number;
    doneIssues: number;
    notDoneIssues: number;
    totalStoryPoints: number;
    completedStoryPoints: number;
    progressPercent: number;
  };
}

/**
 * Context for generating a specific report block
 */
export interface BlockGenerationContext {
  sprintInfo: import('@ezreport/shared').SprintInfo;
  issues: import('@ezreport/shared').SprintIssue[];
  demoIssues: import('@ezreport/shared').SprintIssue[];
  versionMeta: Partial<import('@ezreport/shared').VersionBlockInfo> | undefined;
  stats: CollectedSprintData['stats'];
  goalIssueMatch: import('@ezreport/shared').GoalIssueMatchAssessment | null;
  language?: SupportedLanguage;
}

/**
 * Parameters for the full workflow
 */
export interface SprintReportWorkflowParams {
  sprintNameOrId: string;
  versionMeta?: Partial<import('@ezreport/shared').VersionBlockInfo>;
  dryRun?: boolean;
  language?: SupportedLanguage;
}

/**
 * Workflow step status
 */
export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/**
 * Result of the full workflow
 */
export interface SprintReportWorkflowResult {
  success: boolean;
  sprint: import('@ezreport/shared').SprintInfo | null;
  collectedData: CollectedSprintData | null;
  dataValidation: import('@ezreport/shared').SprintDataValidationResult | null;
  report: import('@ezreport/shared').SprintReportStructured | null;
  reportValidation: import('@ezreport/shared').SprintReportValidationResult | null;
  notionPage: import('@ezreport/shared').NotionPageResult | null;
  error?: string;
  abortReason?: string;
  basicBoardData?: import('@ezreport/shared').BasicBoardSprintData;
}

// =============================================================================
// Validation Rule Codes
// =============================================================================

export const DataValidationCodes = {
  SPRINT_NAME_MISSING: 'SPRINT_NAME_MISSING',
  SPRINT_DATES_MISSING: 'SPRINT_DATES_MISSING',
  SPRINT_GOAL_MISSING: 'SPRINT_GOAL_MISSING',
  ISSUE_KEY_MISSING: 'ISSUE_KEY_MISSING',
  ISSUE_SUMMARY_MISSING: 'ISSUE_SUMMARY_MISSING',
  ISSUE_STATUS_MISSING: 'ISSUE_STATUS_MISSING',
  ISSUE_STATUS_CATEGORY_MISSING: 'ISSUE_STATUS_CATEGORY_MISSING',
  SPRINT_GOAL_TOO_SHORT: 'SPRINT_GOAL_TOO_SHORT',
  GOAL_ISSUE_MATCH_WEAK: 'GOAL_ISSUE_MATCH_WEAK',
  NO_DONE_ISSUES: 'NO_DONE_ISSUES',
  NO_STORY_POINTS: 'NO_STORY_POINTS',
} as const;

export const ReportValidationCodes = {
  SECTION_MISSING: 'SECTION_MISSING',
  SECTION_EMPTY: 'SECTION_EMPTY',
  WRONG_LANGUAGE: 'WRONG_LANGUAGE',
  NOT_RUSSIAN: 'NOT_RUSSIAN',
  PLACEHOLDER_DETECTED: 'PLACEHOLDER_DETECTED',
  SPRINT_NUMBER_MISMATCH: 'SPRINT_NUMBER_MISMATCH',
  DATES_MISMATCH: 'DATES_MISMATCH',
  PROGRESS_OUT_OF_RANGE: 'PROGRESS_OUT_OF_RANGE',
  INVALID_ISSUE_KEY_REFERENCE: 'INVALID_ISSUE_KEY_REFERENCE',
  NOT_PARTNER_READY: 'NOT_PARTNER_READY',
} as const;
