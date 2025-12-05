/**
 * Sprint report types used across CLI and Web.
 */

import type { VersionBlockInfo } from './version';

/**
 * Sprint block info for report.
 */
export interface SprintBlockInfo {
  number: string;
  startDate: string;
  endDate: string;
  goal: string;
  progressPercent: number;
}

export interface NotDoneItem {
  title: string;
  reason: string;
  requiredForCompletion: string;
  newDeadline: string;
}

export interface AchievementItem {
  title: string;
  description: string;
}

export interface ArtifactItem {
  title: string;
  description: string;
  jiraLink?: string;
  attachmentsNote?: string;
}

export interface NextSprintPlan {
  sprintNumber: string;
  goal: string;
}

export interface BlockerItem {
  title: string;
  description: string;
  resolutionProposal: string;
}

export interface PMQuestionOrProposal {
  title: string;
  description: string;
}

/**
 * The fully structured sprint report matching the Notion template.
 */
export interface SprintReportStructured {
  version: VersionBlockInfo;
  sprint: SprintBlockInfo;
  overview: string;
  notDone: NotDoneItem[];
  achievements: AchievementItem[];
  artifacts: ArtifactItem[];
  nextSprint: NextSprintPlan;
  blockers: BlockerItem[];
  pmQuestions: PMQuestionOrProposal[];
}

/**
 * Result of creating a Notion page.
 */
export interface NotionPageResult {
  id: string;
  url: string;
}


