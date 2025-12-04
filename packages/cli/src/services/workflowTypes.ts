/**
 * Types for the sprint report workflow.
 * Supports three-stage validation and generation pipeline.
 */

import type {
  NotionPageResult,
  SprintIssue,
  SprintReportStructured,
  VersionMeta,
} from '../ai/types';
import type { SupportedLanguage } from '../i18n/language';

// =============================================================================
// Domain Types for Workflow
// =============================================================================

/**
 * Sprint information in domain terms (not raw Jira).
 * Used throughout the workflow.
 */
export interface SprintInfo {
  id: number | string;
  name: string;
  number: string;
  startDate: string | undefined;
  endDate: string | undefined;
  goal: string | undefined;
}

// =============================================================================
// Step 1: Data Collection & Validation
// =============================================================================

/**
 * Parameters for collecting sprint data
 */
export interface CollectSprintDataParams {
  sprintNameOrId: string;
  boardId?: string;
  versionMeta?: Partial<VersionMeta>;
  language: SupportedLanguage;
}

/**
 * Result of data collection (before validation)
 */
export interface CollectedSprintData {
  sprintInfo: SprintInfo;
  issues: SprintIssue[];
  demoIssues: SprintIssue[];
  versionMeta: Partial<VersionMeta> | undefined;
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
 * Severity level for validation results
 */
export type ValidationSeverity = 'error' | 'warning';

/**
 * A single validation error
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

/**
 * A single validation warning
 */
export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

/**
 * Goal-to-issues match assessment from AI
 */
export interface GoalIssueMatchAssessment {
  matchLevel: 'strong' | 'medium' | 'weak';
  comment: string;
}

/**
 * Result of sprint data validation (Step 1)
 */
export interface SprintDataValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  goalIssueMatch: GoalIssueMatchAssessment | null;
}

// =============================================================================
// Step 2: Report Generation
// =============================================================================

/**
 * Context for generating a specific report block
 */
export interface BlockGenerationContext {
  sprintInfo: SprintInfo;
  issues: SprintIssue[];
  demoIssues: SprintIssue[];
  versionMeta: Partial<VersionMeta> | undefined;
  stats: CollectedSprintData['stats'];
  goalIssueMatch: GoalIssueMatchAssessment | null;
  language: SupportedLanguage;
}

// =============================================================================
// Step 3: Report Validation
// =============================================================================

/**
 * Partner-readiness assessment from AI
 */
export interface PartnerReadinessAssessment {
  isPartnerReady: boolean;
  comments: string[];
}

/**
 * Result of final report validation (Step 3)
 */
export interface SprintReportValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  partnerReadiness: PartnerReadinessAssessment | null;
}

// =============================================================================
// Workflow Orchestrator
// =============================================================================

/**
 * Parameters for the full workflow
 */
export interface SprintReportWorkflowParams {
  sprintNameOrId: string;
  versionMeta?: Partial<VersionMeta>;
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
  sprint: SprintInfo | null;
  collectedData: CollectedSprintData | null;
  dataValidation: SprintDataValidationResult | null;
  report: SprintReportStructured | null;
  reportValidation: SprintReportValidationResult | null;
  notionPage: NotionPageResult | null;
  error?: string;
  abortReason?: string;
}

// =============================================================================
// Validation Rule Codes
// =============================================================================

/**
 * Data validation error/warning codes
 */
export const DataValidationCodes = {
  // Errors
  SPRINT_NAME_MISSING: 'SPRINT_NAME_MISSING',
  SPRINT_DATES_MISSING: 'SPRINT_DATES_MISSING',
  SPRINT_GOAL_MISSING: 'SPRINT_GOAL_MISSING',
  ISSUE_KEY_MISSING: 'ISSUE_KEY_MISSING',
  ISSUE_SUMMARY_MISSING: 'ISSUE_SUMMARY_MISSING',
  ISSUE_STATUS_MISSING: 'ISSUE_STATUS_MISSING',
  ISSUE_STATUS_CATEGORY_MISSING: 'ISSUE_STATUS_CATEGORY_MISSING',
  // Warnings
  SPRINT_GOAL_TOO_SHORT: 'SPRINT_GOAL_TOO_SHORT',
  GOAL_ISSUE_MATCH_WEAK: 'GOAL_ISSUE_MATCH_WEAK',
  NO_DONE_ISSUES: 'NO_DONE_ISSUES',
  NO_STORY_POINTS: 'NO_STORY_POINTS',
} as const;

/**
 * Report validation error/warning codes
 */
export const ReportValidationCodes = {
  // Errors
  SECTION_MISSING: 'SECTION_MISSING',
  SECTION_EMPTY: 'SECTION_EMPTY',
  WRONG_LANGUAGE: 'WRONG_LANGUAGE',
  PLACEHOLDER_DETECTED: 'PLACEHOLDER_DETECTED',
  // Warnings
  SPRINT_NUMBER_MISMATCH: 'SPRINT_NUMBER_MISMATCH',
  DATES_MISMATCH: 'DATES_MISMATCH',
  PROGRESS_OUT_OF_RANGE: 'PROGRESS_OUT_OF_RANGE',
  INVALID_ISSUE_KEY_REFERENCE: 'INVALID_ISSUE_KEY_REFERENCE',
  NOT_PARTNER_READY: 'NOT_PARTNER_READY',
} as const;

