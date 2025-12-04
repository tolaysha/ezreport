/**
 * Sprint Report Workflow Module
 *
 * Implements a three-stage workflow for generating sprint reports:
 * 1. Data collection & validation
 * 2. Block-by-block report generation (each block uses its own AI prompt)
 * 3. Final report validation against explicit criteria
 *
 * See docs/project-context.md for architecture details.
 */

import OpenAI from 'openai';

import {
  buildAchievementsPrompt,
  buildArtifactsPrompt,
  buildBlockersPrompt,
  buildGoalIssueMatchPrompt,
  buildNextSprintPrompt,
  buildNotDonePrompt,
  buildOverviewPrompt,
  buildPartnerReadinessPrompt,
  buildPmQuestionsPrompt,
  buildSprintBlockPrompt,
  buildVersionBlockPrompt,
  BLOCK_GENERATION_SYSTEM_PROMPT,
  VALIDATION_SYSTEM_PROMPT,
} from '../ai/prompts/sprintReportPrompts';
import type {
  NotionPageResult,
  SprintIssue,
  SprintReportStructured,
} from '../ai/types';
import {
  IS_MOCK,
  isJiraConfigured,
  isOpenAIConfigured,
  OPENAI_CONFIG,
} from '../config';
import { jiraClient } from '../jira/client';
import type { JiraSprint, ParsedJiraIssue } from '../jira/types';
import { notionClient } from '../notion/client';
import { logger } from '../utils/logger';

import { selectDemoIssues } from './demoSelector';
import type {
  BlockGenerationContext,
  CollectedSprintData,
  CollectSprintDataParams,
  GoalIssueMatchAssessment,
  PartnerReadinessAssessment,
  SprintDataValidationResult,
  SprintInfo,
  SprintReportValidationResult,
  SprintReportWorkflowParams,
  SprintReportWorkflowResult,
  ValidationError,
  ValidationWarning,
} from './workflowTypes';
import { DataValidationCodes, ReportValidationCodes } from './workflowTypes';

// =============================================================================
// Constants
// =============================================================================

const MIN_GOAL_LENGTH = 20;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Convert ParsedJiraIssue to domain SprintIssue type
 */
function toSprintIssue(issue: ParsedJiraIssue): SprintIssue {
  return {
    key: issue.key,
    summary: issue.summary,
    status: issue.status,
    statusCategory: issue.statusCategory,
    storyPoints: issue.storyPoints,
    assignee: issue.assignee,
    artifact: issue.artifact,
  };
}

/**
 * Convert JiraSprint to domain SprintInfo type
 */
function toSprintInfo(sprint: JiraSprint): SprintInfo {
  const numberMatch = sprint.name.match(/(\d+)/);
  return {
    id: sprint.id,
    name: sprint.name,
    number: numberMatch?.[1] ?? '1',
    startDate: formatDateRussian(sprint.startDate),
    endDate: formatDateRussian(sprint.endDate),
    goal: sprint.goal,
  };
}

/**
 * Format date to Russian locale
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
 * Calculate completion percentage from issues
 */
function calculateProgressPercent(issues: SprintIssue[]): number {
  const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
  const completedPoints = issues
    .filter(i => i.statusCategory === 'done')
    .reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

  return totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
}

/**
 * Get OpenAI client instance (for validation/generation calls)
 */
function getOpenAIClient(): OpenAI | null {
  if (IS_MOCK || !isOpenAIConfigured()) {
    return null;
  }
  return new OpenAI({ apiKey: OPENAI_CONFIG.apiKey });
}

/**
 * Call OpenAI with a prompt and parse JSON response
 */
