/**
 * Re-export all types from shared package.
 * This file maintains backward compatibility with existing imports.
 */

export type {
  // Sprint types
  SprintMeta,
  SprintIssue,
  SprintEpic,
  TopAssignee,
  SprintStatistics,
  GoalMatchLevel,
  SprintCardData,
  SprintInfo,
  
  // Version types
  VersionMeta,
  VersionBlockInfo,
  
  // Analysis types
  AlignmentLevel,
  VersionSprintAlignment,
  SprintTasksAlignment,
  DemoRecommendation,
  CompletionPrediction,
  StrategicAnalysis,
  GoalAlignmentResult,
  
  // Report types
  SprintBlockInfo,
  NotDoneItem,
  AchievementItem,
  ArtifactItem,
  NextSprintPlan,
  BlockerItem,
  PMQuestionOrProposal,
  SprintReportStructured,
  NotionPageResult,
  
  // Board types
  BoardDataAvailability,
  BasicBoardSprintData,
  
  // Validation types
  ValidationMessage,
  ValidationError,
  ValidationWarning,
  GoalIssueMatchAssessment,
  SprintDataValidationResult,
  PartnerReadinessAssessment,
  SprintReportValidationResult,
  
  // API types
  SprintReportParams,
  AnalyzeDataParams,
  CollectDataResponse,
  GenerateReportResponse,
  AnalyzeResponse,
} from '@ezreport/shared';
