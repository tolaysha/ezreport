export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
}

export interface JiraStatus {
  name: string;
  statusCategory: {
    key: string;
    name: string;
  };
}

export interface JiraIssueFields {
  summary: string;
  status: JiraStatus;
  assignee: JiraUser | null;
  // Story points - might be in different fields depending on Jira config
  customfield_10016?: number; // Common story points field
  [key: string]: unknown;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: JiraIssueFields;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'closed' | 'future';
  startDate?: string;
  endDate?: string;
  goal?: string;
}

export interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
  maxResults: number;
  startAt: number;
}

// New Jira API response format (POST /rest/api/3/search/jql)
export interface JiraSearchJqlResponse {
  issues: JiraIssue[];
  isLast: boolean;
  nextPageToken?: string;
}

export interface JiraSprintResponse {
  values: JiraSprint[];
  isLast: boolean;
}

// Parsed issue with normalized fields
export interface ParsedJiraIssue {
  key: string;
  summary: string;
  status: string;
  statusCategory: string; // 'done' | 'in_progress' | 'todo'
  storyPoints: number | null;
  assignee: string | null;
  artifact: string | null;
}

export interface SprintData {
  sprint: JiraSprint;
  issues: ParsedJiraIssue[];
}

// =============================================================================
// Project & Version Types
// =============================================================================

/**
 * Jira project (simplified).
 */
export interface JiraProject {
  id: string;
  key: string;
  name: string;
}

/**
 * Jira project response from board endpoint.
 */
export interface JiraBoardProjectResponse {
  values: JiraProject[];
}

/**
 * Jira version (release).
 * See: GET /rest/api/3/project/{projectIdOrKey}/versions
 */
export interface JiraVersion {
  id: string;
  name: string;
  description?: string;
  /** Release date in ISO format (YYYY-MM-DD) */
  releaseDate?: string;
  /** Whether this version has been released */
  released: boolean;
  /** Whether this version is archived */
  archived: boolean;
  /** Project ID this version belongs to */
  projectId: number;
}

