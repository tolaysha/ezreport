/**
 * Jira Field Schema - Single Source of Truth
 * 
 * This file defines all Jira fields used in the application.
 * To add a new field:
 * 1. Add it to JIRA_ISSUE_FIELDS array
 * 2. Add extractor function if needed
 * 3. Update SprintIssue type in @ezreport/shared if the field should be exposed
 */

import { JIRA_CONFIG } from '../config';

// =============================================================================
// Field Definitions
// =============================================================================

/**
 * Standard Jira fields (non-custom).
 */
export const STANDARD_FIELDS = [
  'summary',
  'status',
  'assignee',
  'issuetype',
  'priority',
  'parent',
  'timeoriginalestimate',
] as const;

/**
 * Custom field IDs.
 * These may vary between Jira instances.
 */
export const CUSTOM_FIELDS = {
  /** Story points (most common field ID) */
  storyPoints: 'customfield_10016',
  /** Story points (alternative field ID) */
  storyPointsAlt: 'customfield_10004',
  /** Epic link (classic Jira) */
  epicLink: 'customfield_10014',
  /** Artifact field (configurable via env) */
  artifact: JIRA_CONFIG.artifactFieldId,
} as const;

/**
 * All fields to request from Jira API.
 * This array is passed directly to the Jira search API.
 */
export function getJiraIssueFields(): string[] {
  return [
    ...STANDARD_FIELDS,
    CUSTOM_FIELDS.storyPoints,
    CUSTOM_FIELDS.storyPointsAlt,
    CUSTOM_FIELDS.epicLink,
    CUSTOM_FIELDS.artifact,
  ].filter((field, index, arr) => arr.indexOf(field) === index); // Remove duplicates
}

// =============================================================================
// Field Extractors
// =============================================================================

/**
 * Generic type for Jira field values.
 */
type JiraFieldValue = unknown;

/**
 * Extract story points from issue fields.
 * Tries multiple custom field IDs as different Jira instances use different fields.
 */
export function extractStoryPoints(fields: Record<string, JiraFieldValue>): number | null {
  const primary = fields[CUSTOM_FIELDS.storyPoints];
  if (typeof primary === 'number') return primary;
  
  const alt = fields[CUSTOM_FIELDS.storyPointsAlt];
  if (typeof alt === 'number') return alt;
  
  return null;
}

/**
 * Extract artifact value from issue fields.
 * Handles both string and object formats.
 */
export function extractArtifact(fields: Record<string, JiraFieldValue>): string | null {
  const value = fields[CUSTOM_FIELDS.artifact];
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (value && typeof value === 'object' && 'value' in value) {
    return String((value as { value: unknown }).value);
  }
  
  return null;
}

/**
 * Extract issue type name from fields.
 */
export function extractIssueType(fields: Record<string, JiraFieldValue>): string | undefined {
  const issuetype = fields.issuetype as { name?: string } | undefined;
  return issuetype?.name;
}

/**
 * Extract priority name from fields.
 */
export function extractPriority(fields: Record<string, JiraFieldValue>): string | undefined {
  const priority = fields.priority as { name?: string } | undefined;
  return priority?.name;
}

/**
 * Extract assignee display name from fields.
 */
export function extractAssignee(fields: Record<string, JiraFieldValue>): string | null {
  const assignee = fields.assignee as { displayName?: string } | null;
  return assignee?.displayName ?? null;
}

/**
 * Extract status info from fields.
 */
export function extractStatus(fields: Record<string, JiraFieldValue>): {
  name: string;
  categoryKey: string;
} {
  const status = fields.status as {
    name: string;
    statusCategory: { key: string };
  };
  return {
    name: status.name,
    categoryKey: status.statusCategory.key,
  };
}

/**
 * Extract parent key from fields (for subtasks).
 */
export function extractParentKey(fields: Record<string, JiraFieldValue>): string | undefined {
  const parent = fields.parent as { key?: string } | undefined;
  return parent?.key;
}

/**
 * Extract epic key from fields.
 * Checks both the classic epic link field and parent for epic type.
 */
export function extractEpicKey(fields: Record<string, JiraFieldValue>): string | undefined {
  // Check classic epic link field first
  const epicLink = fields[CUSTOM_FIELDS.epicLink] as string | undefined;
  if (epicLink) return epicLink;
  
  // Check if parent is an Epic
  const parent = fields.parent as {
    key?: string;
    fields?: {
      issuetype?: { name?: string };
    };
  } | undefined;
  
  const parentType = parent?.fields?.issuetype?.name;
  if (parentType === 'Epic' && parent?.key) {
    return parent.key;
  }
  
  return undefined;
}

/**
 * Extract original estimate from fields.
 * Returns the original estimate in seconds, or null if not set.
 * Jira stores this in the 'timeoriginalestimate' field.
 */
export function extractOriginalEstimate(fields: Record<string, JiraFieldValue>): number | null {
  const estimate = fields.timeoriginalestimate;
  if (typeof estimate === 'number') {
    return estimate;
  }
  return null;
}

// =============================================================================
// Combined Extractor
// =============================================================================

/**
 * Extract all issue data from Jira fields.
 * This is the main function to use when converting Jira issues.
 */
export function extractIssueData(issueKey: string, fields: Record<string, JiraFieldValue>) {
  const status = extractStatus(fields);
  
  return {
    key: issueKey,
    summary: fields.summary as string,
    status: status.name,
    statusCategory: status.categoryKey,
    storyPoints: extractStoryPoints(fields),
    assignee: extractAssignee(fields),
    artifact: extractArtifact(fields),
    issueType: extractIssueType(fields),
    priority: extractPriority(fields),
    parentKey: extractParentKey(fields),
    epicKey: extractEpicKey(fields),
    originalEstimateSeconds: extractOriginalEstimate(fields),
  };
}


