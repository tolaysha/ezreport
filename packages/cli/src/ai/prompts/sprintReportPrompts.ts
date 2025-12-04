/**
 * Per-block prompt builders for sprint report generation.
 * Supports multiple languages through the language parameter.
 *
 * Each function builds a prompt for a specific report section,
 * allowing fine-grained control over AI generation.
 */

import type { SupportedLanguage } from '../../i18n/language';
import { getPromptStrings } from '../../i18n/prompts';
import type {
  BlockGenerationContext,
  SprintInfo,
} from '../../services/workflowTypes';

import type { SprintIssue, VersionMeta } from '../types';

// =============================================================================
// System Prompts (language-aware)
// =============================================================================

/**
 * Get base system prompt for all report block generation
 */
export function getBlockGenerationSystemPrompt(lang: SupportedLanguage): string {
  return getPromptStrings(lang).systemPromptBlockGeneration;
}

/**
 * Get system prompt for validation tasks
 */
export function getValidationSystemPrompt(lang: SupportedLanguage): string {
  return getPromptStrings(lang).systemPromptValidation;
}

// Legacy exports for backward compatibility
export const BLOCK_GENERATION_SYSTEM_PROMPT = getPromptStrings('en').systemPromptBlockGeneration;
export const VALIDATION_SYSTEM_PROMPT = getPromptStrings('en').systemPromptValidation;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format issues list for inclusion in prompts
 */
export function formatIssuesForPrompt(issues: SprintIssue[], lang: SupportedLanguage): string {
  const strings = getPromptStrings(lang);
  if (issues.length === 0) {
    return strings.noTasks;
  }
  return issues
    .map(
      i =>
        `- ${i.key}: ${i.summary} | ${lang === 'ru' ? 'Статус' : 'Status'}: ${i.status} | Story Points: ${i.storyPoints ?? 0} | ${lang === 'ru' ? 'Исполнитель' : 'Assignee'}: ${i.assignee ?? strings.notAssigned}${i.artifact ? ` | ${lang === 'ru' ? 'Артефакт' : 'Artifact'}: ${i.artifact}` : ''}`,
    )
    .join('\n');
}

/**
 * Format sprint info for inclusion in prompts
 */
function formatSprintInfo(info: SprintInfo, lang: SupportedLanguage): string {
  const strings = getPromptStrings(lang);
  if (lang === 'ru') {
    return `- Название: ${info.name}
- Номер: ${info.number}
- Дата начала: ${info.startDate ?? strings.notSpecified}
- Дата окончания: ${info.endDate ?? strings.notSpecified}
- Цель спринта: ${info.goal ?? 'не указана'}`;
  }
  return `- Name: ${info.name}
- Number: ${info.number}
- Start date: ${info.startDate ?? strings.notSpecified}
- End date: ${info.endDate ?? strings.notSpecified}
- Sprint goal: ${info.goal ?? strings.notSpecified}`;
}

/**
 * Format statistics for inclusion in prompts
 */
function formatStats(stats: BlockGenerationContext['stats'], lang: SupportedLanguage): string {
  if (lang === 'ru') {
    return `- Всего задач: ${stats.totalIssues}
- Выполнено: ${stats.doneIssues}
- Не выполнено: ${stats.notDoneIssues}
- Story Points: ${stats.completedStoryPoints}/${stats.totalStoryPoints}
- Прогресс: ${stats.progressPercent}%`;
  }
  return `- Total tasks: ${stats.totalIssues}
- Completed: ${stats.doneIssues}
- Not completed: ${stats.notDoneIssues}
- Story Points: ${stats.completedStoryPoints}/${stats.totalStoryPoints}
- Progress: ${stats.progressPercent}%`;
}

// =============================================================================
// Goal-Issue Match Assessment Prompt (Step 1 Validation)
// =============================================================================

/**
 * Build prompt for AI-based goal-to-issues match assessment
 */
