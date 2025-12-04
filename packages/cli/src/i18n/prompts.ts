/**
 * Language-specific prompt configurations for AI report generation.
 */

import type { SupportedLanguage } from './language';

// =============================================================================
// Types
// =============================================================================

export interface PromptStrings {
  // System prompts
  systemPromptBlockGeneration: string;
  systemPromptValidation: string;

  // Common phrases for prompts
  noTasks: string;
  notSpecified: string;
  notAssigned: string;

  // Date format examples
  dateExampleDeadline: string;
  dateExampleStart: string;
  dateExampleEnd: string;

  // Prompt language instruction
  languageInstruction: string;
}

// =============================================================================
// Russian Prompts
// =============================================================================

const PROMPTS_RU: PromptStrings = {
  systemPromptBlockGeneration: `Ты — опытный менеджер продукта, который пишет отчёты по спринтам для партнёров и стейкхолдеров.

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
1. Пиши ТОЛЬКО на русском языке.
2. Используй бизнес-язык, понятный партнёрам и руководству.
3. НЕ используй технические термины: API, бэкенд, фронтенд, pipeline, DevOps, архитектура, модели, микросервисы, деплой, рефакторинг и т.п.
4. Описывай функционал с точки зрения пользы для пользователя/бизнеса.
5. Будь конкретным, но понятным.
6. Отвечай ТОЛЬКО валидным JSON без markdown-разметки.

СТРОГИЕ ОГРАНИЧЕНИЯ ПО ДАННЫМ:
7. Используй ТОЛЬКО данные, которые явно указаны во входных данных. НЕ ВЫДУМЫВАЙ задачи, артефакты, ссылки или достижения!
8. Если данных нет — возвращай пустой массив [] или пустую строку "".
9. Названия задач, ключи и статусы бери ТОЛЬКО из предоставленного списка.
10. НЕ придумывай ссылки на figma.com, loom.com, jira или другие ресурсы, если они не указаны.`,

  systemPromptValidation: `Ты — эксперт по анализу качества отчётов и документации.
Твоя задача — объективно оценить предоставленные данные и выдать структурированный результат.
Отвечай ТОЛЬКО валидным JSON без markdown-разметки.`,

  noTasks: 'Нет задач',
  notSpecified: 'не указано',
  notAssigned: 'не назначен',

  dateExampleDeadline: "например, '29 Марта 2026'",
  dateExampleStart: "например, '17 Ноября 2025'",
  dateExampleEnd: "например, '28 Ноября 2025'",

  languageInstruction: 'на русском',
};

// =============================================================================
// English Prompts
// =============================================================================

const PROMPTS_EN: PromptStrings = {
  systemPromptBlockGeneration: `You are an experienced product manager who writes sprint reports for partners and stakeholders.

CRITICAL RULES:
1. Write ONLY in English.
2. Use business language that is understandable to partners and management.
3. DO NOT use technical jargon: API, backend, frontend, pipeline, DevOps, architecture, models, microservices, deploy, refactoring, etc.
4. Describe functionality from the perspective of user/business value.
5. Be specific but understandable.
6. Respond ONLY with valid JSON without markdown formatting.

STRICT DATA LIMITATIONS:
7. Use ONLY data explicitly provided in the input. DO NOT INVENT tasks, artifacts, links, or achievements!
8. If there's no data — return an empty array [] or empty string "".
9. Take task names, keys, and statuses ONLY from the provided list.
10. DO NOT invent links to figma.com, loom.com, jira, or other resources if they are not provided.`,

  systemPromptValidation: `You are an expert in analyzing report quality and documentation.
Your task is to objectively evaluate the provided data and return a structured result.
Respond ONLY with valid JSON without markdown formatting.`,

  noTasks: 'No tasks',
  notSpecified: 'not specified',
  notAssigned: 'not assigned',

  dateExampleDeadline: "e.g., 'March 29, 2026'",
  dateExampleStart: "e.g., 'November 17, 2025'",
  dateExampleEnd: "e.g., 'November 28, 2025'",

  languageInstruction: 'in English',
};

// =============================================================================
// Exports
// =============================================================================

export const PROMPT_STRINGS: Record<SupportedLanguage, PromptStrings> = {
  ru: PROMPTS_RU,
  en: PROMPTS_EN,
};

/**
 * Get prompt strings for a specific language
 */
export function getPromptStrings(lang: SupportedLanguage): PromptStrings {
  return PROMPT_STRINGS[lang];
}


