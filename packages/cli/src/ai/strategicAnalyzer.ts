/**
 * AI-based strategic analysis for sprint alignment.
 */

import OpenAI from 'openai';

import type {
  VersionMeta,
  SprintCardData,
  StrategicAnalysis,
  AlignmentLevel,
} from '@ezreport/shared';
import { isOpenAIConfigured, OPENAI_CONFIG } from '../config';
import { logger } from '../utils/logger';
import { generateMockStrategicAnalysis } from '../mocks/sprintMocks';

/**
 * Perform strategic analysis using AI.
 */
export async function performStrategicAnalysis(
  version: VersionMeta | undefined,
  currentSprint: SprintCardData | undefined,
  previousSprint: SprintCardData | undefined,
  mockMode: boolean,
): Promise<StrategicAnalysis | undefined> {
  if (!currentSprint) {
    return undefined;
  }

  if (mockMode) {
    logger.info('[performStrategicAnalysis] Using mock analysis');
    return generateMockStrategicAnalysis();
  }

  if (!isOpenAIConfigured()) {
    logger.warn('[performStrategicAnalysis] OpenAI not configured, using basic analysis');
    return generateBasicAnalysis(version, currentSprint);
  }

  try {
    const openai = new OpenAI({ apiKey: OPENAI_CONFIG.apiKey });
    const prompt = buildStrategicAnalysisPrompt(version, currentSprint, previousSprint);
    
    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: `Ты — AI-аналитик, который оценивает согласованность спринта с целями продукта.
Отвечай ТОЛЬКО валидным JSON объектом без markdown разметки.
Используй русский язык для всех текстовых полей.`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_completion_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    const result = JSON.parse(content) as StrategicAnalysis;
    logger.info('[performStrategicAnalysis] AI analysis complete');
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[performStrategicAnalysis] AI analysis failed', { error: message });
    return generateBasicAnalysis(version, currentSprint);
  }
}

/**
 * Build prompt for strategic analysis.
 */
function buildStrategicAnalysisPrompt(
  version: VersionMeta | undefined,
  currentSprint: SprintCardData,
  previousSprint: SprintCardData | undefined,
): string {
  const versionInfo = version
    ? `## Версия продукта
- Название: ${version.name}
- Цель версии: ${version.description || 'Не указана'}
- Дата релиза: ${version.releaseDate || 'Не указана'}
- Прогресс: ${version.progressPercent ?? 'Не указан'}%`
    : '## Версия продукта\nИнформация о версии недоступна.';

  const sprintInfo = `## Текущий спринт
- Название: ${currentSprint.sprint.name}
- Цель спринта: ${currentSprint.sprint.goal || 'Не указана'}
- Даты: ${currentSprint.sprint.startDate || '?'} — ${currentSprint.sprint.endDate || '?'}`;

  const currentIssuesList = currentSprint.issues
    .map((i) => `- ${i.key}: ${i.summary} [${i.status}] (${i.storyPoints ?? 0} SP)${i.artifact ? ' 📎' : ''}`)
    .join('\n');

  const doneIssues = currentSprint.issues.filter((i) => i.statusCategory === 'done');
  const totalSP = currentSprint.issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
  const doneSP = doneIssues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

  let demoIssuesSection = '';
  if (previousSprint) {
    const prevDoneIssues = previousSprint.issues.filter((i) => i.statusCategory === 'done');
    if (prevDoneIssues.length > 0) {
      const prevIssuesList = prevDoneIssues
        .map((i) => `- ${i.key}: ${i.summary} (${i.storyPoints ?? 0} SP)${i.artifact ? ' 📎 есть артефакт' : ''}`)
        .join('\n');
      demoIssuesSection = `

## Завершённые задачи для демонстрации (из ${previousSprint.sprint.name})
${prevIssuesList}`;
    }
  }

  if (doneIssues.length > 0) {
    const currentDoneList = doneIssues
      .map((i) => `- ${i.key}: ${i.summary} (${i.storyPoints ?? 0} SP)${i.artifact ? ' 📎 есть артефакт' : ''}`)
      .join('\n');
    demoIssuesSection += `

## Завершённые задачи текущего спринта (${currentSprint.sprint.name})
${currentDoneList}`;
  }

  return `Проанализируй согласованность спринта с целями продукта и выбери лучшие задачи для демонстрации партнёрам.

${versionInfo}

${sprintInfo}

## Задачи текущего спринта (${currentSprint.issues.length} задач, ${doneSP}/${totalSP} SP выполнено)
${currentIssuesList}
${demoIssuesSection}

---

Верни JSON объект со следующей структурой:
{
  "versionSprintAlignment": {
    "level": "aligned" | "partial" | "misaligned" | "unknown",
    "comment": "Объяснение (2-3 предложения)",
    "recommendations": ["задача 1", "задача 2", "задача 3"]
  },
  "sprintTasksAlignment": {
    "level": "aligned" | "partial" | "misaligned" | "unknown",
    "comment": "Объяснение (2-3 предложения)",
    "directlyRelatedPercent": число от 0 до 100,
    "unrelatedTasks": ["название задачи 1", "название задачи 2"]
  },
  "overallScore": число от 0 до 100,
  "summary": "Краткое резюме для партнёров (2-3 предложения)",
  "demoRecommendations": [
    {
      "issueKey": "ключ задачи",
      "summary": "название задачи",
      "wowFactor": "Почему эта задача произведёт WOW-эффект (1-2 предложения)",
      "demoComplexity": число от 1 до 5,
      "suggestedFormat": "video" | "screenshot" | "live" | "slides"
    }
  ]
}`;
}

/**
 * Generate basic analysis without AI (fallback).
 */
function generateBasicAnalysis(
  version: VersionMeta | undefined,
  sprint: SprintCardData,
): StrategicAnalysis {
  const doneIssues = sprint.issues.filter((i) => i.statusCategory === 'done');
  const totalSP = sprint.issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
  const doneSP = doneIssues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
  const progressPercent = totalSP > 0 ? Math.round((doneSP / totalSP) * 100) : 0;

  const goalLevel = sprint.goalMatchLevel;
  let taskAlignment: AlignmentLevel = 'unknown';
  if (goalLevel === 'strong') taskAlignment = 'aligned';
  else if (goalLevel === 'medium') taskAlignment = 'partial';
  else if (goalLevel === 'weak') taskAlignment = 'misaligned';

  return {
    versionSprintAlignment: {
      level: version ? 'unknown' : 'unknown',
      comment: version
        ? 'Требуется AI-анализ для оценки соответствия цели спринта и версии.'
        : 'Информация о версии недоступна для анализа.',
      recommendations: version ? undefined : ['Укажите активную версию для полного анализа'],
    },
    sprintTasksAlignment: {
      level: taskAlignment,
      comment: sprint.goalMatchComment || 'Анализ соответствия задач цели спринта.',
      directlyRelatedPercent: goalLevel === 'strong' ? 80 : goalLevel === 'medium' ? 55 : 30,
      unrelatedTasks: undefined,
    },
    overallScore: progressPercent,
    summary: `Спринт выполнен на ${progressPercent}%. ${sprint.goalMatchComment || ''}`,
  };
}