export function buildGoalIssueMatchPrompt(
  sprintGoal: string,
  issues: SprintIssue[],
  lang: SupportedLanguage,
): string {
  const issueSummaries = issues.map(i => `- ${i.key}: ${i.summary}`).join('\n');
  const strings = getPromptStrings(lang);

  if (lang === 'ru') {
    return `Оцени, насколько задачи спринта соответствуют заявленной цели спринта.

## Цель спринта
${sprintGoal}

## Задачи спринта
${issueSummaries || strings.noTasks}

---

Верни JSON объект со следующей структурой:
{
  "matchLevel": "strong" | "medium" | "weak",
  "comment": "короткое пояснение (1-2 предложения), почему такая оценка"
}

Критерии:
- "strong": более 70% задач явно связаны с целью спринта
- "medium": 40-70% задач связаны с целью, остальные — поддерживающие или технические
- "weak": менее 40% задач явно связаны с целью, или цель слишком абстрактная`;
  }

  return `Assess how well the sprint tasks align with the stated sprint goal.

## Sprint Goal
${sprintGoal}

## Sprint Tasks
${issueSummaries || strings.noTasks}

---

Return a JSON object with the following structure:
{
  "matchLevel": "strong" | "medium" | "weak",
  "comment": "brief explanation (1-2 sentences) of the assessment"
}

Criteria:
- "strong": more than 70% of tasks are clearly related to the sprint goal
- "medium": 40-70% of tasks are related to the goal, the rest are supporting or technical
- "weak": less than 40% of tasks are clearly related to the goal, or the goal is too abstract`;
}

// =============================================================================
// Block Prompt Builders (Step 2)
// =============================================================================

/**
 * Build prompt for version block generation
 */
export function buildVersionBlockPrompt(
  versionMeta: Partial<VersionMeta> | undefined,
  progressPercent: number,
  lang: SupportedLanguage,
): string {
  const strings = getPromptStrings(lang);

  if (lang === 'ru') {
    return `Сгенерируй информацию о версии продукта для отчёта по спринту.

## Входные данные
- Номер версии: ${versionMeta?.number ?? '1'}
- Дедлайн версии: ${versionMeta?.deadline ?? 'не указан'}
- Цель версии (если есть): ${versionMeta?.goal ?? 'не указана'}
- Текущий прогресс: ${versionMeta?.progressPercent ?? progressPercent}%

---

Верни JSON объект:
{
  "number": "номер версии",
  "deadline": "дата дедлайна на русском (${strings.dateExampleDeadline})",
  "goal": "краткая цель версии (1-2 предложения, бизнес-языком)",
  "progressPercent": число от 0 до 100
}

Если цель версии не указана, сформулируй общую цель на основе контекста (например, "Развитие функционала продукта для повышения удобства пользователей").`;
  }

  return `Generate product version information for the sprint report.

## Input Data
- Version number: ${versionMeta?.number ?? '1'}
- Version deadline: ${versionMeta?.deadline ?? strings.notSpecified}
- Version goal (if available): ${versionMeta?.goal ?? strings.notSpecified}
- Current progress: ${versionMeta?.progressPercent ?? progressPercent}%

---

Return a JSON object:
{
  "number": "version number",
  "deadline": "deadline date ${strings.languageInstruction} (${strings.dateExampleDeadline})",
  "goal": "brief version goal (1-2 sentences, business language)",
  "progressPercent": number from 0 to 100
}

If the version goal is not specified, formulate a general goal based on context (e.g., "Product functionality development to improve user experience").`;
}

/**
 * Build prompt for sprint block generation
 */
export function buildSprintBlockPrompt(
  sprintInfo: SprintInfo,
  progressPercent: number,
  lang: SupportedLanguage,
): string {
  const strings = getPromptStrings(lang);

  if (lang === 'ru') {
    return `Сгенерируй информацию о спринте для отчёта.

## Входные данные
${formatSprintInfo(sprintInfo, lang)}
- Прогресс: ${progressPercent}%

---

Верни JSON объект:
{
  "number": "номер спринта",
  "startDate": "дата начала на русском (${strings.dateExampleStart})",
  "endDate": "дата окончания на русском (${strings.dateExampleEnd})",
  "goal": "краткая цель спринта (1-2 предложения, бизнес-языком)",
  "progressPercent": число от 0 до 100
}

Если цель спринта не указана, сформулируй её кратко на основе контекста.`;
  }

  return `Generate sprint information for the report.

## Input Data
${formatSprintInfo(sprintInfo, lang)}
- Progress: ${progressPercent}%

---

Return a JSON object:
{
  "number": "sprint number",
  "startDate": "start date ${strings.languageInstruction} (${strings.dateExampleStart})",
  "endDate": "end date ${strings.languageInstruction} (${strings.dateExampleEnd})",
  "goal": "brief sprint goal (1-2 sentences, business language)",
  "progressPercent": number from 0 to 100
}

If the sprint goal is not specified, formulate it briefly based on context.`;
}

