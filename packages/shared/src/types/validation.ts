/**
 * Validation types used across CLI and Web.
 */

export interface ValidationMessage {
  code?: string;
  message: string;
  details?: string | Record<string, unknown>;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface GoalIssueMatchAssessment {
  matchLevel: 'strong' | 'medium' | 'weak';
  comment: string;
}

export interface SprintDataValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  goalIssueMatch?: GoalIssueMatchAssessment | null;
}

export interface PartnerReadinessAssessment {
  isPartnerReady: boolean;
  comments: string[];
}

export interface SprintReportValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  partnerReadiness?: PartnerReadinessAssessment | null;
}


