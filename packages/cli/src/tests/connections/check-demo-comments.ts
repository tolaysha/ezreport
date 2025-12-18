/**
 * Test script to check demo comments in Jira issues.
 * Run with: npx ts-node src/tests/connections/check-demo-comments.ts
 */

import axios from 'axios';
import { JIRA_CONFIG, isJiraConfigured } from '../../config';

interface JiraComment {
  id: string;
  author: { displayName: string };
  body: unknown;
  created: string;
}

interface JiraAttachment {
  id: string;
  filename: string;
  mimeType: string;
  content: string;
  thumbnail?: string;
}

async function checkDemoComments() {
  if (!isJiraConfigured()) {
    console.error('❌ Jira is not configured. Please set JIRA_* env vars.');
    process.exit(1);
  }

  const auth = Buffer.from(
    `${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`,
  ).toString('base64');

  const client = axios.create({
    baseURL: JIRA_CONFIG.baseUrl,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  console.log('🔍 Fetching recent issues from sprint...\n');

  // Get issues from sprint
  const issuesResponse = await client.post('/rest/api/3/search/jql', {
    jql: `sprint in openSprints() OR sprint in closedSprints() ORDER BY updated DESC`,
    maxResults: 10,
    fields: ['summary', 'comment', 'attachment'],
  });

  console.log(`📋 Found ${issuesResponse.data.issues.length} issues\n`);

  for (const issue of issuesResponse.data.issues) {
    console.log('='.repeat(70));
    console.log(`Issue: ${issue.key} - ${issue.fields.summary}`);
    console.log('-'.repeat(70));

    // Fetch comments separately (more reliable)
    try {
      const commentsResponse = await client.get<{ comments: JiraComment[] }>(
        `/rest/api/3/issue/${issue.key}/comment`,
      );
      
      const comments = commentsResponse.data.comments;
      console.log(`\n💬 Comments (${comments.length}):`);
      
      if (comments.length === 0) {
        console.log('   No comments');
      }
      
      for (const comment of comments) {
        console.log(`\n   --- Comment by ${comment.author.displayName} ---`);
        console.log('   Body type:', typeof comment.body);
        console.log('   Body:', JSON.stringify(comment.body, null, 2).slice(0, 500));
        
        // Try to extract text from ADF
        if (comment.body && typeof comment.body === 'object') {
          const body = comment.body as { content?: Array<{ content?: Array<{ text?: string }> }> };
          if (body.content) {
            const textParts: string[] = [];
            for (const node of body.content) {
              if (node.content) {
                for (const inner of node.content) {
                  if (inner.text) {
                    textParts.push(inner.text);
                  }
                }
              }
            }
            const fullText = textParts.join(' ');
            console.log('   Extracted text:', fullText);
            
            if (fullText.toLowerCase().startsWith('demo')) {
              console.log('   ✅ THIS IS A DEMO COMMENT!');
            }
          }
        }
      }
    } catch (err) {
      console.log(`   ❌ Failed to fetch comments: ${err}`);
    }

    // Fetch attachments
    try {
      const attachResponse = await client.get<{ fields: { attachment: JiraAttachment[] } }>(
        `/rest/api/3/issue/${issue.key}`,
        { params: { fields: 'attachment' } },
      );
      
      const attachments = attachResponse.data.fields.attachment || [];
      console.log(`\n📎 Attachments (${attachments.length}):`);
      
      if (attachments.length === 0) {
        console.log('   No attachments');
      }
      
      for (const att of attachments) {
        console.log(`   - ${att.filename} (${att.mimeType}) ID: ${att.id}`);
        if (att.mimeType.startsWith('image/')) {
          console.log(`     🖼️ Image! URL: ${att.content}`);
          if (att.thumbnail) {
            console.log(`     📷 Thumbnail: ${att.thumbnail}`);
          }
        }
      }
    } catch (err) {
      console.log(`   ❌ Failed to fetch attachments: ${err}`);
    }
    
    console.log('\n');
  }
}

checkDemoComments().catch(console.error);

