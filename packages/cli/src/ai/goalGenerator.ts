/**
 * AI-based sprint goal generation.
 */

import OpenAI from 'openai';

import type { SprintIssue } from '@ezreport/shared';
import { isOpenAIConfigured, OPENAI_CONFIG } from '../config';
import { logger } from '../utils/logger';

/**
 * Generate a sprint goal based on the issues list using AI.
 */
export async function generateSprintGoal(
  issues: SprintIssue[],
  sprintName: string,
): Promise<string | null> {
  if (!isOpenAIConfigured()) {
    logger.warn('[generateSprintGoal] OpenAI not configured, cannot generate goal');
    return null;
  }

  if (issues.length === 0) {
    return null;
  }

  try {
    const openai = new OpenAI({ apiKey: OPENAI_CONFIG.apiKey });
    
    const issuesList = issues
      .map((i) => `- ${i.summary} [${i.status}]`)
      .join('\n');

    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: `Ты — AI-помощник, который формулирует цели спринта.
Твоя задача: на основе списка задач сформулировать краткую и понятную цель спринта.
Цель должна быть:
- 1-2 предложения максимум
- Понятна бизнес-аудитории (не техническая)
- Отражать главную ценность, которую спринт принесёт
- На русском языке

Отвечай ТОЛЬКО текстом цели, без кавычек и пояснений.`,
        },
        {
          role: 'user',
          content: `Спринт: ${sprintName}

Задачи спринта:
${issuesList}

Сформулируй цель этого спринта:`,
        },
      ],
      temperature: 0.3,
      max_completion_tokens: 200,
    });

    const goal = response.choices[0]?.message?.content?.trim();
    if (goal) {
      logger.info(`[generateSprintGoal] Generated goal: ${goal}`);
      return goal;
    }
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[generateSprintGoal] Failed to generate goal', { error: message });
    return null;
  }
}


