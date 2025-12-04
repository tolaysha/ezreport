/**
 * Partner Report Generation Service
 *
 * Generates markdown reports for partners from collected sprint data.
 */

import OpenAI from 'openai';
import type { BasicBoardSprintData, StrategicAnalysis, SprintIssue } from '@ezreport/shared';
import { IS_MOCK, isOpenAIConfigured, OPENAI_CONFIG } from '../config';
import { logger } from '../utils/logger';

// =============================================================================
// Types
// =============================================================================

interface PartnerReportInput {
  basicBoardData?: BasicBoardSprintData;
  analysis?: StrategicAnalysis;
}

// =============================================================================
// Helpers
// =============================================================================

function formatDateRussian(dateStr: string | undefined): string {
  if (!dateStr) {
    return '—';
  }
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

function extractSprintNumber(sprintName: string): string {
  const match = sprintName.match(/(\d+)/);
  return match?.[1] ?? '1';
}

function calculateProgressPercent(issues: SprintIssue[]): number {
  const totalPoints = issues.reduce((sum: number, i: SprintIssue) => sum + (i.storyPoints ?? 0), 0);
  const completedPoints = issues
    .filter((i: SprintIssue) => i.statusCategory === 'done')
    .reduce((sum: number, i: SprintIssue) => sum + (i.storyPoints ?? 0), 0);

  return totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
}

// =============================================================================
// Report Generation
// =============================================================================

const SYSTEM_PROMPT = `Ты — AI, который генерирует отчёты о завершённых спринтах.

ТВОЯ ЗАДАЧА:
- Сгенерировать markdown-документ отчёта по предоставленным данным.
- Писать простым бизнес-языком, без технических терминов.
- Фокусироваться на бизнес-ценности и результатах.

ТРЕБОВАНИЯ К СТИЛЮ:
- Тон: уверенный, спокойный, партнёрский.
- Overview — 2–3 абзаца, подчёркивая что планировали, что сделали, что это значит.
- Достижения — простым языком, объясняя ценность.
- Если чего-то нет — явно писать «Нет» или «Не было».

СТРУКТУРА ОТЧЁТА:
1. Заголовок: "# ✅ Sprint N" (где N — номер спринта, без дополнительного текста)
2. Информация о версии (если есть)
3. Информация о спринте (даты, цель, прогресс)
4. Overview спринта
5. Ключевые достижения
6. Что не сделано и почему
7. Артефакты (демо, видео)
8. План следующего спринта
9. Блокеры (если есть)
10. Вопросы PM (если есть)

Верни только markdown-документ без дополнительных комментариев.`;

function buildMockReport(data: PartnerReportInput): string {
  // Use previous sprint (completed) for the report, not current sprint
  const sprint = data.basicBoardData?.previousSprint;
  if (!sprint) {
    return '# Отчёт\n\nНет данных о предыдущем спринте.';
  }

  const sprintNumber = extractSprintNumber(sprint.sprint.name);
  const progressPercent = calculateProgressPercent(sprint.issues);
  const doneIssues = sprint.issues.filter(i => i.statusCategory === 'done');
  const notDoneIssues = sprint.issues.filter(i => i.statusCategory !== 'done');

  let report = `# ✅ Sprint ${sprintNumber}

## **Отчет по итогам реализованного спринта**

---

**Спринт №${sprintNumber}** — срок реализации с ${formatDateRussian(sprint.sprint.startDate)} по ${formatDateRussian(sprint.sprint.endDate)}

**Цель спринта:** ${sprint.sprint.goal || 'Не указана'}

**Спринт реализован на ${progressPercent}%**

---

## Overview спринта

В этом спринте команда работала над ${sprint.issues.length} задачами. Успешно завершено ${doneIssues.length} задач, что составляет ${progressPercent}% от запланированного объёма.

${doneIssues.length > 0 ? 'Основные усилия были направлены на реализацию ключевого функционала.' : 'Спринт был направлен на подготовительные работы.'}

---

## Ключевые достижения

${doneIssues.length > 0 ? doneIssues.slice(0, 5).map(issue => `- **${issue.summary}** (${issue.key})`).join('\n') : 'Нет завершённых задач в этом спринте.'}

---

## Что не сделано

${notDoneIssues.length > 0 ? notDoneIssues.map(issue => `- **${issue.summary}** (${issue.key}) — перенесено на следующий спринт`).join('\n') : 'Все запланированные задачи выполнены.'}

---

## Артефакты

${sprint.issues.filter(i => i.artifact).length > 0 
  ? sprint.issues.filter(i => i.artifact).map(i => `- [${i.summary}](${i.artifact})`).join('\n')
  : 'Нет артефактов для демонстрации.'}

---

## План следующего спринта

Следующий спринт №${Number(sprintNumber) + 1} будет направлен на продолжение работы над продуктом${notDoneIssues.length > 0 ? ' и завершение перенесённых задач' : ''}.

---

## Блокеры

Нет.

---

## Вопросы от PM

Нет.
`;

  return report;
}

async function generateWithAI(data: PartnerReportInput): Promise<string> {
  const openai = new OpenAI({ apiKey: OPENAI_CONFIG.apiKey });

  // Use previous sprint (completed) for the report, not current sprint
  const sprint = data.basicBoardData?.previousSprint;
  const analysis = data.analysis;
  const version = data.basicBoardData?.activeVersion;

  const userPrompt = `Сгенерируй партнёрский отчёт по следующим данным:

СПРИНТ:
${JSON.stringify(sprint, null, 2)}

${version ? `ВЕРСИЯ:\n${JSON.stringify(version, null, 2)}` : ''}

${analysis ? `АНАЛИЗ:\n${JSON.stringify(analysis, null, 2)}` : ''}

Верни готовый markdown-документ.`;

  const response = await openai.chat.completions.create({
    model: OPENAI_CONFIG.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_completion_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned empty response');
  }

  return content;
}

/**
 * Generate partner report in markdown format
 */
export async function generatePartnerReportMarkdown(data: PartnerReportInput): Promise<string> {
  // Use mock report if in mock mode or OpenAI not configured
  if (IS_MOCK || !isOpenAIConfigured()) {
    logger.info('[MOCK] Generating mock partner report');
    return buildMockReport(data);
  }

  try {
    logger.info('Generating partner report with AI...');
    return await generateWithAI(data);
  } catch (error) {
    logger.error('Failed to generate report with AI, falling back to mock', { error });
    return buildMockReport(data);
  }
}

