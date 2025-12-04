export interface SprintReportParams {
  boardId?: string;
  sprintId?: string;
  sprintName?: string;
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
// Basic Board Sprint Data Types
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

// =============================================================================
// API Response Types
// =============================================================================

export interface CollectDataResponse {
  sprint?: SprintInfo;
  basicBoardData?: BasicBoardSprintData | null;
  dataValidation?: SprintDataValidationResult | null;
  logs?: string[];
}

export interface GenerateReportResponse {
  sprint?: SprintInfo;
  report?: SprintReportStructured | null;
  reportValidation?: SprintReportValidationResult | null;
  notionPage?: NotionPageResult | null;
  logs?: string[];
}

export interface AnalyzeResponse {
  analysis?: StrategicAnalysis | null;
  logs?: string[];
}

export interface AnalyzeDataParams {
  activeVersion?: VersionMeta;
  currentSprint?: SprintCardData;
  previousSprint?: SprintCardData;
  mockMode?: boolean;
}