/**
 * Build prompt for overview section generation
 */
export function buildOverviewPrompt(ctx: BlockGenerationContext, lang: SupportedLanguage): string {
  const doneIssues = ctx.issues.filter(i => i.statusCategory === 'done');
  const notDoneIssues = ctx.issues.filter(i => i.statusCategory !== 'done');

  let goalMatchContext = '';
  if (ctx.goalIssueMatch) {
    if (lang === 'ru') {
      goalMatchContext = `
## Оценка соответствия задач цели спринта
- Уровень соответствия: ${ctx.goalIssueMatch.matchLevel}
- Комментарий: ${ctx.goalIssueMatch.comment}
`;
    } else {
      goalMatchContext = `
## Goal-Task Alignment Assessment
- Alignment level: ${ctx.goalIssueMatch.matchLevel}
- Comment: ${ctx.goalIssueMatch.comment}
`;
    }
  }

  if (lang === 'ru') {
    return `Напиши обзор спринта для партнёров (5-10 предложений).

## Информация о спринте
${formatSprintInfo(ctx.sprintInfo, lang)}

## Статистика
${formatStats(ctx.stats, lang)}
${goalMatchContext}
## Выполненные задачи
${formatIssuesForPrompt(doneIssues, lang)}

## Невыполненные задачи
${formatIssuesForPrompt(notDoneIssues, lang)}

---

Верни JSON объект:
{
  "overview": "текст обзора (5-10 предложений)"
}

ВАЖНО:
- Текст должен быть понятен бизнес-партнёрам без технических знаний.
- Опиши: что планировали, что удалось сделать, какие были сложности.
- Не выдумывай факты, основывайся только на данных выше.
- Если выполненных задач мало или нет — честно об этом напиши.`;
  }

  return `Write a sprint overview for partners (5-10 sentences).

## Sprint Information
${formatSprintInfo(ctx.sprintInfo, lang)}

## Statistics
${formatStats(ctx.stats, lang)}
${goalMatchContext}
## Completed Tasks
${formatIssuesForPrompt(doneIssues, lang)}

## Incomplete Tasks
${formatIssuesForPrompt(notDoneIssues, lang)}

---

Return a JSON object:
{
  "overview": "overview text (5-10 sentences)"
}

IMPORTANT:
- The text should be understandable to business partners without technical knowledge.
- Describe: what was planned, what was accomplished, what challenges arose.
- Do not invent facts, base only on the data above.
- If few or no tasks were completed — be honest about it.`;
}

/**
 * Build prompt for "not done" section generation
 */
export function buildNotDonePrompt(ctx: BlockGenerationContext, lang: SupportedLanguage): string {
  const notDoneIssues = ctx.issues.filter(i => i.statusCategory !== 'done');

  if (notDoneIssues.length === 0) {
    if (lang === 'ru') {
      return `Нет невыполненных задач в спринте.

Верни JSON объект:
{
  "notDone": []
}`;
    }
    return `No incomplete tasks in the sprint.

Return a JSON object:
{
  "notDone": []
}`;
  }

  if (lang === 'ru') {
    return `Опиши невыполненные задачи спринта для партнёров.

## Цель спринта
${ctx.sprintInfo.goal ?? 'не указана'}

## Невыполненные задачи
${formatIssuesForPrompt(notDoneIssues, lang)}

## Номер следующего спринта
${Number(ctx.sprintInfo.number) + 1}

---

Верни JSON объект:
{
  "notDone": [
    {
      "title": "Название задачи простым языком (без технических терминов)",
      "reason": "Причина, почему не сделано (если можно понять из статуса — укажи; если нет — напиши 'Требуется дополнительное время')",
      "requiredForCompletion": "Что нужно для завершения задачи",
      "newDeadline": "Спринт N" или "—" если неизвестно
    }
  ]
}

ВАЖНО:
- Используй ТОЛЬКО задачи из списка выше.
- Ключи задач (например, PROJ-123) должны точно соответствовать входным данным.
- Не придумывай задачи, которых нет в списке.`;
  }

  return `Describe the incomplete sprint tasks for partners.

## Sprint Goal
${ctx.sprintInfo.goal ?? 'not specified'}

## Incomplete Tasks
${formatIssuesForPrompt(notDoneIssues, lang)}

## Next Sprint Number
${Number(ctx.sprintInfo.number) + 1}

---

Return a JSON object:
{
  "notDone": [
    {
      "title": "Task name in simple language (no technical terms)",
      "reason": "Reason why not done (if inferable from status — specify; otherwise — write 'Additional time required')",
      "requiredForCompletion": "What's needed to complete the task",
      "newDeadline": "Sprint N" or "—" if unknown
    }
  ]
}

IMPORTANT:
- Use ONLY tasks from the list above.
- Task keys (e.g., PROJ-123) must exactly match the input data.
- Do not invent tasks that are not in the list.`;
}

