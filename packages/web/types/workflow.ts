export type WorkflowStep = "collect" | "generate" | "validate" | "full";

export interface SprintReportWorkflowParams {
  sprintId?: string;
  sprintName?: string;
  boardId?: string;
  extra?: Record<string, unknown>;
  mockMode?: boolean;
}

export interface SprintInfo {
  id?: string;
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export interface ValidationMessage {
  code?: string;
  message: string;
  details?: string;
}

export interface SprintDataValidationResult {
  isValid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  goalIssueMatchLevel?: "strong" | "medium" | "weak";
  goalIssueMatchComment?: string;
}

export interface SprintReportStructured {
  version?: string;
  sprint?: string;
  overview?: string;
  notDone?: string;
  achievements?: string;
  artifacts?: string;
  nextSprint?: string;
  blockers?: string;
  pmQuestions?: string;
}

export interface PartnerReadiness {
  isPartnerReady?: boolean;
  comments?: string[];
}

export interface SprintReportValidationResult {
  isValid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  partnerReadiness?: PartnerReadiness;
}

export interface NotionPageResult {
  id?: string;
  url?: string;
}

// =============================================================================
// Basic Board Sprint Data Types (Step 1 - Two Sprint Cards)
// =============================================================================

export interface SprintMeta {
  id: string;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
  goal?: string;
  goalIsGenerated?: boolean;
}

export interface SprintIssue {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  storyPoints: number | null;
  assignee: string | null;
  artifact: string | null;
}

export type GoalMatchLevel = 'strong' | 'medium' | 'weak' | 'unknown';
export type AlignmentLevel = 'aligned' | 'partial' | 'misaligned' | 'unknown';

export interface SprintCardData {
  sprint: SprintMeta;
  issues: SprintIssue[];
  goalMatchLevel: GoalMatchLevel;
  goalMatchComment: string;
  recommendedArtifactIssues: SprintIssue[];
}

export interface VersionMeta {
  id: string;
  name: string;
  description?: string;
  releaseDate?: string;
  released: boolean;
  progressPercent?: number;
}

export interface VersionSprintAlignment {
  level: AlignmentLevel;
  comment: string;
  recommendations?: string[];
}

export interface SprintTasksAlignment {
  level: AlignmentLevel;
  comment: string;
  directlyRelatedPercent?: number;
  unrelatedTasks?: string[];
}

export interface DemoRecommendation {
  issueKey: string;
  summary: string;
  wowFactor: string;
  demoComplexity: number;
  suggestedFormat: 'video' | 'screenshot' | 'live' | 'slides';
}

export interface StrategicAnalysis {
  versionSprintAlignment: VersionSprintAlignment;
  sprintTasksAlignment: SprintTasksAlignment;
  overallScore: number;
  summary: string;
  demoRecommendations?: DemoRecommendation[];
}

export interface BasicBoardSprintData {
  boardId: string;
  projectKey?: string;
  projectName?: string;
  activeVersion?: VersionMeta;
  previousSprint?: SprintCardData;
  currentSprint?: SprintCardData;
  analysis?: StrategicAnalysis;
  availability: {
    hasPreviousSprint: boolean;
    hasCurrentSprint: boolean;
  };
}

/** Debug info for a single report block (used in Stage 2 UI) */
export interface SprintReportBlockDebug {
  blockId: string;
  title: string;
  promptTemplate?: string;
  inputDataPreview?: unknown;
  lastResultText?: string;
}

export interface SprintReportWorkflowResult {
  sprint?: SprintInfo;
  dataValidation?: SprintDataValidationResult | null;
  report?: SprintReportStructured | null;
  reportValidation?: SprintReportValidationResult | null;
  notionPage?: NotionPageResult | null;
  /** Optional debug info for block-by-block generation UI */
  blocksDebug?: SprintReportBlockDebug[];
  /** Basic board sprint data for Step 1 - two sprint cards */
  basicBoardData?: BasicBoardSprintData | null;
}

export interface RunStepResponse {
  step: WorkflowStep;
  params: SprintReportWorkflowParams;
  result: SprintReportWorkflowResult | null;
  logs?: string[];
}
