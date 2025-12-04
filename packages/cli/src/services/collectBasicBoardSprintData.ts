/**
 * Board Sprint Data Collection Service
 *
 * Collects basic sprint data for a given board, including:
 * - Previous (last closed) sprint
 * - Current (active) sprint
 *
 * For each sprint, fetches:
 * - Sprint metadata
 * - Issues list
 * - Goal alignment assessment
 * - Recommended artifact issues
 */

import axios, { type AxiosInstance } from 'axios';

import type { SprintIssue } from '../ai/types';
import { IS_MOCK, isJiraConfigured, isOpenAIConfigured, JIRA_CONFIG, OPENAI_CONFIG } from '../config';
import type {
  AlignmentLevel,
  BasicBoardSprintData,
  GoalMatchLevel,
  SprintCardData,
  SprintMeta,
  StrategicAnalysis,
  VersionMeta,
  VersionSprintAlignment,
  SprintTasksAlignment,
} from '../domain/BoardSprintSnapshot';
import type {
  JiraBoardProjectResponse,
  JiraIssue,
  JiraProject,
  JiraSprint,
  JiraSprintResponse,
  JiraVersion,
} from '../jira/types';
import { logger } from '../utils/logger';
import OpenAI from 'openai';

import { assessGoalAlignment } from './goalAlignment';

// =============================================================================
// AI Goal Generation
// =============================================================================

/**
 * Generate a sprint goal based on the issues list using AI.
 */