async function callOpenAI<T>(
  client: OpenAI,
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const response = await client.chat.completions.create({
    model: OPENAI_CONFIG.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned empty response');
  }

  return JSON.parse(content) as T;
}

// =============================================================================
// Mock Data Generators
// =============================================================================

function generateMockSprintInfo(sprintNameOrId: string): SprintInfo {
  const numberMatch = sprintNameOrId.match(/(\d+)/);
  return {
    id: 12345,
    name: sprintNameOrId,
    number: numberMatch?.[1] ?? '4',
    startDate: '17 ноября 2025',
    endDate: '28 ноября 2025',
    goal: 'Реализация основного пользовательского сценария и подготовка демо для партнёров',
  };
}

function generateMockIssues(): SprintIssue[] {
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
      key: 'PROJ-104',
      summary: 'Интеграция с внешней системой',
      status: 'In Progress',
      statusCategory: 'indeterminate',
      storyPoints: 8,
      assignee: 'Алексей Козлов',
      artifact: null,
    },
    {
      key: 'PROJ-105',
      summary: 'Расширенный отчёт для администраторов',
      status: 'To Do',
      statusCategory: 'new',
      storyPoints: 5,
      assignee: null,
      artifact: null,
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

function generateMockGoalIssueMatch(): GoalIssueMatchAssessment {
  return {
    matchLevel: 'strong',
    comment: 'Большинство задач спринта напрямую связаны с реализацией основного пользовательского сценария.',
  };
}

function generateMockReport(
  ctx: BlockGenerationContext,
): SprintReportStructured {
  const nextSprintNumber = String(Number(ctx.sprintInfo.number) + 1);

  return {
    version: {
      number: ctx.versionMeta?.number ?? '1',
      deadline: ctx.versionMeta?.deadline ?? '29 Марта 2026',
      goal: ctx.versionMeta?.goal ?? 'Запуск MVP продукта с базовым функционалом для первых пользователей.',
      progressPercent: ctx.versionMeta?.progressPercent ?? 35,
    },
    sprint: {
      number: ctx.sprintInfo.number,
      startDate: ctx.sprintInfo.startDate ?? '17 Ноября 2025',
      endDate: ctx.sprintInfo.endDate ?? '28 Ноября 2025',
      goal: ctx.sprintInfo.goal ?? 'Реализация основного пользовательского сценария.',
      progressPercent: ctx.stats.progressPercent,
    },
    overview: `В этом спринте команда сфокусировалась на реализации ключевого пользовательского сценария. Мы успешно завершили основную часть запланированных задач, достигнув ${ctx.stats.progressPercent}% выполнения.

Главным достижением стала возможность для пользователей полноценно работать с основным функционалом продукта. Часть задач перенесена на следующий спринт из-за необходимости дополнительной проработки.`,
    notDone: ctx.issues
      .filter(i => i.statusCategory !== 'done')
      .slice(0, 2)
      .map(i => ({
        title: i.summary,
        reason: 'Требуется дополнительное время на проработку',
        requiredForCompletion: 'Завершить разработку и тестирование',
        newDeadline: `Спринт ${nextSprintNumber}`,
      })),
    achievements: ctx.issues
      .filter(i => i.statusCategory === 'done')
      .slice(0, 3)
      .map(i => ({
        title: i.summary,
        description: 'Функционал готов к использованию и улучшает опыт пользователей.',
      })),
    artifacts: ctx.demoIssues
      .filter(i => i.artifact)
      .map(i => ({
        title: i.summary,
        description: 'Демонстрация функционала для партнёров.',
        jiraLink: undefined,
        attachmentsNote: i.artifact ? 'Видео/скриншоты' : undefined,
      })),
    nextSprint: {
      sprintNumber: nextSprintNumber,
      goal: 'Завершить перенесённые задачи и продолжить развитие продукта.',
    },
    blockers: [],
    pmQuestions: [],
  };
}

function generateMockPartnerReadiness(): PartnerReadinessAssessment {
  return {
    isPartnerReady: true,
    comments: [],
  };
}

// =============================================================================
// Step 1: Data Collection & Validation
// =============================================================================

/**
 * Collect sprint data from Jira (or mock)
 */
export async function collectSprintData(
  params: CollectSprintDataParams,
): Promise<CollectedSprintData> {
  const { sprintNameOrId, versionMeta } = params;

  let sprintInfo: SprintInfo;
  let issues: SprintIssue[];

  if (IS_MOCK || !isJiraConfigured()) {
    logger.info('[MOCK] Using mock sprint data');
    sprintInfo = generateMockSprintInfo(sprintNameOrId);
    issues = generateMockIssues();
  } else {
    logger.info('Fetching sprint data from Jira...');
    const sprintData = await jiraClient.getSprintData(sprintNameOrId);
    sprintInfo = toSprintInfo(sprintData.sprint);
    issues = sprintData.issues.map(toSprintIssue);
  }

  // Select demo issues
  const demoIssues = selectDemoIssues(issues, { maxDemos: 3 });

  // Calculate stats
  const doneIssues = issues.filter(i => i.statusCategory === 'done');
  const notDoneIssues = issues.filter(i => i.statusCategory !== 'done');
  const totalStoryPoints = issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
  const completedStoryPoints = doneIssues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
  const progressPercent = calculateProgressPercent(issues);

  return {
    sprintInfo,
    issues,
    demoIssues,
    versionMeta,
    stats: {
      totalIssues: issues.length,
      doneIssues: doneIssues.length,
      notDoneIssues: notDoneIssues.length,
      totalStoryPoints,
      completedStoryPoints,
      progressPercent,
    },
  };
}

/**
 * Validate collected sprint data
 */
export async function validateSprintData(
  data: CollectedSprintData,
): Promise<SprintDataValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Rule 1: Required sprint fields
  if (!data.sprintInfo.name) {
    errors.push({
      code: DataValidationCodes.SPRINT_NAME_MISSING,
      message: 'Название спринта отсутствует',
      field: 'sprintInfo.name',
    });
  }

  if (!data.sprintInfo.startDate || !data.sprintInfo.endDate) {
    warnings.push({
      code: DataValidationCodes.SPRINT_DATES_MISSING,
      message: 'Даты спринта не указаны',
      field: 'sprintInfo.startDate/endDate',
    });
  }

  if (!data.sprintInfo.goal) {
    warnings.push({
      code: DataValidationCodes.SPRINT_GOAL_MISSING,
      message: 'Цель спринта не указана',
      field: 'sprintInfo.goal',
    });
  }

  // Rule 2: Sprint goal quality
  if (data.sprintInfo.goal && data.sprintInfo.goal.length < MIN_GOAL_LENGTH) {
    warnings.push({
      code: DataValidationCodes.SPRINT_GOAL_TOO_SHORT,
      message: `Цель спринта слишком короткая (менее ${MIN_GOAL_LENGTH} символов)`,
      field: 'sprintInfo.goal',
      details: { length: data.sprintInfo.goal.length, minLength: MIN_GOAL_LENGTH },
    });
  }

  // Rule 3: Required issue fields
  for (const issue of data.issues) {
    if (!issue.key) {
      errors.push({
        code: DataValidationCodes.ISSUE_KEY_MISSING,
        message: `Задача без ключа: ${issue.summary ?? 'без названия'}`,
        field: 'issues[].key',
      });
    }
    if (!issue.summary) {
      errors.push({
        code: DataValidationCodes.ISSUE_SUMMARY_MISSING,
        message: `Задача ${issue.key} без названия`,
        field: 'issues[].summary',
      });
    }
    if (!issue.status) {
      errors.push({
        code: DataValidationCodes.ISSUE_STATUS_MISSING,
        message: `Задача ${issue.key} без статуса`,
        field: 'issues[].status',
      });
    }
    if (!issue.statusCategory) {
      errors.push({
        code: DataValidationCodes.ISSUE_STATUS_CATEGORY_MISSING,
        message: `Задача ${issue.key} без категории статуса`,
        field: 'issues[].statusCategory',
      });
    }
  }

  // Additional warnings
  if (data.stats.doneIssues === 0) {
    warnings.push({
      code: DataValidationCodes.NO_DONE_ISSUES,
      message: 'В спринте нет выполненных задач',
    });
  }

  if (data.stats.totalStoryPoints === 0) {
    warnings.push({
      code: DataValidationCodes.NO_STORY_POINTS,
      message: 'Задачи спринта не имеют story points',
    });
  }

  // Rule 4: AI-based goal-issue match assessment
  let goalIssueMatch: GoalIssueMatchAssessment | null = null;

  if (data.sprintInfo.goal && data.issues.length > 0) {
    const openai = getOpenAIClient();

    if (openai) {
      try {
        logger.info('Checking goal-issue match with AI...');
        const prompt = buildGoalIssueMatchPrompt(data.sprintInfo.goal, data.issues);
        goalIssueMatch = await callOpenAI<GoalIssueMatchAssessment>(
          openai,
          VALIDATION_SYSTEM_PROMPT,
          prompt,
        );
        logger.info(`Goal-issue match level: ${goalIssueMatch.matchLevel}`);
      } catch (error) {
        logger.warn('Failed to assess goal-issue match with AI', { error });
        // Continue without AI assessment
      }
    } else {
      // Mock mode
      goalIssueMatch = generateMockGoalIssueMatch();
      logger.info('[MOCK] Using mock goal-issue match assessment');
    }

    // Add warning if match is weak
    if (goalIssueMatch && goalIssueMatch.matchLevel === 'weak') {
      warnings.push({
        code: DataValidationCodes.GOAL_ISSUE_MATCH_WEAK,
        message: `Слабое соответствие задач цели спринта: ${goalIssueMatch.comment}`,
        details: { matchLevel: goalIssueMatch.matchLevel },
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    goalIssueMatch,
  };
}

// =============================================================================
// Step 2: Block-by-block Report Generation
// =============================================================================

/**
 * Generate sprint report blocks using AI (one prompt per block)
 */
export async function generateSprintReportBlocks(
  data: CollectedSprintData,
  validation: SprintDataValidationResult,
): Promise<SprintReportStructured> {
  const ctx: BlockGenerationContext = {
    sprintInfo: data.sprintInfo,
    issues: data.issues,
    demoIssues: data.demoIssues,
    versionMeta: data.versionMeta,
    stats: data.stats,
    goalIssueMatch: validation.goalIssueMatch,
  };

  const openai = getOpenAIClient();

  // Mock mode - return mock report
  if (!openai) {
    logger.info('[MOCK] Generating mock sprint report');
    return generateMockReport(ctx);
  }

  logger.info('Generating report blocks with AI...');

  // Generate each block separately
  const [
    versionBlock,
    sprintBlock,
    overviewBlock,
    notDoneBlock,
    achievementsBlock,
    artifactsBlock,
    nextSprintBlock,
    blockersBlock,
    pmQuestionsBlock,
  ] = await Promise.all([
    // Version block
    callOpenAI<{ number: string; deadline: string; goal: string; progressPercent: number }>(
      openai,
      BLOCK_GENERATION_SYSTEM_PROMPT,
      buildVersionBlockPrompt(data.versionMeta, data.stats.progressPercent),
    ).catch(err => {
      logger.warn('Failed to generate version block', { error: err });
      return {
        number: data.versionMeta?.number ?? '1',
        deadline: data.versionMeta?.deadline ?? '—',
        goal: data.versionMeta?.goal ?? '',
        progressPercent: data.versionMeta?.progressPercent ?? data.stats.progressPercent,
      };
    }),

    // Sprint block
    callOpenAI<{ number: string; startDate: string; endDate: string; goal: string; progressPercent: number }>(
      openai,
      BLOCK_GENERATION_SYSTEM_PROMPT,
      buildSprintBlockPrompt(data.sprintInfo, data.stats.progressPercent),
    ).catch(err => {
      logger.warn('Failed to generate sprint block', { error: err });
      return {
        number: data.sprintInfo.number,
        startDate: data.sprintInfo.startDate ?? '—',
        endDate: data.sprintInfo.endDate ?? '—',
        goal: data.sprintInfo.goal ?? '',
        progressPercent: data.stats.progressPercent,
      };
    }),

    // Overview block
    callOpenAI<{ overview: string }>(
      openai,
      BLOCK_GENERATION_SYSTEM_PROMPT,
      buildOverviewPrompt(ctx),
    ).catch(err => {
      logger.warn('Failed to generate overview block', { error: err });
      return { overview: '' };
    }),

    // Not done block
    callOpenAI<{ notDone: Array<{ title: string; reason: string; requiredForCompletion: string; newDeadline: string }> }>(
      openai,
      BLOCK_GENERATION_SYSTEM_PROMPT,
      buildNotDonePrompt(ctx),
    ).catch(err => {
      logger.warn('Failed to generate notDone block', { error: err });
      return { notDone: [] };
    }),

    // Achievements block
    callOpenAI<{ achievements: Array<{ title: string; description: string }> }>(
      openai,
      BLOCK_GENERATION_SYSTEM_PROMPT,
      buildAchievementsPrompt(ctx),
    ).catch(err => {
      logger.warn('Failed to generate achievements block', { error: err });
      return { achievements: [] };
    }),

    // Artifacts block
    callOpenAI<{ artifacts: Array<{ title: string; description: string; jiraLink?: string; attachmentsNote?: string }> }>(
      openai,
      BLOCK_GENERATION_SYSTEM_PROMPT,
      buildArtifactsPrompt(ctx),
    ).catch(err => {
      logger.warn('Failed to generate artifacts block', { error: err });
      return { artifacts: [] };
    }),

    // Next sprint block
    callOpenAI<{ nextSprint: { sprintNumber: string; goal: string } }>(
      openai,
      BLOCK_GENERATION_SYSTEM_PROMPT,
      buildNextSprintPrompt(ctx),
    ).catch(err => {
      logger.warn('Failed to generate nextSprint block', { error: err });
      return { nextSprint: { sprintNumber: String(Number(data.sprintInfo.number) + 1), goal: '' } };
    }),

    // Blockers block
    callOpenAI<{ blockers: Array<{ title: string; description: string; resolutionProposal: string }> }>(
      openai,
      BLOCK_GENERATION_SYSTEM_PROMPT,
      buildBlockersPrompt(ctx),
    ).catch(err => {
      logger.warn('Failed to generate blockers block', { error: err });
      return { blockers: [] };
    }),

    // PM questions block
    callOpenAI<{ pmQuestions: Array<{ title: string; description: string }> }>(
      openai,
      BLOCK_GENERATION_SYSTEM_PROMPT,
      buildPmQuestionsPrompt(ctx),
    ).catch(err => {
      logger.warn('Failed to generate pmQuestions block', { error: err });
      return { pmQuestions: [] };
    }),
  ]);

  logger.info('All report blocks generated');

  // Assemble the final report
  return {
    version: versionBlock,
    sprint: sprintBlock,
    overview: overviewBlock.overview,
    notDone: notDoneBlock.notDone,
    achievements: achievementsBlock.achievements,
    artifacts: artifactsBlock.artifacts,
    nextSprint: nextSprintBlock.nextSprint,
    blockers: blockersBlock.blockers,
    pmQuestions: pmQuestionsBlock.pmQuestions,
  };
}

// =============================================================================
// Step 3: Final Report Validation
// =============================================================================

/**
 * Validate the generated sprint report
 */
export async function validateSprintReport(
  report: SprintReportStructured,
  data: CollectedSprintData,
): Promise<SprintReportValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Rule 1: Structure completeness
  const requiredSections: Array<{ key: keyof SprintReportStructured; name: string }> = [
    { key: 'version', name: 'Версия' },
    { key: 'sprint', name: 'Спринт' },
    { key: 'overview', name: 'Overview' },
    { key: 'notDone', name: 'Не реализовано' },
    { key: 'achievements', name: 'Достижения' },
    { key: 'artifacts', name: 'Артефакты' },
    { key: 'nextSprint', name: 'Следующий спринт' },
    { key: 'blockers', name: 'Блокеры' },
    { key: 'pmQuestions', name: 'Вопросы PM' },
  ];

  for (const section of requiredSections) {
    const value = report[section.key];
    if (value === undefined || value === null) {
      errors.push({
        code: ReportValidationCodes.SECTION_MISSING,
        message: `Раздел "${section.name}" отсутствует`,
        field: section.key,
      });
    } else if (typeof value === 'string' && value.trim() === '') {
      // Only check string sections for emptiness
      if (section.key === 'overview') {
        errors.push({
          code: ReportValidationCodes.SECTION_EMPTY,
          message: `Раздел "${section.name}" пустой`,
          field: section.key,
        });
      }
    }
  }

  // Rule 2: Language check (heuristic - presence of Cyrillic)
  const cyrillicRegex = /[а-яА-ЯёЁ]/;
  if (report.overview && !cyrillicRegex.test(report.overview)) {
    errors.push({
      code: ReportValidationCodes.NOT_RUSSIAN,
      message: 'Текст overview не на русском языке',
      field: 'overview',
    });
  }

  // Rule 3: Placeholder detection
  const placeholderPatterns = [/TODO/i, /lorem ipsum/i, /placeholder/i, /\[.*\]/];
  const textToCheck = [
    report.overview,
    report.sprint.goal,
    report.version.goal,
    ...report.achievements.map(a => a.title + ' ' + a.description),
    ...report.notDone.map(n => n.title + ' ' + n.reason),
  ].join(' ');

  for (const pattern of placeholderPatterns) {
    if (pattern.test(textToCheck)) {
      warnings.push({
        code: ReportValidationCodes.PLACEHOLDER_DETECTED,
        message: `Обнаружен возможный placeholder в тексте`,
        details: { pattern: pattern.toString() },
      });
      break;
    }
  }

  // Rule 4: Consistency checks
  // Sprint number match
  if (report.sprint.number !== data.sprintInfo.number) {
    warnings.push({
      code: ReportValidationCodes.SPRINT_NUMBER_MISMATCH,
      message: `Номер спринта в отчёте (${report.sprint.number}) не совпадает с данными (${data.sprintInfo.number})`,
      field: 'sprint.number',
    });
  }

  // Progress range check
  if (report.sprint.progressPercent < 0 || report.sprint.progressPercent > 100) {
    errors.push({
      code: ReportValidationCodes.PROGRESS_OUT_OF_RANGE,
      message: `Прогресс спринта вне диапазона 0-100: ${report.sprint.progressPercent}`,
      field: 'sprint.progressPercent',
    });
  }

  if (report.version.progressPercent < 0 || report.version.progressPercent > 100) {
    errors.push({
      code: ReportValidationCodes.PROGRESS_OUT_OF_RANGE,
      message: `Прогресс версии вне диапазона 0-100: ${report.version.progressPercent}`,
      field: 'version.progressPercent',
    });
  }

  // Issue key reference check
  const issueKeys = new Set(data.issues.map(i => i.key));
  for (const notDoneItem of report.notDone) {
    // Check if title contains an issue key that doesn't exist
    const keyMatch = notDoneItem.title.match(/[A-Z]+-\d+/);
    if (keyMatch && !issueKeys.has(keyMatch[0])) {
      warnings.push({
        code: ReportValidationCodes.INVALID_ISSUE_KEY_REFERENCE,
        message: `Ссылка на несуществующий ключ задачи: ${keyMatch[0]}`,
        field: 'notDone',
        details: { key: keyMatch[0] },
      });
    }
  }

  // Rule 5: Partner readiness AI check
  let partnerReadiness: PartnerReadinessAssessment | null = null;

  const openai = getOpenAIClient();

  if (openai) {
    try {
      logger.info('Checking partner readiness with AI...');

      const reportJson = JSON.stringify(report, null, 2);
      const dataSummary = `Спринт: ${data.sprintInfo.name}
Прогресс: ${data.stats.progressPercent}%
Выполнено: ${data.stats.doneIssues}/${data.stats.totalIssues} задач`;

      partnerReadiness = await callOpenAI<PartnerReadinessAssessment>(
        openai,
        VALIDATION_SYSTEM_PROMPT,
        buildPartnerReadinessPrompt(reportJson, dataSummary),
      );

      logger.info(`Partner readiness: ${partnerReadiness.isPartnerReady}`);

      if (!partnerReadiness.isPartnerReady) {
        warnings.push({
          code: ReportValidationCodes.NOT_PARTNER_READY,
          message: 'Отчёт не готов для партнёров',
          details: { comments: partnerReadiness.comments },
        });
      }
    } catch (error) {
      logger.warn('Failed to check partner readiness with AI', { error });
    }
  } else {
    // Mock mode
    partnerReadiness = generateMockPartnerReadiness();
    logger.info('[MOCK] Using mock partner readiness assessment');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    partnerReadiness,
  };
}

// =============================================================================
// Workflow Orchestrator
// =============================================================================

/**
 * Run the full sprint report workflow
 *
 * Steps:
 * 1. Collect & validate data
 * 2. If ok → generate report blocks (SprintReportStructured)
 * 3. Validate final report
 * 4. If valid → create Notion page (reusing existing adapter)
 * 5. Return structured result with all intermediate validation data + Notion page URL
 */
export async function runSprintReportWorkflow(
  params: SprintReportWorkflowParams,
): Promise<SprintReportWorkflowResult> {
  const { sprintNameOrId, versionMeta, dryRun = false } = params;

  logger.info('[STEP 1/3] Collecting and validating sprint data...');
  console.log('\n📊 [STEP 1/3] Collecting and validating sprint data...\n');

  // Step 1: Collect data
  let collectedData: CollectedSprintData;
  try {
    collectedData = await collectSprintData({ sprintNameOrId, versionMeta });
    console.log(`  ✓ Loaded ${collectedData.issues.length} issues`);
    console.log(`  ✓ Selected ${collectedData.demoIssues.length} demo issues`);
    console.log(`  ✓ Progress: ${collectedData.stats.progressPercent}%`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to collect sprint data', { error: message });
    return {
      success: false,
      sprint: null,
      collectedData: null,
      dataValidation: null,
      report: null,
      reportValidation: null,
      notionPage: null,
      error: message,
      abortReason: 'Data collection failed',
    };
  }

  // Step 1b: Validate data
  let dataValidation: SprintDataValidationResult;
  try {
    dataValidation = await validateSprintData(collectedData);

    if (dataValidation.errors.length > 0) {
      console.log(`  ⚠️  Data validation errors: ${dataValidation.errors.length}`);
      for (const err of dataValidation.errors) {
        console.log(`      - ${err.message}`);
      }
    }
    if (dataValidation.warnings.length > 0) {
      console.log(`  ⚠️  Data validation warnings: ${dataValidation.warnings.length}`);
      for (const warn of dataValidation.warnings) {
        console.log(`      - ${warn.message}`);
      }
    }
    if (dataValidation.goalIssueMatch) {
      console.log(`  ✓ Goal-issue match: ${dataValidation.goalIssueMatch.matchLevel}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to validate sprint data', { error: message });
    return {
      success: false,
      sprint: collectedData.sprintInfo,
      collectedData,
      dataValidation: null,
      report: null,
      reportValidation: null,
      notionPage: null,
      error: message,
      abortReason: 'Data validation failed',
    };
  }

  // Abort if data validation fails
  if (!dataValidation.isValid) {
    logger.warn('[ABORTED] Data validation failed, stopping workflow');
    console.log('\n❌ [ABORTED] Data validation failed. Cannot generate report.\n');
    return {
      success: false,
      sprint: collectedData.sprintInfo,
      collectedData,
      dataValidation,
      report: null,
      reportValidation: null,
      notionPage: null,
      abortReason: 'Data validation failed',
    };
  }

  console.log('  ✓ Data validation passed\n');

  // Step 2: Generate report blocks
  logger.info('[STEP 2/3] Generating report blocks with AI...');
  console.log('🤖 [STEP 2/3] Generating report blocks with AI...\n');

  let report: SprintReportStructured;
  try {
    report = await generateSprintReportBlocks(collectedData, dataValidation);
    console.log('  ✓ Version block generated');
    console.log('  ✓ Sprint block generated');
    console.log('  ✓ Overview generated');
    console.log(`  ✓ Not done items: ${report.notDone.length}`);
    console.log(`  ✓ Achievements: ${report.achievements.length}`);
    console.log(`  ✓ Artifacts: ${report.artifacts.length}`);
    console.log('  ✓ Next sprint plan generated');
    console.log(`  ✓ Blockers: ${report.blockers.length}`);
    console.log(`  ✓ PM questions: ${report.pmQuestions.length}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to generate report blocks', { error: message });
    return {
      success: false,
      sprint: collectedData.sprintInfo,
      collectedData,
      dataValidation,
      report: null,
      reportValidation: null,
      notionPage: null,
      error: message,
      abortReason: 'Report generation failed',
    };
  }

  console.log('  ✓ All report blocks generated\n');

  // Step 3: Validate final report
  logger.info('[STEP 3/3] Validating final report...');
  console.log('✅ [STEP 3/3] Validating final report...\n');

  let reportValidation: SprintReportValidationResult;
  try {
    reportValidation = await validateSprintReport(report, collectedData);

    if (reportValidation.errors.length > 0) {
      console.log(`  ⚠️  Report validation errors: ${reportValidation.errors.length}`);
      for (const err of reportValidation.errors) {
        console.log(`      - ${err.message}`);
      }
    }
    if (reportValidation.warnings.length > 0) {
      console.log(`  ⚠️  Report validation warnings: ${reportValidation.warnings.length}`);
      for (const warn of reportValidation.warnings) {
        console.log(`      - ${warn.message}`);
      }
    }
    if (reportValidation.partnerReadiness) {
      console.log(`  ✓ Partner ready: ${reportValidation.partnerReadiness.isPartnerReady}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to validate report', { error: message });
    return {
      success: false,
      sprint: collectedData.sprintInfo,
      collectedData,
      dataValidation,
      report,
      reportValidation: null,
      notionPage: null,
      error: message,
      abortReason: 'Report validation failed',
    };
  }

  // Abort if report validation fails
  if (!reportValidation.isValid) {
    logger.warn('[ABORTED] Report validation failed, stopping workflow');
    console.log('\n❌ [ABORTED] Report validation failed. Cannot create Notion page.\n');
    return {
      success: false,
      sprint: collectedData.sprintInfo,
      collectedData,
      dataValidation,
      report,
      reportValidation,
      notionPage: null,
      abortReason: 'Report validation failed',
    };
  }

  console.log('  ✓ Report validation passed\n');

  // Dry run - skip Notion page creation
  if (dryRun) {
    logger.info('[DRY RUN] Skipping Notion page creation');
    console.log('📝 [DRY RUN] Report generated but Notion page not created.\n');
    console.log('--- Generated Report (JSON) ---');
    console.log(JSON.stringify(report, null, 2));
    console.log('--- End Report ---\n');

    return {
      success: true,
      sprint: collectedData.sprintInfo,
      collectedData,
      dataValidation,
      report,
      reportValidation,
      notionPage: null,
    };
  }

  // Step 4: Create Notion page
  logger.info('[DONE] Creating Notion page...');
  console.log('📄 Creating Notion page...\n');

  let notionPage: NotionPageResult;
  try {
    notionPage = await notionClient.createSprintReportPage({
      sprintName: collectedData.sprintInfo.name,
      report,
    });
    console.log(`  ✓ Notion page created: ${notionPage.url}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to create Notion page', { error: message });
    return {
      success: false,
      sprint: collectedData.sprintInfo,
      collectedData,
      dataValidation,
      report,
      reportValidation,
      notionPage: null,
      error: message,
      abortReason: 'Notion page creation failed',
    };
  }

  logger.info(`[DONE] Notion page created: ${notionPage.url}`);
  console.log(`\n🎉 [DONE] Sprint report workflow completed successfully!`);
  console.log(`   Notion page: ${notionPage.url}\n`);

  return {
    success: true,
    sprint: collectedData.sprintInfo,
    collectedData,
    dataValidation,
    report,
    reportValidation,
    notionPage,
  };
}

