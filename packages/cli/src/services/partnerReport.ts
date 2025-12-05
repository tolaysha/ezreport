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

interface SprintMetrics {
  totalTasks: number;
  completedTasks: number;
  totalPoints: number;
  completedPoints: number;
  progressPercent: number;
}

function calculateSprintMetrics(issues: SprintIssue[]): SprintMetrics {
  const totalTasks = issues.length;
  const completedTasks = issues.filter((i: SprintIssue) => i.statusCategory === 'done').length;
  const totalPoints = issues.reduce((sum: number, i: SprintIssue) => sum + (i.storyPoints ?? 0), 0);
  const completedPoints = issues
    .filter((i: SprintIssue) => i.statusCategory === 'done')
    .reduce((sum: number, i: SprintIssue) => sum + (i.storyPoints ?? 0), 0);
  const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  return { totalTasks, completedTasks, totalPoints, completedPoints, progressPercent };
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
- Если чего-то нет — явно писать «Нет» или «Не было».
- ЗАПРЕЩЕНО использовать технические термины: API, бэкенд, фронтенд, архитектура, пайплайн, модели, девопс, деплой, рефакторинг и т.п.

СТРУКТУРА ОТЧЁТА:
1. Заголовок: "# ✅ Sprint N" (где N — номер спринта, без дополнительного текста)
2. Информация о версии (если есть)
3. Информация о спринте (даты, цель)
4. Overview спринта:
   - Текст 4-6 предложений: что планировали сделать, что в итоге сделали, какие были сложности, что важно для понимания партнёров. Пиши бизнес-языком.
   - Таблица "Основные показатели" (Story Points выполнено X из Y, Задач завершено X из Y, Прогресс %)
5. Ключевые достижения (4-6 штук):
   - Выбери самые сложные/значимые выполненные задачи
   - Формат: короткий буллет-пойнт, 1 строка, без длинных пояснений
   - Пример: "- Реализована система уведомлений"
6. Что не сделано и почему:
   - Список всех задач со статусом НЕ "done"
   - Формат: "- [Задача простым языком] — [Причина и что требуется для завершения] — [Новый дедлайн]"
7. Артефакты (демо, видео):
   - Написать: "Раздел в разработке, будет доступен в следующей версии."
8. План текущего спринта:
   - Заголовок: "Спринт №[Номер]"
   - Цель спринта — 1-2 предложения
   - Список основных задач спринта
9. Блокеры (если есть)
10. Вопросы PM (если есть)

Верни только markdown-документ без дополнительных комментариев.`;

function buildMockReport(data: PartnerReportInput): string {
  // Use previous sprint (completed) for the report content
  const previousSprint = data.basicBoardData?.previousSprint;
  // Use current sprint for "next sprint plan" section
  const currentSprint = data.basicBoardData?.currentSprint;

  if (!previousSprint) {
    return '# Отчёт\n\nНет данных о предыдущем спринте.';
  }

  const previousSprintNumber = extractSprintNumber(previousSprint.sprint.name);
  const currentSprintNumber = currentSprint ? extractSprintNumber(currentSprint.sprint.name) : String(Number(previousSprintNumber) + 1);
  const metrics = calculateSprintMetrics(previousSprint.issues);
  const doneIssues = previousSprint.issues.filter(i => i.statusCategory === 'done');
  const notDoneIssues = previousSprint.issues.filter(i => i.statusCategory !== 'done');

  let report = `# ✅ Sprint ${previousSprintNumber}

## **Отчет по итогам реализованного спринта**

---

**Спринт №${previousSprintNumber}** — срок реализации с ${formatDateRussian(previousSprint.sprint.startDate)} по ${formatDateRussian(previousSprint.sprint.endDate)}

**Цель спринта:** ${previousSprint.sprint.goal || 'Не указана'}

---

## Overview спринта

Спринт завершён на **${metrics.progressPercent}%**.${doneIssues.length > 0 ? ' Команда выполнила ключевые задачи в рамках плана.' : ''}

### Основные показатели

| Показатель | Значение |
|------------|----------|
| Story Points выполнено | ${metrics.completedPoints} из ${metrics.totalPoints} |
| Задач завершено | ${metrics.completedTasks} из ${metrics.totalTasks} |
| Прогресс | ${metrics.progressPercent}% |

---

## Ключевые достижения

${doneIssues.length > 0 ? doneIssues.slice(0, 6).map(issue => `- ${issue.summary}`).join('\n') : 'Нет завершённых задач в этом спринте.'}

---

## Что не сделано

${notDoneIssues.length > 0 ? notDoneIssues.map(issue => `- **${issue.summary}** (${issue.key}) — перенесено на следующий спринт`).join('\n') : 'Все запланированные задачи выполнены.'}

---

## Артефакты

Раздел в разработке, будет доступен в следующей версии.

---

## План следующего спринта

Следующий спринт №${currentSprintNumber}${currentSprint?.sprint.goal ? `: ${currentSprint.sprint.goal}` : ''} будет направлен на продолжение работы над продуктом${notDoneIssues.length > 0 ? ' и завершение перенесённых задач' : ''}.

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

  // Use previous sprint (completed) for the report content
  const previousSprint = data.basicBoardData?.previousSprint;
  // Use current sprint for "next sprint plan" section
  const currentSprint = data.basicBoardData?.currentSprint;
  const analysis = data.analysis;
  const version = data.basicBoardData?.activeVersion;

  const userPrompt = `Сгенерируй партнёрский отчёт по следующим данным:

ЗАВЕРШЁННЫЙ СПРИНТ (основа отчёта):
${JSON.stringify(previousSprint, null, 2)}

${currentSprint ? `ТЕКУЩИЙ СПРИНТ (для раздела "План следующего спринта"):\n${JSON.stringify(currentSprint, null, 2)}` : ''}

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