async function generateSprintGoal(
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

// =============================================================================
// Types
// =============================================================================

export interface CollectBasicBoardParams {
  boardId: string;
  mockMode?: boolean;
}

// =============================================================================
// Mock Data Generators
// =============================================================================

function generateMockPreviousSprint(): SprintMeta {
  return {
    id: '1005',
    name: 'Sprint 5',
    state: 'closed',
    startDate: '17 ноября 2025',
    endDate: '28 ноября 2025',
    goal: 'Реализация основного пользовательского сценария и подготовка демо для партнёров',
  };
}

function generateMockCurrentSprint(): SprintMeta {
  return {
    id: '1006',
    name: 'Sprint 6',
    state: 'active',
    startDate: '1 декабря 2025',
    endDate: '12 декабря 2025',
    goal: 'Завершение интеграции с партнёрской системой и подготовка к закрытому бета-тестированию',
  };
}

function generateMockPreviousSprintIssues(): SprintIssue[] {
  return [
    {
      key: 'PROJ-101',
      summary: 'Реализовать основной пользовательский сценарий',
      status: 'Done',
      statusCategory: 'done',
      storyPoints: 8,
      assignee: 'Иван Петров',
      artifact: 'https://figma.com/demo-scenario',
    },
    {
      key: 'PROJ-102',
      summary: 'Улучшить производительность главной страницы',
      status: 'Done',
      statusCategory: 'done',
      storyPoints: 5,
      assignee: 'Мария Сидорова',
      artifact: null,
    },
    {
      key: 'PROJ-103',
      summary: 'Добавить систему уведомлений',
      status: 'Done',
      statusCategory: 'done',
      storyPoints: 3,
      assignee: 'Иван Петров',
      artifact: 'https://loom.com/notifications-demo',
    },
    {
      key: 'PROJ-106',
      summary: 'Обновить дизайн личного кабинета',
      status: 'Done',
      statusCategory: 'done',
      storyPoints: 5,
      assignee: 'Мария Сидорова',
      artifact: 'https://figma.com/cabinet-redesign',
    },
  ];
}

function generateMockCurrentSprintIssues(): SprintIssue[] {
  return [
    {
      key: 'PROJ-111',
      summary: 'Интеграция с партнёрской системой аналитики',
      status: 'Done',
      statusCategory: 'done',
      storyPoints: 8,
      assignee: 'Алексей Козлов',
      artifact: 'https://loom.com/partner-integration-demo',
    },
    {
      key: 'PROJ-112',
      summary: 'Реализовать систему уведомлений в реальном времени',
      status: 'Done',
      statusCategory: 'done',
      storyPoints: 5,
      assignee: 'Иван Петров',
      artifact: 'https://loom.com/notifications-demo',
    },
    {
      key: 'PROJ-113',
      summary: 'Обновить документацию API для партнёров',
      status: 'Done',
      statusCategory: 'done',
      storyPoints: 3,
      assignee: 'Мария Сидорова',
      artifact: null,
    },
    {
      key: 'PROJ-114',
      summary: 'Подготовить тестовые сценарии для бета-тестирования',
      status: 'In Progress',
      statusCategory: 'indeterminate',
      storyPoints: 5,
      assignee: 'Иван Петров',
      artifact: null,
    },
    {
      key: 'PROJ-115',
      summary: 'Настроить мониторинг для продакшн-окружения',
      status: 'To Do',
      statusCategory: 'new',
      storyPoints: 3,
      assignee: null,
      artifact: null,
    },
  ];
}

function generateMockActiveVersion(): VersionMeta {
  return {
    id: 'v1',
    name: 'v1.0 MVP',
    description: 'Запуск MVP продукта с базовым функционалом для первых пользователей',
    releaseDate: '29 марта 2026',
    released: false,
    progressPercent: 45,
  };
}

function generateMockStrategicAnalysis(): StrategicAnalysis {
  return {
    versionSprintAlignment: {
      level: 'aligned',
      comment: 'Цель спринта напрямую способствует достижению цели версии. Интеграция с партнёрами и подготовка к бета-тестированию — ключевые шаги к запуску MVP.',
      recommendations: [],
    },
    sprintTasksAlignment: {
      level: 'aligned',
      comment: 'Большинство задач спринта (75%) напрямую связаны с заявленной целью. Задачи по интеграции и документации для партнёров соответствуют цели подготовки к бета-тестированию.',
      directlyRelatedPercent: 75,
      unrelatedTasks: ['Настроить мониторинг для продакшн-окружения'],
    },
    overallScore: 85,
    summary: 'Спринт хорошо согласован с целями версии. Команда фокусируется на ключевых задачах для подготовки MVP к бета-тестированию с партнёрами.',
  };
}

// =============================================================================
// Strategic Analysis with AI
// =============================================================================

/**
 * Perform strategic analysis using AI.
 */
async function performStrategicAnalysis(
  version: VersionMeta | undefined,
  currentSprint: SprintCardData | undefined,
  previousSprint: SprintCardData | undefined,
  mockMode: boolean,
): Promise<StrategicAnalysis | undefined> {
  // If no current sprint, cannot analyze
  if (!currentSprint) {
    return undefined;
  }

  // Mock mode
  if (mockMode) {
    logger.info('[performStrategicAnalysis] Using mock analysis');
    return generateMockStrategicAnalysis();
  }

  // Check if OpenAI is configured
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

  // Collect done issues from previous sprint for demo recommendations
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

  // Also add done issues from current sprint if any
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
    "comment": "Объяснение, как цель спринта ведёт к достижению цели версии. Насколько работа спринта приближает к релизу? (2-3 предложения)",
    "recommendations": ["задача 1", "задача 2", "задача 3"] // ОБЯЗАТЕЛЬНО 3 небольших задачи которые можно добавить в спринт чтобы приблизиться к цели версии
  },
  "sprintTasksAlignment": {
    "level": "aligned" | "partial" | "misaligned" | "unknown",
    "comment": "Объяснение, как задачи соотносятся с целью спринта (2-3 предложения)",
    "directlyRelatedPercent": число от 0 до 100,
    "unrelatedTasks": ["название задачи 1", "название задачи 2"] // задачи не связанные с целью
  },
  "overallScore": число от 0 до 100,
  "summary": "Краткое резюме для партнёров (2-3 предложения)",
  "demoRecommendations": [
    {
      "issueKey": "ключ задачи (например TA-123)",
      "summary": "название задачи",
      "wowFactor": "Почему эта задача произведёт WOW-эффект на партнёров — что впечатлит, какую ценность покажет (1-2 предложения)",
      "demoComplexity": число от 1 до 5 (1 = легко показать за 1 мин, 5 = нужна сложная подготовка),
      "suggestedFormat": "video" | "screenshot" | "live" | "slides"
    }
  ]
}

