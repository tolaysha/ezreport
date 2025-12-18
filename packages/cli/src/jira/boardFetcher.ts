/**
 * Jira board data fetching utilities.
 */

import axios, { type AxiosInstance } from 'axios';

import type { SprintMeta, SprintIssue, VersionMeta, SprintEpic, DemoArtifact } from '@ezreport/shared';
import { JIRA_CONFIG } from '../config';
import { logger } from '../utils/logger';
import type {
  JiraSprint,
  JiraSprintResponse,
  JiraIssue,
  JiraProject,
  JiraBoardProjectResponse,
  JiraVersion,
} from './types';
import { getJiraIssueFields, extractIssueData } from './fieldSchema';

// =============================================================================
// Client Creation
// =============================================================================

export function createJiraClient(): AxiosInstance {
  const auth = Buffer.from(
    `${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`,
  ).toString('base64');

  return axios.create({
    baseURL: JIRA_CONFIG.baseUrl,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });
}

// =============================================================================
// Sprint Fetching
// =============================================================================

export async function fetchSprintsForBoard(
  client: AxiosInstance,
  boardId: string,
): Promise<JiraSprint[]> {
  const allSprints: JiraSprint[] = [];
  let startAt = 0;
  const maxResults = 50;

  while (true) {
    const response = await client.get<JiraSprintResponse>(
      `/rest/agile/1.0/board/${boardId}/sprint`,
      { params: { startAt, maxResults } },
    );

    allSprints.push(...response.data.values);

    if (response.data.isLast) {
      break;
    }

    startAt += maxResults;
  }

  return allSprints;
}

// =============================================================================
// Issue Fetching
// =============================================================================

export async function fetchIssuesForSprint(
  client: AxiosInstance,
  sprintId: number,
): Promise<JiraIssue[]> {
  const issues: JiraIssue[] = [];
  const maxResults = 100;
  const jql = `sprint = ${sprintId}`;
  let nextPageToken: string | undefined;

  while (true) {
    const requestBody: {
      jql: string;
      maxResults: number;
      fields: string[];
      nextPageToken?: string;
    } = {
      jql,
      maxResults,
      fields: getJiraIssueFields(),
    };

    if (nextPageToken) {
      requestBody.nextPageToken = nextPageToken;
    }

    const response = await client.post<{
      issues: JiraIssue[];
      isLast: boolean;
      nextPageToken?: string;
    }>('/rest/api/3/search/jql', requestBody);

    issues.push(...response.data.issues);

    if (response.data.isLast || !response.data.nextPageToken) {
      break;
    }

    nextPageToken = response.data.nextPageToken;
  }

  return issues;
}

// =============================================================================
// Project & Version Fetching
// =============================================================================

export async function fetchBoardProject(
  client: AxiosInstance,
  boardId: string,
): Promise<JiraProject | null> {
  try {
    const response = await client.get<JiraBoardProjectResponse>(
      `/rest/agile/1.0/board/${boardId}/project`,
    );

    if (response.data.values.length === 0) {
      logger.warn(`[fetchBoardProject] No projects found for board ${boardId}`);
      return null;
    }

    const project = response.data.values[0];
    logger.info(`[fetchBoardProject] Found project: ${project.key} (${project.name})`);
    return project;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[fetchBoardProject] Failed to fetch project for board ${boardId}`, { error: message });
    return null;
  }
}

export async function fetchProjectVersions(
  client: AxiosInstance,
  projectKey: string,
): Promise<JiraVersion[]> {
  try {
    const response = await client.get<JiraVersion[]>(
      `/rest/api/3/project/${projectKey}/versions`,
    );

    logger.info(`[fetchProjectVersions] Found ${response.data.length} versions for project ${projectKey}`);
    return response.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[fetchProjectVersions] Failed to fetch versions for project ${projectKey}`, { error: message });
    return [];
  }
}