/**
 * Build prompt for achievements section generation
 */
export function buildAchievementsPrompt(ctx: BlockGenerationContext, lang: SupportedLanguage): string {
  const doneIssues = ctx.issues.filter(i => i.statusCategory === 'done');

  if (doneIssues.length === 0) {
    if (lang === 'ru') {
      return `Нет выполненных задач в спринте.

Верни JSON объект:
{
  "achievements": []
}`;
    }
    return `No completed tasks in the sprint.

Return a JSON object:
{
  "achievements": []
}`;
  }

  if (lang === 'ru') {
    return `Выдели ключевые достижения спринта на основе выполненных задач.

## Цель спринта
${ctx.sprintInfo.goal ?? 'не указана'}

## Выполненные задачи
${formatIssuesForPrompt(doneIssues, lang)}

## Прогресс спринта
${ctx.stats.progressPercent}%

---

Верни JSON объект:
{
  "achievements": [
    {
      "title": "Короткий тезис достижения (что сделали)",
      "description": "Пояснение ценности для бизнеса/пользователей (1-2 предложения)"
    }
  ]
}

ВАЖНО:
- Группируй связанные задачи в одно достижение.
- Фокусируйся на ЦЕННОСТИ для пользователя/бизнеса, а не на технической реализации.
- Если задачи выполнены, но их польза неочевидна — опиши их кратко.
- Возвращай пустой массив [], если выполненных задач нет.
- НЕ ВЫДУМЫВАЙ достижения, которых нет в данных!`;
  }

  return `Highlight key sprint achievements based on completed tasks.

## Sprint Goal
${ctx.sprintInfo.goal ?? 'not specified'}

## Completed Tasks
${formatIssuesForPrompt(doneIssues, lang)}

## Sprint Progress
${ctx.stats.progressPercent}%

---

Return a JSON object:
{
  "achievements": [
    {
      "title": "Brief achievement statement (what was done)",
      "description": "Explanation of value for business/users (1-2 sentences)"
    }
  ]
}

IMPORTANT:
- Group related tasks into one achievement.
- Focus on VALUE for user/business, not technical implementation.
- If tasks are completed but their benefit is unclear — describe them briefly.
- Return an empty array [] if no tasks were completed.
- DO NOT INVENT achievements that are not in the data!`;
}

/**
 * Build prompt for artifacts section generation
 */
export function buildArtifactsPrompt(ctx: BlockGenerationContext, lang: SupportedLanguage): string {
  const issuesWithArtifacts = ctx.demoIssues.filter(i => i.artifact);

  if (issuesWithArtifacts.length === 0 && ctx.demoIssues.length === 0) {
    if (lang === 'ru') {
      return `Нет артефактов для демонстрации.

Верни JSON объект:
{
  "artifacts": []
}`;
    }
    return `No artifacts for demonstration.

Return a JSON object:
{
  "artifacts": []
}`;
  }

  if (lang === 'ru') {
    return `Сформируй список артефактов для демонстрации партнёрам.

## Задачи для демо
${formatIssuesForPrompt(ctx.demoIssues, lang)}

---

Верни JSON объект:
{
  "artifacts": [
    {
      "title": "Название артефакта (понятное партнёрам)",
      "description": "Описание артефакта и его ценности (1-2 предложения)",
      "jiraLink": "ссылка на задачу, если есть артефакт, или null",
      "attachmentsNote": "тип вложений (видео, скриншоты, макеты) или null"
    }
  ]
}

ВАЖНО:
- Создавай артефакты ТОЛЬКО для задач, у которых есть поле "Артефакт" во входных данных.
- Если у задачи нет артефакта — не добавляй её в список.
- НЕ придумывай ссылки на figma, loom и т.п., если их нет во входных данных.
- Если артефактов нет — верни пустой массив [].`;
  }

  return `Create a list of artifacts for partner demonstration.

## Demo Tasks
${formatIssuesForPrompt(ctx.demoIssues, lang)}

---

Return a JSON object:
{
  "artifacts": [
    {
      "title": "Artifact name (understandable to partners)",
      "description": "Artifact description and its value (1-2 sentences)",
      "jiraLink": "link to task if artifact exists, or null",
      "attachmentsNote": "attachment type (video, screenshots, mockups) or null"
    }
  ]
}

IMPORTANT:
- Create artifacts ONLY for tasks that have an "Artifact" field in the input data.
- If a task has no artifact — do not add it to the list.
- DO NOT invent links to figma, loom, etc. if they are not in the input data.
- If there are no artifacts — return an empty array [].`;
}

