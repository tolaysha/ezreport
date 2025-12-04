/**
 * Goal Alignment Assessment Service
 *
 * Provides AI-powered assessment of how well sprint issues
 * match the sprint goal.
 */

import OpenAI from 'openai';

import type { SprintIssue } from '../ai/types';
import { IS_MOCK, isOpenAIConfigured, OPENAI_CONFIG } from '../config';
import type { GoalAlignmentResult, GoalMatchLevel, SprintMeta } from '../domain/BoardSprintSnapshot';
import { logger } from '../utils/logger';

// =============================================================================
// Constants
// =============================================================================

const GOAL_ALIGNMENT_SYSTEM_PROMPT = `Ты — эксперт по анализу соответствия задач цели спринта.

Твоя задача: оценить, насколько хорошо перечисленные задачи соответствуют заявленной цели спринта.

Ответь строго в формате JSON:
{
  "level": "strong" | "medium" | "weak",
  "comment": "Краткое пояснение на русском языке (1-2 предложения)"
}

Критерии оценки:
- strong: Большинство задач напрямую поддерживают достижение цели спринта
- medium: Часть задач связана с целью, но есть значительное количество несвязанных задач
- weak: Большинство задач не связаны с заявленной целью спринта`;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build prompt for goal alignment assessment.
 */
function buildGoalAlignmentPrompt(
  sprintMeta: SprintMeta,
  issues: SprintIssue[],
): string {
  const issuesList = issues
    .map((issue) => `- ${issue.key}: ${issue.summary} [${issue.status}]`)
    .join('\n');

  return `Цель спринта "${sprintMeta.name}":
${sprintMeta.goal}

Задачи спринта:
${issuesList}

Оцени соответствие задач цели спринта.`;
}

/**
 * Get OpenAI client instance (if configured).
 */
function getOpenAIClient(): OpenAI | null {
  if (IS_MOCK || !isOpenAIConfigured()) {
    return null;
  }
  return new OpenAI({ apiKey: OPENAI_CONFIG.apiKey });
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Assess how well sprint issues align with the sprint goal.
 *
 * Uses AI in real mode, returns fixed mock data in mock mode.
 * Never throws - returns "unknown" level with explanation on error.
 *
 * @param sprintMeta - Sprint metadata including the goal
 * @param issues - List of issues in the sprint
 * @param mockMode - Override mock mode setting
 * @returns GoalAlignmentResult with level and comment
 */
export async function assessGoalAlignment(
  sprintMeta: SprintMeta,
  issues: SprintIssue[],
  mockMode?: boolean,
): Promise<GoalAlignmentResult> {
  // Check for missing goal
  if (!sprintMeta.goal || sprintMeta.goal.trim() === '') {
    logger.info('[assessGoalAlignment] No sprint goal provided');
    return {
      level: 'unknown',
      comment: 'Цель спринта не указана.',
    };
  }

  // Check for missing issues
  if (!issues || issues.length === 0) {
    logger.info('[assessGoalAlignment] No issues provided');
    return {
      level: 'unknown',
      comment: 'Нет задач для анализа соответствия цели.',
    };
  }

  // Mock mode - return fixed result
  const useMockMode = mockMode ?? IS_MOCK;
  if (useMockMode) {
    logger.info('[assessGoalAlignment] Using mock assessment');
    return {
      level: 'medium',
      comment: 'MOCK: Часть задач спринта соответствует цели, остальные — поддерживающие активности.',
    };
  }

  // Real mode - call OpenAI
  const client = getOpenAIClient();
  if (!client) {
    logger.warn('[assessGoalAlignment] OpenAI not configured, returning unknown');
    return {
      level: 'unknown',
      comment: 'OpenAI не настроен для оценки соответствия.',
    };
  }

  try {
    logger.info('[assessGoalAlignment] Calling OpenAI for goal alignment assessment');

    const prompt = buildGoalAlignmentPrompt(sprintMeta, issues);

    const response = await client.chat.completions.create({
      model: OPENAI_CONFIG.model,
      messages: [
        { role: 'system', content: GOAL_ALIGNMENT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      logger.warn('[assessGoalAlignment] OpenAI returned empty response');
      return {
        level: 'unknown',
        comment: 'Не удалось получить оценку от AI.',
      };
    }

    const parsed = JSON.parse(content) as { level: string; comment: string };

    // Validate level
    const validLevels: GoalMatchLevel[] = ['strong', 'medium', 'weak'];
    const level: GoalMatchLevel = validLevels.includes(parsed.level as GoalMatchLevel)
      ? (parsed.level as GoalMatchLevel)
      : 'unknown';

    logger.info(`[assessGoalAlignment] Assessment complete: ${level}`);

    return {
      level,
      comment: parsed.comment || 'Оценка получена.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[assessGoalAlignment] Failed to assess goal alignment', { error: message });

    return {
      level: 'unknown',
      comment: 'Ошибка при оценке соответствия задач цели.',
    };
  }
}

