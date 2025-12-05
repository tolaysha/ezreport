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
 * Prediction of sprint completion.
 */
export interface CompletionPrediction {
  /** Confidence level 0-100% that all tasks will be completed on time */
  confidencePercent: number;
  /** Explanation of the prediction */
  comment: string;
  /** Key risks that could affect completion */
  risks?: string[];
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
  /** AI prediction of sprint completion */
  completionPrediction?: CompletionPrediction;
}

/**
 * Goal alignment result.
 */
export interface GoalAlignmentResult {
  level: 'strong' | 'medium' | 'weak' | 'unknown';
  comment: string;
}