/**
 * Build prompt for next sprint planning section generation
 */
export function buildNextSprintPrompt(ctx: BlockGenerationContext, lang: SupportedLanguage): string {
  const notDoneIssues = ctx.issues.filter(i => i.statusCategory !== 'done');
  const nextSprintNumber = String(Number(ctx.sprintInfo.number) + 1);

  if (lang === 'ru') {
    return `Сформулируй план на следующий спринт.

## Текущий спринт
- Номер: ${ctx.sprintInfo.number}
- Цель: ${ctx.sprintInfo.goal ?? 'не указана'}
- Прогресс: ${ctx.stats.progressPercent}%

## Невыполненные задачи (переносятся)
${formatIssuesForPrompt(notDoneIssues, lang)}

## Номер следующего спринта
${nextSprintNumber}

---

Верни JSON объект:
{
  "nextSprint": {
    "sprintNumber": "${nextSprintNumber}",
    "goal": "цель следующего спринта (1-2 предложения, бизнес-языком)"
  }
}

Цель должна учитывать:
- Перенесённые задачи из текущего спринта.
- Логическое продолжение работы над продуктом.`;
  }

  return `Formulate a plan for the next sprint.

## Current Sprint
- Number: ${ctx.sprintInfo.number}
- Goal: ${ctx.sprintInfo.goal ?? 'not specified'}
- Progress: ${ctx.stats.progressPercent}%

## Incomplete Tasks (carried over)
${formatIssuesForPrompt(notDoneIssues, lang)}

## Next Sprint Number
${nextSprintNumber}

---

Return a JSON object:
{
  "nextSprint": {
    "sprintNumber": "${nextSprintNumber}",
    "goal": "next sprint goal (1-2 sentences, business language)"
  }
}

The goal should consider:
- Tasks carried over from the current sprint.
- Logical continuation of product development.`;
}

/**
 * Build prompt for blockers section generation
 */
export function buildBlockersPrompt(ctx: BlockGenerationContext, lang: SupportedLanguage): string {
  const notDoneIssues = ctx.issues.filter(i => i.statusCategory !== 'done');

  if (notDoneIssues.length === 0 && ctx.stats.progressPercent >= 90) {
    if (lang === 'ru') {
      return `Спринт выполнен на ${ctx.stats.progressPercent}%, явных блокеров нет.

Верни JSON объект:
{
  "blockers": []
}`;
    }
    return `Sprint completed at ${ctx.stats.progressPercent}%, no apparent blockers.

Return a JSON object:
{
  "blockers": []
}`;
  }

  if (lang === 'ru') {
    return `Определи возможные блокеры для следующего спринта.

## Текущий спринт
- Цель: ${ctx.sprintInfo.goal ?? 'не указана'}
- Прогресс: ${ctx.stats.progressPercent}%

## Невыполненные задачи
${formatIssuesForPrompt(notDoneIssues, lang)}

---

Верни JSON объект:
{
  "blockers": [
    {
      "title": "Название блокера (понятно бизнесу)",
      "description": "Пояснение проблемы",
      "resolutionProposal": "Предлагаемый способ решения"
    }
  ]
}

ВАЖНО:
- Определяй блокеры на основе невыполненных задач или низкого прогресса.
- Если явных блокеров нет — верни пустой массив [].
- Не выдумывай блокеры, которых нет в данных.`;
  }

  return `Identify potential blockers for the next sprint.

## Current Sprint
- Goal: ${ctx.sprintInfo.goal ?? 'not specified'}
- Progress: ${ctx.stats.progressPercent}%

## Incomplete Tasks
${formatIssuesForPrompt(notDoneIssues, lang)}

---

Return a JSON object:
{
  "blockers": [
    {
      "title": "Blocker name (business-friendly)",
      "description": "Problem explanation",
      "resolutionProposal": "Proposed resolution"
    }
  ]
}

IMPORTANT:
- Identify blockers based on incomplete tasks or low progress.
- If there are no apparent blockers — return an empty array [].
- Do not invent blockers that are not in the data.`;
}