## ВАЖНО: Критерии выбора задач для демо (demoRecommendations):
1. **WOW-эффект для партнёров**: Задача должна визуально впечатлять ИЛИ чётко показывать бизнес-ценность продукта
2. **Простота демонстрации**: Предпочитай задачи с demoComplexity 1-3. НЕ выбирай слишком технические или сложные для показа
3. **Понятность бизнес-аудитории**: Партнёры — не разработчики, выбирай то что они поймут и оценят
4. **Только ЗАВЕРШЁННЫЕ задачи**: Выбирай из секций "Завершённые задачи"
5. **Выбери 2-4 лучших задачи** с лучшим соотношением WOW/сложность

Форматы демо:
- "video": Интерактивные фичи, пользовательские сценарии, анимации — лучше записать видео
- "screenshot": UI, дизайн, статичные результаты — достаточно скриншотов
- "live": Стабильные простые фичи — можно показать живьём
- "slides": Архитектура, исследования, концепции — лучше объяснить на слайдах

Критерии оценки level:
- "aligned": >70% соответствия, ясная связь между целями
- "partial": 40-70% соответствия, частичная связь
- "misaligned": <40% соответствия, цели расходятся
- "unknown": невозможно оценить (нет данных)

## ВАЖНО про recommendations в versionSprintAlignment:
- Дай РОВНО 3 конкретных предложения задач
- Это должны быть НЕБОЛЬШИЕ задачи, которые можно быстро добавить в спринт
- НЕ предлагай "развернуться и делать по-другому"
- Предлагай улучшения текущей ситуации: что добавить чтобы стать ближе к цели версии
- Формулируй как конкретные задачи, например: "Добавить демо-видео продукта для партнёров"
- Каждая задача должна явно приближать к цели версии`;
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

  // Basic heuristic based on goal match level
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

// =============================================================================
// Jira Helpers
// =============================================================================

/**
 * Create a configured Axios instance for Jira API.
 */
function createJiraClient(): AxiosInstance {
  const auth = Buffer.from(
    `${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`,
  ).toString('base64');

  return axios.create({
    baseURL: JIRA_CONFIG.baseUrl,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Fetch all sprints for a board from Jira.
 */
async function fetchSprintsForBoard(
  client: AxiosInstance,
  boardId: string,
): Promise<JiraSprint[]> {
  const allSprints: JiraSprint[] = [];
  let startAt = 0;
  const maxResults = 50;

  while (true) {
    const response = await client.get<JiraSprintResponse>(
      `/rest/agile/1.0/board/${boardId}/sprint`,
      {
        params: { startAt, maxResults },
      },
    );

    allSprints.push(...response.data.values);

    if (response.data.isLast) {
      break;
    }

    startAt += maxResults;
  }

  return allSprints;
}

/**
 * Fetch issues for a sprint from Jira.
 */
async function fetchIssuesForSprint(
  client: AxiosInstance,
  sprintId: number,
): Promise<JiraIssue[]> {
  const issues: JiraIssue[] = [];
  const maxResults = 100;
  const jql = `sprint = ${sprintId}`;
  let nextPageToken: string | undefined;

  while (true) {
    const requestBody: {
      jql: string;
      maxResults: number;
      fields: string[];
      nextPageToken?: string;
    } = {
      jql,
      maxResults,
      fields: [
        'summary',
        'status',
        'assignee',
        'customfield_10016', // Story points
        JIRA_CONFIG.artifactFieldId,
      ],
    };

    if (nextPageToken) {
      requestBody.nextPageToken = nextPageToken;
    }

    const response = await client.post<{
      issues: JiraIssue[];
      isLast: boolean;
      nextPageToken?: string;
    }>('/rest/api/3/search/jql', requestBody);

    issues.push(...response.data.issues);

    if (response.data.isLast || !response.data.nextPageToken) {
      break;
    }

    nextPageToken = response.data.nextPageToken;
  }

  return issues;
}

/**
 * Fetch project associated with a board.
 * Returns the first project if multiple are associated.
 */
async function fetchBoardProject(
  client: AxiosInstance,
  boardId: string,
): Promise<JiraProject | null> {
  try {
    const response = await client.get<JiraBoardProjectResponse>(
      `/rest/agile/1.0/board/${boardId}/project`,
    );

    if (response.data.values.length === 0) {
      logger.warn(`[fetchBoardProject] No projects found for board ${boardId}`);
      return null;
    }

    const project = response.data.values[0];
    logger.info(`[fetchBoardProject] Found project: ${project.key} (${project.name})`);
    return project;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[fetchBoardProject] Failed to fetch project for board ${boardId}`, { error: message });
    return null;
  }
}

