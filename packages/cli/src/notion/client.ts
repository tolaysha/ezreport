import { Client } from '@notionhq/client';
import type { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

import type { NotionPageResult, SprintReportStructured } from '../ai/types';
import { IS_MOCK, NOTION_CONFIG } from '../config';
import { logger } from '../utils/logger';

import { buildPageBlocks, buildPageTitle, logBlocksStructure } from './builder';

/**
 * Input data for creating a sprint report page
 */
export interface CreateSprintReportPageInput {
  sprintName: string;
  report: SprintReportStructured;
}

/**
 * Input data for creating a page from markdown
 */
export interface CreatePageFromMarkdownInput {
  title: string;
  markdown: string;
}

export class NotionClient {
  private client: Client | null = null;

  constructor() {
    // Only initialize Notion client if not in mock mode
    if (!IS_MOCK) {
      this.client = new Client({
        auth: NOTION_CONFIG.apiKey,
      });
    }
  }

  /**
   * Create a sprint report page in Notion
   */
  async createSprintReportPage(
    data: CreateSprintReportPageInput,
  ): Promise<NotionPageResult> {
    const { sprintName, report } = data;
    const title = buildPageTitle(sprintName);
    const blocks = buildPageBlocks({ sprintName, report });

    // Mock mode - log what would be created
    if (IS_MOCK) {
      logger.info('[MOCK] Would create Notion page:', { title });
      logger.info('[MOCK] Page sections:');
      logger.info(`  - Версия №${report.version.number}`);
      logger.info(`  - Спринт №${report.sprint.number}`);
      logger.info('  - 1. Отчет по итогам реализованного спринта');
      logger.info('  - 2. Артефакты по итогам реализованного спринта');
      logger.info('  - 3. Планирование следующего спринта');
      logger.info('  - 4. Вопросы и предложения от Product Manager');

      // Log detailed block structure
      logBlocksStructure(blocks);

      const mockId = `mock-page-${Date.now()}`;
      const mockUrl = `https://www.notion.so/${mockId}`;

      logger.info(`[MOCK] Page would be created with ID: ${mockId}`);

      return {
        id: mockId,
        url: mockUrl,
      };
    }

    // Real mode - create page via Notion API
    if (!this.client) {
      throw new Error('Notion client not initialized');
    }

    logger.info(`Creating Notion page: ${title}`);
    logger.debug('Page blocks count', { count: blocks.length });

    // Create the page with title
    const page = await this.client.pages.create({
      parent: {
        page_id: NOTION_CONFIG.parentPageId,
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      },
      // Notion API limits blocks to 100 per request
      children: blocks.slice(0, 100),
    });

    // If we have more than 100 blocks, append them in batches
    if (blocks.length > 100) {
      const remainingBlocks = blocks.slice(100);
      const batchSize = 100;

      for (let i = 0; i < remainingBlocks.length; i += batchSize) {
        const batch = remainingBlocks.slice(i, i + batchSize);
        await this.client.blocks.children.append({
          block_id: page.id,
          children: batch,
        });
      }
    }

    // Extract the page URL
    const pageUrl = `https://www.notion.so/${page.id.replace(/-/g, '')}`;

    logger.info(`Notion page created: ${pageUrl}`);

    return {
      id: page.id,
      url: pageUrl,
    };
  }

  /**
   * Create a page from markdown content
   */
  async createPageFromMarkdown(
    data: CreatePageFromMarkdownInput,
  ): Promise<NotionPageResult> {
    const { title, markdown } = data;
    const blocks = markdownToBlocks(markdown);

    // Mock mode - log what would be created
    if (IS_MOCK) {
      logger.info('[MOCK] Would create Notion page from markdown:', { title });
      logger.info(`[MOCK] Blocks count: ${blocks.length}`);

      const mockId = `mock-markdown-page-${Date.now()}`;
      const mockUrl = `https://www.notion.so/${mockId}`;

      logger.info(`[MOCK] Page would be created with ID: ${mockId}`);

      return {
        id: mockId,
        url: mockUrl,
      };
    }

    // Real mode - create page via Notion API
    if (!this.client) {
      throw new Error('Notion client not initialized');
    }

    logger.info(`Creating Notion page from markdown: ${title}`);
    logger.debug('Page blocks count', { count: blocks.length });

    // Create the page with title
    const page = await this.client.pages.create({
      parent: {
        page_id: NOTION_CONFIG.parentPageId,
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      },
      // Notion API limits blocks to 100 per request
      children: blocks.slice(0, 100),
    });

    // If we have more than 100 blocks, append them in batches
    if (blocks.length > 100) {
      const remainingBlocks = blocks.slice(100);
      const batchSize = 100;

      for (let i = 0; i < remainingBlocks.length; i += batchSize) {
        const batch = remainingBlocks.slice(i, i + batchSize);
        await this.client.blocks.children.append({
          block_id: page.id,
          children: batch,
        });
      }
    }

    // Extract the page URL
    const pageUrl = `https://www.notion.so/${page.id.replace(/-/g, '')}`;

    logger.info(`Notion page created from markdown: ${pageUrl}`);

    return {
      id: page.id,
      url: pageUrl,
    };
  }
}

// =============================================================================
// Markdown to Notion Blocks Converter
// =============================================================================

/**
 * Convert markdown text to Notion blocks
 */
function markdownToBlocks(markdown: string): BlockObjectRequest[] {
  const lines = markdown.split('\n');
  const blocks: BlockObjectRequest[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      continue;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      // Flush table if we were in one
      if (inTable && tableRows.length > 0) {
        blocks.push(createTableBlock(tableRows));
        tableRows = [];
        inTable = false;
      }
      blocks.push({
        object: 'block',
        type: 'divider',
        divider: {},
      });
      continue;
    }

    // Table row detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Check if this is a separator row (|---|---|)
      if (trimmed.match(/^\|[\s\-:]+\|$/)) {
        continue; // Skip separator row
      }
      
      inTable = true;
      const cells = trimmed
        .slice(1, -1) // Remove leading and trailing |
        .split('|')
        .map(cell => cell.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable && tableRows.length > 0) {
      // End of table
      blocks.push(createTableBlock(tableRows));
      tableRows = [];
      inTable = false;
    }

    // Heading 1
    if (trimmed.startsWith('# ')) {
      const text = trimmed.slice(2).replace(/\*\*/g, '').trim();
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: text } }],
        },
      });
      continue;
    }

    // Heading 2
    if (trimmed.startsWith('## ')) {
      const text = trimmed.slice(3).replace(/\*\*/g, '').trim();
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: text } }],
        },
      });
      continue;
    }

    // Heading 3
    if (trimmed.startsWith('### ')) {
      const text = trimmed.slice(4).replace(/\*\*/g, '').trim();
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: text } }],
        },
      });
      continue;
    }

    // Bulleted list item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const text = trimmed.slice(2);
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: parseRichText(text),
        },
      });
      continue;
    }

    // Numbered list item
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      const text = numberedMatch[2];
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: parseRichText(text),
        },
      });
      continue;
    }

    // Regular paragraph
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: parseRichText(trimmed),
      },
    });
  }

  // Flush remaining table
  if (inTable && tableRows.length > 0) {
    blocks.push(createTableBlock(tableRows));
  }

  return blocks;
}

