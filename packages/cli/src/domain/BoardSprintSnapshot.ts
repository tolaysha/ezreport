/**
 * Re-export domain types from shared package.
 * This file maintains backward compatibility with existing imports.
 */

export type {
  // Version types
  VersionMeta,
  
  // Sprint types
  SprintMeta,
  SprintIssue,
  GoalMatchLevel,
  SprintCardData,
  
  // Analysis types
  AlignmentLevel,
  VersionSprintAlignment,
  SprintTasksAlignment,
  DemoRecommendation,
  StrategicAnalysis,
  GoalAlignmentResult,
  
  // Board types
  BoardDataAvailability,
  BasicBoardSprintData,
} from '@ezreport/shared';