/**
 * Fetch all versions for a project.
 */
async function fetchProjectVersions(
  client: AxiosInstance,
  projectKey: string,
): Promise<JiraVersion[]> {
  try {
    const response = await client.get<JiraVersion[]>(
      `/rest/api/3/project/${projectKey}/versions`,
    );

    logger.info(`[fetchProjectVersions] Found ${response.data.length} versions for project ${projectKey}`);
    return response.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[fetchProjectVersions] Failed to fetch versions for project ${projectKey}`, { error: message });
    return [];
  }
}

/**
 * Count issues for a version to calculate progress.
 * Returns { total, done } counts.
 */
async function countVersionIssues(
  client: AxiosInstance,
  versionName: string,
): Promise<{ total: number; done: number }> {
  try {
    // Escape version name for JQL (wrap in quotes)
    const escapedName = `"${versionName.replace(/"/g, '\\"')}"`;
    
    // Get total issues count (maxResults: 1 because 0 is not allowed, but we only need total)
    const totalResponse = await client.post<{ total: number }>(
      '/rest/api/3/search/jql',
      {
        jql: `fixVersion = ${escapedName}`,
        maxResults: 1,
        fields: ['key'],
      },
    );

    // Get done issues count
    const doneResponse = await client.post<{ total: number }>(
      '/rest/api/3/search/jql',
      {
        jql: `fixVersion = ${escapedName} AND statusCategory = Done`,
        maxResults: 1,
        fields: ['key'],
      },
    );

    return {
      total: totalResponse.data.total,
      done: doneResponse.data.total,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[countVersionIssues] Failed to count issues for version ${versionName}`, { error: message });
    return { total: 0, done: 0 };
  }
}

/**
 * Select the "active" version from a list of versions.
 * 
 * Criteria:
 * - Not released and not archived
 * - Has a release date (preferably)
 * - Closest future release date
 * 
 * Falls back to first unreleased version if none have dates.
 */
function selectActiveVersion(versions: JiraVersion[]): JiraVersion | null {
  // Filter to unreleased, non-archived versions
  const activeVersions = versions.filter(v => !v.released && !v.archived);

  if (activeVersions.length === 0) {
    logger.warn('[selectActiveVersion] No unreleased versions found');
    return null;
  }

  // Prefer versions with release dates
  const withDates = activeVersions.filter(v => v.releaseDate);
  
  if (withDates.length > 0) {
    // Sort by release date (earliest first)
    withDates.sort((a, b) => {
      const dateA = new Date(a.releaseDate!).getTime();
      const dateB = new Date(b.releaseDate!).getTime();
      return dateA - dateB;
    });
    
    logger.info(`[selectActiveVersion] Selected version with earliest release: ${withDates[0].name}`);
    return withDates[0];
  }

  // Fallback to first unreleased version
  logger.info(`[selectActiveVersion] No versions with dates, using first unreleased: ${activeVersions[0].name}`);
  return activeVersions[0];
}

interface ProjectAndVersionResult {
  project?: {
    key: string;
    name: string;
  };
  activeVersion?: VersionMeta;
}

/**
 * Fetch project and active version for a board.
 * Returns project info and VersionMeta with progress percentage.
 */
async function fetchProjectAndActiveVersion(
  client: AxiosInstance,
  boardId: string,
): Promise<ProjectAndVersionResult> {
  // Get project for the board
  const project = await fetchBoardProject(client, boardId);
  if (!project) {
    return {};
  }

  const result: ProjectAndVersionResult = {
    project: {
      key: project.key,
      name: project.name,
    },
  };

  // Get all versions
  const versions = await fetchProjectVersions(client, project.key);
  if (versions.length === 0) {
    return result;
  }

  // Select active version
  const activeVersion = selectActiveVersion(versions);
  if (!activeVersion) {
    return result;
  }

  // Count issues for progress (use version name in JQL)
  const { total, done } = await countVersionIssues(client, activeVersion.name);
  const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;

  logger.info(`[fetchProjectAndActiveVersion] Version ${activeVersion.name}: ${done}/${total} done (${progressPercent}%)`);

  result.activeVersion = {
    id: activeVersion.id,
    name: activeVersion.name,
    description: activeVersion.description,
    releaseDate: formatDateRussian(activeVersion.releaseDate),
    released: activeVersion.released,
    progressPercent,
  };

  return result;
}

// =============================================================================
// Conversion Helpers
// =============================================================================

/**
 * Format date to Russian locale.
 */
function formatDateRussian(dateStr: string | undefined): string | undefined {
  if (!dateStr) {
    return undefined;
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

/**
 * Convert JiraSprint to SprintMeta.
 */
function toSprintMeta(sprint: JiraSprint): SprintMeta {
  return {
    id: String(sprint.id),
    name: sprint.name,
    state: sprint.state,
    startDate: formatDateRussian(sprint.startDate),
    endDate: formatDateRussian(sprint.endDate),
    goal: sprint.goal,
  };
}

/**
 * Convert JiraIssue to SprintIssue.
 */
function toSprintIssue(issue: JiraIssue): SprintIssue {
  const fields = issue.fields;

  // Extract story points
  const storyPoints =
    (fields.customfield_10016 as number) ??
    (fields.customfield_10004 as number) ??
    null;

  // Extract artifact
  const artifactValue = fields[JIRA_CONFIG.artifactFieldId];
  let artifact: string | null = null;

  if (typeof artifactValue === 'string') {
    artifact = artifactValue;
  } else if (
    artifactValue &&
    typeof artifactValue === 'object' &&
    'value' in artifactValue
  ) {
    artifact = String(artifactValue.value);
  }

  return {
    key: issue.key,
    summary: fields.summary,
    status: fields.status.name,
    statusCategory: fields.status.statusCategory.key,
    storyPoints,
    assignee: fields.assignee?.displayName ?? null,
    artifact,
  };
}

// =============================================================================
// Artifact Issue Selection
// =============================================================================

/**
 * Pick issues recommended for artifacts / demo.
 *
 * Heuristics:
 * - Only Done issues
 * - Prefer issues with existing artifacts
 * - Prefer issues with higher story points
 * - Prefer Stories/Tasks over Bugs
 * - Limit to 3-5 issues
 */
export function pickRecommendedArtifactIssues(
  issues: SprintIssue[],
): SprintIssue[] {
  // Only consider done issues
  const doneIssues = issues.filter((i) => i.statusCategory === 'done');

  if (doneIssues.length === 0) {
    return [];
  }

  // Score each issue
  const scored = doneIssues.map((issue) => {
    let score = 0;

    // Artifact bonus (highest priority)
    if (issue.artifact) {
      score += 100;
    }

    // Story points bonus
    if (issue.storyPoints && issue.storyPoints >= 3) {
      score += issue.storyPoints * 10;
    }

    // Assignee bonus (accountability)
    if (issue.assignee) {
      score += 5;
    }

    return { issue, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Take top 3-5 issues
  const maxItems = Math.min(5, Math.max(3, scored.length));
  return scored.slice(0, maxItems).map((s) => s.issue);
}

// =============================================================================
// Sprint Card Builder
// =============================================================================

/**
 * Build SprintCardData for a single sprint.
 */
async function buildSprintCardData(
  sprintMeta: SprintMeta,
  issues: SprintIssue[],
  mockMode: boolean,
): Promise<SprintCardData> {
  // Generate goal if not present
  let updatedSprintMeta = { ...sprintMeta };
  if (!sprintMeta.goal && !mockMode && issues.length > 0) {
    logger.info(`[buildSprintCardData] No goal for ${sprintMeta.name}, generating with AI...`);
    const generatedGoal = await generateSprintGoal(issues, sprintMeta.name);
    if (generatedGoal) {
      updatedSprintMeta = {
        ...sprintMeta,
        goal: generatedGoal,
        goalIsGenerated: true,
      };
    }
  }

  // Assess goal alignment
  const alignment = await assessGoalAlignment(updatedSprintMeta, issues, mockMode);

  // Pick recommended artifact issues
  const recommendedArtifactIssues = pickRecommendedArtifactIssues(issues);

  return {
    sprint: updatedSprintMeta,
    issues,
    goalMatchLevel: alignment.level,
    goalMatchComment: alignment.comment,
    recommendedArtifactIssues,
  };
}

/**
 * Build SprintCardData with error handling.
 * Returns a card with empty/unknown values if issues fetch fails.
 */
async function buildSprintCardDataSafe(
  sprint: JiraSprint,
  fetchIssues: () => Promise<JiraIssue[]>,
  mockMode: boolean,
): Promise<SprintCardData> {
  const sprintMeta = toSprintMeta(sprint);

  let issues: SprintIssue[] = [];

  try {
    const rawIssues = await fetchIssues();
    issues = rawIssues.map(toSprintIssue);
    logger.info(`[buildSprintCardDataSafe] Fetched ${issues.length} issues for sprint ${sprint.name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[buildSprintCardDataSafe] Failed to fetch issues for sprint ${sprint.name}`, { error: message });

    // Return card with empty issues and error message
    return {
      sprint: sprintMeta,
      issues: [],
      goalMatchLevel: 'unknown',
      goalMatchComment: 'Не удалось загрузить задачи спринта.',
      recommendedArtifactIssues: [],
    };
  }

  return buildSprintCardData(sprintMeta, issues, mockMode);
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Collect basic sprint data for a board.
 *
 * Fetches previous (last closed) and current (active) sprints,
 * along with their issues and AI assessments.
 *
 * Never throws - returns partial data with availability flags on errors.
 *
 * @param params - Collection parameters including boardId and mockMode
 * @returns BasicBoardSprintData with sprint cards and availability flags
 */
export async function collectBasicBoardSprintData(
  params: CollectBasicBoardParams,
): Promise<BasicBoardSprintData> {
  const { boardId, mockMode: explicitMockMode } = params;
  const useMockMode = explicitMockMode ?? IS_MOCK;

  logger.info(`[collectBasicBoardSprintData] Starting for board ${boardId}, mockMode=${useMockMode}`);

  // Initialize result with empty state
  const result: BasicBoardSprintData = {
    boardId,
    previousSprint: undefined,
    currentSprint: undefined,
    availability: {
      hasPreviousSprint: false,
      hasCurrentSprint: false,
    },
  };

  // Mock mode - only use mock data if explicitly requested
  if (useMockMode) {
    logger.info('[collectBasicBoardSprintData] Using mock data (explicitly requested)');

    const mockPreviousSprint = generateMockPreviousSprint();
    const mockPreviousIssues = generateMockPreviousSprintIssues();
    const mockCurrentSprint = generateMockCurrentSprint();
    const mockCurrentIssues = generateMockCurrentSprintIssues();

    result.activeVersion = generateMockActiveVersion();
    result.previousSprint = await buildSprintCardData(
      mockPreviousSprint,
      mockPreviousIssues,
      true,
    );
    result.currentSprint = await buildSprintCardData(
      mockCurrentSprint,
      mockCurrentIssues,
      true,
    );
    result.analysis = await performStrategicAnalysis(
      result.activeVersion,
      result.currentSprint,
      true,
    );
    result.availability = {
      hasPreviousSprint: true,
      hasCurrentSprint: true,
    };

    logger.info('[collectBasicBoardSprintData] Mock data ready');
    return result;
  }

  // Check if Jira is configured
  if (!isJiraConfigured()) {
    logger.error('[collectBasicBoardSprintData] Jira not configured');
    throw new Error('Jira не настроен. Укажите JIRA_BASE_URL, JIRA_EMAIL и JIRA_API_TOKEN в .env файле.');
  }

  // Real mode - fetch from Jira
  let client: AxiosInstance;
  try {
    client = createJiraClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[collectBasicBoardSprintData] Failed to create Jira client', { error: message });
    return result;
  }

  // Fetch all sprints for the board
  let allSprints: JiraSprint[];
  try {
    logger.info(`[collectBasicBoardSprintData] Fetching sprints for board ${boardId}`);
    allSprints = await fetchSprintsForBoard(client, boardId);
    logger.info(`[collectBasicBoardSprintData] Found ${allSprints.length} sprints`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`[collectBasicBoardSprintData] No sprints found for board ${boardId}`, { error: message });
    return result;
  }

  if (allSprints.length === 0) {
    logger.warn(`[collectBasicBoardSprintData] No sprints found for board ${boardId}`);
    return result;
  }

  // Find active sprint
  const activeSprint = allSprints.find((s) => s.state === 'active');

  // Find closed sprints, sorted by end date (most recent first)
  const closedSprints = allSprints
    .filter((s) => s.state === 'closed')
    .sort((a, b) => {
      const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
      const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
      return dateB - dateA;
    });

  // Fetch project and active version for the board
  logger.info(`[collectBasicBoardSprintData] Fetching project and active version for board ${boardId}`);
  const projectAndVersion = await fetchProjectAndActiveVersion(client, boardId);
  if (projectAndVersion.project) {
    result.projectKey = projectAndVersion.project.key;
    result.projectName = projectAndVersion.project.name;
  }
  result.activeVersion = projectAndVersion.activeVersion;

  // Build previous sprint card (most recent closed)
  if (closedSprints.length > 0) {
    const previousSprint = closedSprints[0];
    logger.info(`[collectBasicBoardSprintData] Building previous sprint card: ${previousSprint.name}`);

    result.previousSprint = await buildSprintCardDataSafe(
      previousSprint,
      () => fetchIssuesForSprint(client, previousSprint.id),
      useMockMode,
    );
    result.availability.hasPreviousSprint = true;
  } else {
    logger.warn(`[collectBasicBoardSprintData] No closed sprint found for board ${boardId}`);
  }

  // Build current sprint card (active sprint)
  if (activeSprint) {
    logger.info(`[collectBasicBoardSprintData] Building current sprint card: ${activeSprint.name}`);

    result.currentSprint = await buildSprintCardDataSafe(
      activeSprint,
      () => fetchIssuesForSprint(client, activeSprint.id),
      useMockMode,
    );
    result.availability.hasCurrentSprint = true;
  } else {
    logger.warn(`[collectBasicBoardSprintData] No active sprint found for board ${boardId}`);
  }

  // Perform strategic analysis if we have a current sprint
  if (result.currentSprint) {
    logger.info('[collectBasicBoardSprintData] Performing strategic analysis...');
    result.analysis = await performStrategicAnalysis(
      result.activeVersion,
      result.currentSprint,
      result.previousSprint,
      useMockMode,
    );
  }

  logger.info('[collectBasicBoardSprintData] Data collection complete', {
    hasPreviousSprint: result.availability.hasPreviousSprint,
    hasCurrentSprint: result.availability.hasCurrentSprint,
    hasAnalysis: !!result.analysis,
  });

  return result;
}