/**
 * Parse markdown text with bold formatting into Notion rich_text array
 */
function parseRichText(text: string): Array<{
  type: 'text';
  text: { content: string };
  annotations?: { bold?: boolean };
}> {
  const parts: Array<{
    type: 'text';
    text: { content: string };
    annotations?: { bold?: boolean };
  }> = [];

  // Split by bold markers **text**
  const segments = text.split(/(\*\*[^*]+\*\*)/);

  for (const segment of segments) {
    if (!segment) continue;

    if (segment.startsWith('**') && segment.endsWith('**')) {
      // Bold text
      parts.push({
        type: 'text',
        text: { content: segment.slice(2, -2) },
        annotations: { bold: true },
      });
    } else {
      // Regular text
      parts.push({
        type: 'text',
        text: { content: segment },
      });
    }
  }

  return parts.length > 0 ? parts : [{ type: 'text', text: { content: text } }];
}

/**
 * Create a table block from rows
 */
function createTableBlock(rows: string[][]): BlockObjectRequest {
  const columnCount = Math.max(...rows.map(r => r.length));
  
  return {
    object: 'block',
    type: 'table',
    table: {
      table_width: columnCount,
      has_column_header: true,
      has_row_header: false,
      children: rows.map((row, rowIndex) => ({
        object: 'block' as const,
        type: 'table_row' as const,
        table_row: {
          cells: Array.from({ length: columnCount }, (_, colIndex) => {
            const cellContent = row[colIndex] || '';
            // First row is header - make it bold
            if (rowIndex === 0) {
              return [{
                type: 'text' as const,
                text: { content: cellContent },
                annotations: { bold: true },
              }];
            }
            return [{
              type: 'text' as const,
              text: { content: cellContent },
            }];
          }),
        },
      })),
    },
  };
}

// Singleton instance
export const notionClient = new NotionClient();
