/**
 * Re-export domain types from shared package.
 * This file maintains backward compatibility with existing imports.
 */

export type {
  // Version types
  VersionBlockInfo as VersionMeta,
  
  // Sprint types  
  SprintBlockInfo as SprintMeta,
  SprintIssue,
  
  // Report types
  NotDoneItem,
  AchievementItem,
  ArtifactItem,
  NextSprintPlan,
  BlockerItem,
  PMQuestionOrProposal,
  SprintReportStructured,
  NotionPageResult,
} from '@ezreport/shared';