/**
 * Build prompt for PM questions section generation
 */
export function buildPmQuestionsPrompt(ctx: BlockGenerationContext, lang: SupportedLanguage): string {
  let goalMatchContext = '';
  if (ctx.goalIssueMatch && ctx.goalIssueMatch.matchLevel === 'weak') {
    if (lang === 'ru') {
      goalMatchContext = `
## Проблема соответствия задач цели
- Оценка: ${ctx.goalIssueMatch.matchLevel}
- Комментарий: ${ctx.goalIssueMatch.comment}
`;
    } else {
      goalMatchContext = `
## Goal-Task Alignment Issue
- Assessment: ${ctx.goalIssueMatch.matchLevel}
- Comment: ${ctx.goalIssueMatch.comment}
`;
    }
  }

  if (lang === 'ru') {
    return `Сформулируй вопросы и предложения от Product Manager к партнёрам/стейкхолдерам.

## Контекст спринта
- Цель: ${ctx.sprintInfo.goal ?? 'не указана'}
- Прогресс: ${ctx.stats.progressPercent}%
- Выполнено задач: ${ctx.stats.doneIssues}/${ctx.stats.totalIssues}
${goalMatchContext}
---

Верни JSON объект:
{
  "pmQuestions": [
    {
      "title": "Вопрос или предложение (тезис)",
      "description": "Пояснение контекста и причин вопроса"
    }
  ]
}

Возможные темы для вопросов:
- Приоритеты функционала.
- Уточнение требований.
- Ресурсы и сроки.
- Если вопросов нет — верни пустой массив [].`;
  }

  return `Formulate questions and proposals from the Product Manager to partners/stakeholders.

## Sprint Context
- Goal: ${ctx.sprintInfo.goal ?? 'not specified'}
- Progress: ${ctx.stats.progressPercent}%
- Tasks completed: ${ctx.stats.doneIssues}/${ctx.stats.totalIssues}
${goalMatchContext}
---

Return a JSON object:
{
  "pmQuestions": [
    {
      "title": "Question or proposal (thesis)",
      "description": "Context and reason explanation"
    }
  ]
}

Possible topics for questions:
- Feature priorities.
- Requirements clarification.
- Resources and timelines.
- If no questions — return an empty array [].`;
}

// =============================================================================
// Partner Readiness Validation Prompt (Step 3)
// =============================================================================

/**
 * Build prompt for AI-based partner readiness assessment
 */
export function buildPartnerReadinessPrompt(
  reportJson: string,
  dataSummary: string,
  lang: SupportedLanguage,
): string {
  if (lang === 'ru') {
    return `Оцени готовность отчёта по спринту для показа внешним партнёрам.

## Отчёт (JSON)
${reportJson}

## Краткие данные о спринте
${dataSummary}

---

Верни JSON объект:
{
  "isPartnerReady": true | false,
  "comments": [
    "комментарий 1 (если есть проблемы)",
    "комментарий 2 (если есть)"
  ]
}

Критерии оценки:
1. Понятность: текст понятен человеку без технических знаний?
2. Согласованность: нет ли противоречий между разделами?
3. Профессионализм: нет ли рискованных формулировок или внутреннего жаргона?
4. Полнота: все ключевые разделы заполнены?

Если отчёт готов для партнёров — isPartnerReady: true, comments: [].
Если есть проблемы — isPartnerReady: false и перечисли их в comments.`;
  }

  return `Assess the sprint report's readiness for external partners.

## Report (JSON)
${reportJson}

## Brief Sprint Data
${dataSummary}

---

Return a JSON object:
{
  "isPartnerReady": true | false,
  "comments": [
    "comment 1 (if issues exist)",
    "comment 2 (if any)"
  ]
}

Assessment criteria:
1. Clarity: Is the text understandable to someone without technical knowledge?
2. Consistency: Are there any contradictions between sections?
3. Professionalism: Are there risky phrases or internal jargon?
4. Completeness: Are all key sections filled?

If the report is ready for partners — isPartnerReady: true, comments: [].
If there are issues — isPartnerReady: false and list them in comments.`;
}
