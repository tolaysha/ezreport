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
}

export interface RunStepResponse {
  step: WorkflowStep;
  params: SprintReportWorkflowParams;
  result: SprintReportWorkflowResult | null;
  logs?: string[];
}
