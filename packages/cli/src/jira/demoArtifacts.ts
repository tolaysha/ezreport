/**
 * Fetches demo artifacts (images from comments starting with "demo") from Jira.
 */

import type { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

/**
 * Demo artifact - an image attached to a demo comment.
 */
export interface DemoArtifact {
  /** Issue key this artifact belongs to */
  issueKey: string;
  /** Issue summary for context */
  issueSummary: string;
  /** Image URL */
  imageUrl: string;
  /** Image thumbnail URL (if available) */
  thumbnailUrl?: string;
  /** Image filename */
  filename: string;
  /** Comment text (first line or excerpt) */
  commentExcerpt: string;
  /** Comment author */
  author: string;
  /** Comment creation date */
  created: string;
}

interface JiraCommentAuthor {
  displayName: string;
}

interface JiraCommentContent {
  type: string;
  content?: JiraCommentContent[];
  text?: string;
  attrs?: {
    id?: string;
    url?: string;
  };
}

interface JiraComment {
  id: string;
  author: JiraCommentAuthor;
  body: {
    type: string;
    content: JiraCommentContent[];
  };
  created: string;
}

interface JiraCommentsResponse {
  comments: JiraComment[];
  total: number;
}

interface JiraAttachment {
  id: string;
  filename: string;
  mimeType: string;
  content: string; // URL to download
  thumbnail?: string;
}

/**
 * Extract text from Jira comment body (ADF format).
 */
function extractTextFromADF(content: JiraCommentContent[]): string {
  const parts: string[] = [];
  
  for (const node of content) {
    if (node.type === 'text' && node.text) {
      parts.push(node.text);
    } else if (node.content) {
      parts.push(extractTextFromADF(node.content));
    }
  }
  
  return parts.join(' ').trim();
}

/**
 * Extract media IDs from Jira comment body (ADF format).
 */
function extractMediaIds(content: JiraCommentContent[]): string[] {
  const ids: string[] = [];
  
  for (const node of content) {
    if (node.type === 'mediaSingle' && node.content) {
      for (const media of node.content) {
        if (media.type === 'media' && media.attrs?.id) {
          ids.push(media.attrs.id);
        }
      }
    } else if (node.content) {
      ids.push(...extractMediaIds(node.content));
    }
  }
  
  return ids;
}

/**
 * Fetch comments for an issue.
 */
async function fetchIssueComments(
  client: AxiosInstance,
  issueKey: string,
): Promise<JiraComment[]> {
  try {
    const response = await client.get<JiraCommentsResponse>(
      `/rest/api/3/issue/${issueKey}/comment`,
    );
    return response.data.comments;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`[fetchIssueComments] Failed to fetch comments for ${issueKey}`, { error: message });
    return [];
  }
}

/**
 * Fetch attachments for an issue.
 */
async function fetchIssueAttachments(
  client: AxiosInstance,
  issueKey: string,
): Promise<JiraAttachment[]> {
  try {
    const response = await client.get<{ fields: { attachment: JiraAttachment[] } }>(
      `/rest/api/3/issue/${issueKey}`,
      { params: { fields: 'attachment' } },
    );
    return response.data.fields.attachment || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`[fetchIssueAttachments] Failed to fetch attachments for ${issueKey}`, { error: message });
    return [];
  }
}

/**
 * Check if comment starts with "demo" (case-insensitive).
 */
function isDemoComment(commentText: string): boolean {
  return commentText.toLowerCase().trim().startsWith('demo');
}

/**
 * Check if attachment is an image.
 */
function isImageAttachment(attachment: JiraAttachment): boolean {
  return attachment.mimeType.startsWith('image/');
}

/**
 * Fetch demo artifacts for a list of issues.
 * Returns images from comments that start with "demo".
 */
export async function fetchDemoArtifacts(
  client: AxiosInstance,
  issues: Array<{ key: string; summary: string }>,
): Promise<DemoArtifact[]> {
  const artifacts: DemoArtifact[] = [];
  
  logger.info(`[fetchDemoArtifacts] Fetching demo artifacts for ${issues.length} issues...`);
  
  // Process issues in parallel (with limit)
  const batchSize = 5;
  for (let i = 0; i < issues.length; i += batchSize) {
    const batch = issues.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (issue) => {
      try {
        // Fetch comments and attachments in parallel
        const [comments, attachments] = await Promise.all([
          fetchIssueComments(client, issue.key),
          fetchIssueAttachments(client, issue.key),
        ]);
        
        // Create a map of attachment ID -> attachment
        const attachmentMap = new Map<string, JiraAttachment>();
        for (const att of attachments) {
          attachmentMap.set(att.id, att);
          // Also try matching by filename in case ID doesn't match
          attachmentMap.set(att.filename, att);
        }
        
        // Find demo comments with images
        for (const comment of comments) {
          const commentText = extractTextFromADF(comment.body.content);
          
          if (!isDemoComment(commentText)) {
            continue;
          }
          
          // Extract media IDs from comment
          const mediaIds = extractMediaIds(comment.body.content);
          
          // Find matching image attachments
          for (const mediaId of mediaIds) {
            const attachment = attachmentMap.get(mediaId);
            if (attachment && isImageAttachment(attachment)) {
              artifacts.push({
                issueKey: issue.key,
                issueSummary: issue.summary,
                imageUrl: attachment.content,
                thumbnailUrl: attachment.thumbnail,
                filename: attachment.filename,
                commentExcerpt: commentText.slice(0, 100) + (commentText.length > 100 ? '...' : ''),
                author: comment.author.displayName,
                created: comment.created,
              });
            }
          }
          
          // If no media IDs found in comment, check if any image attachments exist
          // and were uploaded around the same time as the comment
          if (mediaIds.length === 0) {
            const imageAttachments = attachments.filter(isImageAttachment);
            for (const attachment of imageAttachments) {
              // Simple heuristic: if attachment filename contains "demo" or "screen"
              const filename = attachment.filename.toLowerCase();
              if (filename.includes('demo') || filename.includes('screen') || filename.includes('снимок')) {
                artifacts.push({
                  issueKey: issue.key,
                  issueSummary: issue.summary,
                  imageUrl: attachment.content,
                  thumbnailUrl: attachment.thumbnail,
                  filename: attachment.filename,
                  commentExcerpt: commentText.slice(0, 100) + (commentText.length > 100 ? '...' : ''),
                  author: comment.author.displayName,
                  created: comment.created,
                });
              }
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(`[fetchDemoArtifacts] Error processing issue ${issue.key}`, { error: message });
      }
    }));
  }
  
  logger.info(`[fetchDemoArtifacts] Found ${artifacts.length} demo artifacts`);
  return artifacts;
}

