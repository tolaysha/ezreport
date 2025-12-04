/**
 * Strategic analysis types used across CLI and Web.
 */

/**
 * Alignment level for strategic analysis.
 */
export type AlignmentLevel = 'aligned' | 'partial' | 'misaligned' | 'unknown';

/**
 * Analysis of version-sprint goal alignment.
 */
export interface VersionSprintAlignment {
  level: AlignmentLevel;
  comment: string;
  recommendations?: string[];
}

/**
 * Analysis of sprint goal vs actual tasks.
 */
export interface SprintTasksAlignment {
  level: AlignmentLevel;
  comment: string;
  directlyRelatedPercent?: number;
  unrelatedTasks?: string[];
}

/**
 * Demo recommendation for a task.
 */
export interface DemoRecommendation {
  issueKey: string;
  summary: string;
  wowFactor: string;
  demoComplexity: number;
  suggestedFormat: 'video' | 'screenshot' | 'live' | 'slides';
}

/**
 * Overall strategic analysis for the sprint.
 */
export interface StrategicAnalysis {
  versionSprintAlignment: VersionSprintAlignment;
  sprintTasksAlignment: SprintTasksAlignment;
  overallScore: number;
  summary: string;
  demoRecommendations?: DemoRecommendation[];
}

/**
 * Goal alignment result.
 */
export interface GoalAlignmentResult {
  level: 'strong' | 'medium' | 'weak' | 'unknown';
  comment: string;
}