export async function countVersionIssues(
  client: AxiosInstance,
  versionName: string,
): Promise<{ total: number; done: number }> {
  try {
    const escapedName = `"${versionName.replace(/"/g, '\\"')}"`;
    
    const totalResponse = await client.post<{ total: number }>(
      '/rest/api/3/search/jql',
      { jql: `fixVersion = ${escapedName}`, maxResults: 1, fields: ['key'] },
    );

    const doneResponse = await client.post<{ total: number }>(
      '/rest/api/3/search/jql',
      { jql: `fixVersion = ${escapedName} AND statusCategory = Done`, maxResults: 1, fields: ['key'] },
    );

    return {
      total: totalResponse.data.total,
      done: doneResponse.data.total,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[countVersionIssues] Failed to count issues for version ${versionName}`, { error: message });
    return { total: 0, done: 0 };
  }
}

// =============================================================================
// Version Selection
// =============================================================================

export function selectActiveVersion(versions: JiraVersion[]): JiraVersion | null {
  const activeVersions = versions.filter(v => !v.released && !v.archived);

  if (activeVersions.length === 0) {
    logger.warn('[selectActiveVersion] No unreleased versions found');
    return null;
  }

  const withDates = activeVersions.filter(v => v.releaseDate);
  
  if (withDates.length > 0) {
    withDates.sort((a, b) => {
      const dateA = new Date(a.releaseDate!).getTime();
      const dateB = new Date(b.releaseDate!).getTime();
      return dateA - dateB;
    });
    
    logger.info(`[selectActiveVersion] Selected version with earliest release: ${withDates[0].name}`);
    return withDates[0];
  }

  logger.info(`[selectActiveVersion] No versions with dates, using first unreleased: ${activeVersions[0].name}`);
  return activeVersions[0];
}

// =============================================================================
// Converters
// =============================================================================

export function formatDateRussian(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function toSprintMeta(sprint: JiraSprint): SprintMeta {
  return {
    id: String(sprint.id),
    name: sprint.name,
    state: sprint.state,
    startDate: formatDateRussian(sprint.startDate),
    endDate: formatDateRussian(sprint.endDate),
    goal: sprint.goal,
  };
}

export function toSprintIssue(issue: JiraIssue | { key: string; fields: Record<string, unknown> }): SprintIssue {
  return extractIssueData(issue.key, issue.fields as Record<string, unknown>);
}

export function toVersionMeta(
  version: JiraVersion,
  progressPercent: number,
): VersionMeta {
  return {
    id: version.id,
    name: version.name,
    description: version.description,
    releaseDate: formatDateRussian(version.releaseDate),
    released: version.released,
    progressPercent,
  };
}

// =============================================================================
// Epic Fetching
// =============================================================================

interface JiraEpicResponse {
  values: Array<{
    id: number;
    key: string;
    name: string;
    summary: string;
    done: boolean;
  }>;
  isLast: boolean;
}

/**
 * Fetch all epics for a board.
 */
export async function fetchEpicsForBoard(
  client: AxiosInstance,
  boardId: string,
): Promise<Array<{ key: string; name: string; summary: string; done: boolean }>> {
  try {
    const allEpics: Array<{ key: string; name: string; summary: string; done: boolean }> = [];
    let startAt = 0;
    const maxResults = 50;

    while (true) {
      const response = await client.get<JiraEpicResponse>(
        `/rest/agile/1.0/board/${boardId}/epic`,
        { params: { startAt, maxResults } },
      );

      for (const epic of response.data.values) {
        allEpics.push({
          key: epic.key,
          name: epic.name || epic.summary,
          summary: epic.summary,
          done: epic.done,
        });
      }

      if (response.data.isLast) {
        break;
      }
      startAt += maxResults;
    }

    logger.info(`[fetchEpicsForBoard] Found ${allEpics.length} epics for board ${boardId}`);
    return allEpics;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`[fetchEpicsForBoard] Failed to fetch epics for board ${boardId}`, { error: message });
    return [];
  }
}

/**
 * Group sprint issues by epic.
 */
export function groupIssuesByEpic(
  issues: SprintIssue[],
  epics: Array<{ key: string; name: string; summary: string; done: boolean }>,
): SprintEpic[] {
  const epicMap = new Map<string, SprintEpic>();
  
  // Initialize epics that have issues in this sprint
  for (const issue of issues) {
    if (issue.epicKey && !epicMap.has(issue.epicKey)) {
      const epicInfo = epics.find(e => e.key === issue.epicKey);
      if (epicInfo) {
        epicMap.set(issue.epicKey, {
          key: epicInfo.key,
          name: epicInfo.name,
          summary: epicInfo.summary,
          done: epicInfo.done,
          issues: [],
        });
      }
    }
  }
  
  // Group issues by epic
  for (const issue of issues) {
    if (issue.epicKey && epicMap.has(issue.epicKey)) {
      epicMap.get(issue.epicKey)!.issues.push(issue);
    }
  }
  
  // Sort by issue count descending
  const result = Array.from(epicMap.values())
    .sort((a, b) => b.issues.length - a.issues.length);
  
  return result;
}

// =============================================================================
// Combined Fetchers
// =============================================================================

export interface ProjectAndVersionResult {
  project?: { key: string; name: string };
  activeVersion?: VersionMeta;
}

export async function fetchProjectAndActiveVersion(
  client: AxiosInstance,
  boardId: string,
): Promise<ProjectAndVersionResult> {
  const project = await fetchBoardProject(client, boardId);
  if (!project) return {};

  const result: ProjectAndVersionResult = {
    project: { key: project.key, name: project.name },
  };

  const versions = await fetchProjectVersions(client, project.key);
  if (versions.length === 0) return result;

  const activeVersion = selectActiveVersion(versions);
  if (!activeVersion) return result;

  const { total, done } = await countVersionIssues(client, activeVersion.name);
  const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;

  logger.info(`[fetchProjectAndActiveVersion] Version ${activeVersion.name}: ${done}/${total} done (${progressPercent}%)`);

  result.activeVersion = toVersionMeta(activeVersion, progressPercent);
  return result;
}

// =============================================================================
// Demo Artifacts Fetching
// =============================================================================

/**
 * Jira comment with content and attachments.
 */
interface JiraComment {
  id: string;
  body: {
    type: string;
    content: Array<{
      type: string;
      content?: Array<{
        type: string;
        text?: string;
        attrs?: {
          id?: string;
          url?: string;
        };
      }>;
    }>;
  };
  author: {
    displayName: string;
  };
  created: string;
}

/**
 * Jira attachment.
 */
interface JiraAttachment {
  id: string;
  filename: string;
  mimeType: string;
  content: string; // URL to download
  thumbnail?: string; // Thumbnail URL
}

/**
 * Extract plain text from Jira ADF (Atlassian Document Format) body.
 */
function extractTextFromAdf(body: JiraComment['body']): string {
  const parts: string[] = [];
  
  for (const block of body.content || []) {
    if (block.type === 'paragraph' && block.content) {
      for (const inline of block.content) {
        if (inline.type === 'text' && inline.text) {
          parts.push(inline.text);
        }
      }
    }
  }
  
  return parts.join(' ').trim();
}

/**
 * Extract media IDs from Jira ADF body.
 */
function extractMediaIdsFromAdf(body: JiraComment['body']): string[] {
  const mediaIds: string[] = [];
  
  for (const block of body.content || []) {
    if (block.type === 'mediaSingle' && block.content) {
      for (const media of block.content) {
        if (media.type === 'media' && media.attrs?.id) {
          mediaIds.push(media.attrs.id);
        }
      }
    }
  }
  
  return mediaIds;
}

/**
 * Fetch demo artifacts from issue comments.
 * Looks for comments starting with "demo" (case-insensitive) that have image attachments.
 */
export async function fetchDemoArtifactsForIssues(
  client: AxiosInstance,
  issues: SprintIssue[],
): Promise<DemoArtifact[]> {
  const artifacts: DemoArtifact[] = [];
  
  for (const issue of issues) {
    try {
      // Fetch issue with comments and attachments
      const response = await client.get<{
        fields: {
          comment: {
            comments: JiraComment[];
          };
          attachment: JiraAttachment[];
        };
      }>(`/rest/api/3/issue/${issue.key}`, {
        params: {
          fields: 'comment,attachment',
        },
      });
      
      const comments = response.data.fields.comment?.comments || [];
      const attachments = response.data.fields.attachment || [];
      
      // Get all image attachments
      const imageAttachments = attachments.filter(att => att.mimeType.startsWith('image/'));
      
      // Find demo comments
      for (const comment of comments) {
        const text = extractTextFromAdf(comment.body);
        
        // Check if comment starts with "demo" (case-insensitive)
        if (!text.toLowerCase().startsWith('demo')) {
          continue;
        }
        
        // Check if comment has media (images embedded)
        const hasMedia = extractMediaIdsFromAdf(comment.body).length > 0;
        
        if (hasMedia && imageAttachments.length > 0) {
          // Demo comment has embedded media - take all images from this issue
          // (Jira uses different IDs for media in ADF vs attachment IDs)
          for (const att of imageAttachments) {
            artifacts.push({
              issueKey: issue.key,
              issueSummary: issue.summary,
              imageUrl: att.content,
              thumbnailUrl: att.thumbnail,
              filename: att.filename,
              commentExcerpt: text.replace(/^demo\s*/i, '').trim(),
              author: comment.author.displayName,
              created: comment.created,
            });
          }
        } else if (imageAttachments.length > 0) {
          // Demo comment without media but issue has images - could be related
          // Only include if comment mentions filename or is recent
          for (const att of imageAttachments) {
            if (text.toLowerCase().includes(att.filename.toLowerCase())) {
              artifacts.push({
                issueKey: issue.key,
                issueSummary: issue.summary,
                imageUrl: att.content,
                thumbnailUrl: att.thumbnail,
                filename: att.filename,
                commentExcerpt: text.replace(/^demo\s*/i, '').trim(),
                author: comment.author.displayName,
                created: comment.created,
              });
            }
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`[fetchDemoArtifactsForIssues] Failed to fetch comments for ${issue.key}`, { error: message });
    }
  }
  
  logger.info(`[fetchDemoArtifactsForIssues] Found ${artifacts.length} demo artifacts from ${issues.length} issues`);
  return artifacts;
}


