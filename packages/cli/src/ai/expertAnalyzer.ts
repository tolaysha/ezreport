/**
 * AI-based expert analysis from different stakeholder perspectives.
 */

import OpenAI from 'openai';

import type {
  SprintCardData,
  StrategicAnalysis,
} from '@ezreport/shared';
import { isOpenAIConfigured, OPENAI_CONFIG } from '../config';
import { logger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

export type ExpertRole = 'tech_director' | 'product_director' | 'finance_director';

export interface ExpertAnalysisResult {
  role: ExpertRole;
  roleName: string;
  summary: string;
  keyInsights: string[];
  risks: string[];
  recommendations: string[];
}

export interface ExpertAnalysisParams {
  role: ExpertRole;
  currentSprint: SprintCardData;
  previousSprint?: SprintCardData;
  analysis: StrategicAnalysis;
}

// =============================================================================
// Role Configuration
// =============================================================================

interface RolePromptConfig {
  roleName: string;
  systemPrompt: string;
  focusAreas: string[];
}

const ROLE_PROMPTS: Record<ExpertRole, RolePromptConfig> = {
  tech_director: {
    roleName: 'Технический директор',
    systemPrompt: `Ты — опытный технический директор (CTO) с 15+ годами опыта в IT.
Ты анализируешь спринты с точки зрения технической стратегии и здоровья команды.

ТВОЙ ФОКУС:
- Качество архитектурных решений
- Технический долг и его управление
- Производительность и эффективность разработки
- Риски масштабирования и поддержки
- Развитие технических компетенций команды
- Соответствие индустриальным практикам

ИЗБЕГАЙ:
- Бизнес-метрик (ROI, revenue)
- Пользовательских метрик (NPS, retention)
- Детальных финансовых расчётов`,
    focusAreas: [
      'архитектура и техдолг',
      'производительность команды',
      'качество кода',
      'инфраструктура',
      'технические риски',
    ],
  },

  product_director: {
    roleName: 'Директор по продукту',
    systemPrompt: `Ты — опытный директор по продукту (CPO) с глубоким пониманием пользовательских потребностей.
Ты анализируешь спринты с точки зрения продуктовой стратегии и ценности для пользователей.

ТВОЙ ФОКУС:
- Соответствие задач продуктовой стратегии
- Ценность для конечного пользователя
- Приоритизация функционала
- Roadmap и планирование
- Конкурентные преимущества
- Метрики продукта (adoption, engagement)

ИЗБЕГАЙ:
- Глубоких технических деталей
- Архитектурных решений
- Детальных финансовых расчётов`,
    focusAreas: [
      'ценность для пользователя',
      'продуктовая стратегия',
      'приоритеты roadmap',
      'конкурентное позиционирование',
      'пользовательский опыт',
    ],
  },

  finance_director: {
    roleName: 'Финансовый директор',
    systemPrompt: `Ты — опытный финансовый директор (CFO) с пониманием IT-бизнеса.
Ты анализируешь спринты с точки зрения финансовой эффективности и ROI.

ТВОЙ ФОКУС:
- Эффективность инвестиций в разработку
- ROI от функционала
- Стоимость разработки vs. ценность
- Оптимизация ресурсов
- Финансовые риски проекта
- Прогнозирование затрат

ИЗБЕГАЙ:
- Глубоких технических деталей
- UX/UI рекомендаций
- Архитектурных решений`,
    focusAreas: [
      'ROI и эффективность инвестиций',
      'стоимость разработки',
      'оптимизация ресурсов',
      'финансовые риски',
      'бюджетирование',
    ],
  },
};

// =============================================================================
// Expert Analysis
// =============================================================================

/**
 * Generate expert analysis from a specific role perspective.
 */
export async function generateExpertAnalysis(
  params: ExpertAnalysisParams,
): Promise<ExpertAnalysisResult> {
  const { role, currentSprint, previousSprint, analysis } = params;
  const roleConfig = ROLE_PROMPTS[role];

  if (!isOpenAIConfigured()) {
    logger.warn('[generateExpertAnalysis] OpenAI not configured, returning mock');
    return generateMockExpertAnalysis(role, roleConfig.roleName);
  }

  try {
    const openai = new OpenAI({ apiKey: OPENAI_CONFIG.apiKey });
    const prompt = buildExpertAnalysisPrompt(roleConfig, currentSprint, previousSprint, analysis);

    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: `${roleConfig.systemPrompt}

Отвечай ТОЛЬКО валидным JSON объектом без markdown разметки.
Используй русский язык для всех текстовых полей.
Будь конкретным и практичным в рекомендациях.`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_completion_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    const result = JSON.parse(content) as Omit<ExpertAnalysisResult, 'role' | 'roleName'>;
    logger.info(`[generateExpertAnalysis] ${roleConfig.roleName} analysis complete`);

    return {
      role,
      roleName: roleConfig.roleName,
      ...result,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[generateExpertAnalysis] AI analysis failed', { error: message });
    return generateMockExpertAnalysis(role, roleConfig.roleName);
  }
}

/**
 * Build prompt for expert analysis.
 */
function buildExpertAnalysisPrompt(
  roleConfig: RolePromptConfig,
  currentSprint: SprintCardData,
  previousSprint: SprintCardData | undefined,
  analysis: StrategicAnalysis,
): string {
  const issues = currentSprint.issues;
  const doneIssues = issues.filter((i) => i.statusCategory === 'done');
  const totalSP = issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
  const doneSP = doneIssues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

  const issuesList = issues
    .map((i) => `- ${i.key}: ${i.summary} [${i.status}] (${i.storyPoints ?? 0} SP)`)
    .join('\n');

  let previousSprintInfo = '';
  if (previousSprint) {
    const prevDone = previousSprint.issues.filter((i) => i.statusCategory === 'done');
    const prevTotalSP = previousSprint.issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
    const prevDoneSP = prevDone.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
    previousSprintInfo = `
## Прошлый спринт (${previousSprint.sprint.name})
- Задач: ${previousSprint.issues.length}, выполнено: ${prevDone.length}
- Story Points: ${prevDoneSP}/${prevTotalSP} выполнено`;
  }

  return `Проанализируй данные спринта с позиции ${roleConfig.roleName}.

## Текущий спринт: ${currentSprint.sprint.name}
- Цель: ${currentSprint.sprint.goal || 'Не указана'}
- Всего задач: ${issues.length}
- Выполнено: ${doneIssues.length}
- Story Points: ${doneSP}/${totalSP} выполнено
${previousSprintInfo}

## Задачи спринта
${issuesList}

## Стратегический анализ (уже проведён)
- Общий балл: ${analysis.overallScore}/100
- Соответствие версии: ${analysis.versionSprintAlignment.level}
- Соответствие задач цели: ${analysis.sprintTasksAlignment.level}
- Резюме: ${analysis.summary}

---

Твои области фокуса: ${roleConfig.focusAreas.join(', ')}.

Верни JSON объект:
{
  "summary": "Общая оценка спринта с твоей профессиональной точки зрения (3-4 предложения)",
  "keyInsights": [
    "Ключевой вывод 1",
    "Ключевой вывод 2",
    "Ключевой вывод 3"
  ],
  "risks": [
    "Риск 1 (конкретный, с объяснением)",
    "Риск 2"
  ],
  "recommendations": [
    "Рекомендация 1 (конкретная, действенная)",
    "Рекомендация 2",
    "Рекомендация 3"
  ]
}`;
}

/**
 * Generate mock expert analysis (fallback).
 */
function generateMockExpertAnalysis(role: ExpertRole, roleName: string): ExpertAnalysisResult {
  return {
    role,
    roleName,
    summary: `Экспертный анализ с позиции ${roleName} недоступен. Требуется настройка OpenAI.`,
    keyInsights: ['Для получения экспертного анализа необходимо настроить API OpenAI'],
    risks: ['Отсутствие экспертной оценки может привести к пропуску важных аспектов'],
    recommendations: ['Настройте OPENAI_API_KEY для получения полноценного анализа'],
  };
}

