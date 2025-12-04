/**
 * Per-block prompt builders for sprint report generation.
 * All prompts are in Russian as the report is for Russian-speaking partners.
 *
 * Each function builds a prompt for a specific report section,
 * allowing fine-grained control over AI generation.
 */

import type { SprintIssue, VersionMeta } from '../types';
import type {
  BlockGenerationContext,
  SprintInfo,
} from '../../services/workflowTypes';

// =============================================================================
// System Prompts
// =============================================================================

/**
 * Base system prompt for all report block generation
 */
export const BLOCK_GENERATION_SYSTEM_PROMPT = `Ты — опытный менеджер продукта, который пишет отчёты по спринтам для партнёров и стейкхолдеров.

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
10. НЕ придумывай ссылки на figma.com, loom.com, jira или другие ресурсы, если они не указаны.`;

/**
 * System prompt for validation tasks
 */
export const VALIDATION_SYSTEM_PROMPT = `Ты — эксперт по анализу качества отчётов и документации.
Твоя задача — объективно оценить предоставленные данные и выдать структурированный результат.
Отвечай ТОЛЬКО валидным JSON без markdown-разметки.`;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format issues list for inclusion in prompts
 */
export function formatIssuesForPrompt(issues: SprintIssue[]): string {
  if (issues.length === 0) {
    return 'Нет задач';
  }
  return issues
    .map(
      i =>
        `- ${i.key}: ${i.summary} | Статус: ${i.status} | Story Points: ${i.storyPoints ?? 0} | Исполнитель: ${i.assignee ?? 'не назначен'}${i.artifact ? ` | Артефакт: ${i.artifact}` : ''}`,
    )
    .join('\n');
}

/**
 * Format sprint info for inclusion in prompts
 */
function formatSprintInfo(info: SprintInfo): string {
  return `- Название: ${info.name}
- Номер: ${info.number}
- Дата начала: ${info.startDate ?? 'не указано'}
- Дата окончания: ${info.endDate ?? 'не указано'}
- Цель спринта: ${info.goal ?? 'не указана'}`;
}

/**
 * Format statistics for inclusion in prompts
 */
function formatStats(stats: BlockGenerationContext['stats']): string {
  return `- Всего задач: ${stats.totalIssues}
- Выполнено: ${stats.doneIssues}
- Не выполнено: ${stats.notDoneIssues}
- Story Points: ${stats.completedStoryPoints}/${stats.totalStoryPoints}
- Прогресс: ${stats.progressPercent}%`;
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
): string {
  const issueSummaries = issues.map(i => `- ${i.key}: ${i.summary}`).join('\n');

  return `Оцени, насколько задачи спринта соответствуют заявленной цели спринта.

## Цель спринта
${sprintGoal}

## Задачи спринта
${issueSummaries || 'Нет задач'}

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

// =============================================================================
// Block Prompt Builders (Step 2)
// =============================================================================

/**
 * Build prompt for version block generation
 */
export function buildVersionBlockPrompt(
  versionMeta: Partial<VersionMeta> | undefined,
  progressPercent: number,
): string {
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
  "deadline": "дата дедлайна на русском (например, '29 Марта 2026')",
  "goal": "краткая цель версии (1-2 предложения, бизнес-языком)",
  "progressPercent": число от 0 до 100
}

Если цель версии не указана, сформулируй общую цель на основе контекста (например, "Развитие функционала продукта для повышения удобства пользователей").`;
}

/**
 * Build prompt for sprint block generation
 */
export function buildSprintBlockPrompt(
  sprintInfo: SprintInfo,
  progressPercent: number,
): string {
  return `Сгенерируй информацию о спринте для отчёта.

## Входные данные
${formatSprintInfo(sprintInfo)}
- Прогресс: ${progressPercent}%

---

Верни JSON объект:
{
  "number": "номер спринта",
  "startDate": "дата начала на русском (например, '17 Ноября 2025')",
  "endDate": "дата окончания на русском (например, '28 Ноября 2025')",
  "goal": "краткая цель спринта (1-2 предложения, бизнес-языком)",
  "progressPercent": число от 0 до 100
}

Если цель спринта не указана, сформулируй её кратко на основе контекста.`;
}

/**
 * Build prompt for overview section generation
 */
export function buildOverviewPrompt(ctx: BlockGenerationContext): string {
  const doneIssues = ctx.issues.filter(i => i.statusCategory === 'done');
  const notDoneIssues = ctx.issues.filter(i => i.statusCategory !== 'done');

  let goalMatchContext = '';
  if (ctx.goalIssueMatch) {
    goalMatchContext = `
## Оценка соответствия задач цели спринта
- Уровень соответствия: ${ctx.goalIssueMatch.matchLevel}
- Комментарий: ${ctx.goalIssueMatch.comment}
`;
  }

  return `Напиши обзор спринта для партнёров (5-10 предложений).

## Информация о спринте
${formatSprintInfo(ctx.sprintInfo)}

## Статистика
${formatStats(ctx.stats)}
${goalMatchContext}
## Выполненные задачи
${formatIssuesForPrompt(doneIssues)}

## Невыполненные задачи
${formatIssuesForPrompt(notDoneIssues)}

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

/**
 * Build prompt for "not done" section generation
 */
export function buildNotDonePrompt(ctx: BlockGenerationContext): string {
  const notDoneIssues = ctx.issues.filter(i => i.statusCategory !== 'done');

  if (notDoneIssues.length === 0) {
    return `Нет невыполненных задач в спринте.

Верни JSON объект:
{
  "notDone": []
}`;
  }

  return `Опиши невыполненные задачи спринта для партнёров.

## Цель спринта
${ctx.sprintInfo.goal ?? 'не указана'}

## Невыполненные задачи
${formatIssuesForPrompt(notDoneIssues)}

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

/**
 * Build prompt for achievements section generation
 */
export function buildAchievementsPrompt(ctx: BlockGenerationContext): string {
  const doneIssues = ctx.issues.filter(i => i.statusCategory === 'done');

  if (doneIssues.length === 0) {
    return `Нет выполненных задач в спринте.

Верни JSON объект:
{
  "achievements": []
}`;
  }

  return `Выдели ключевые достижения спринта на основе выполненных задач.

## Цель спринта
${ctx.sprintInfo.goal ?? 'не указана'}

## Выполненные задачи
${formatIssuesForPrompt(doneIssues)}

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

/**
 * Build prompt for artifacts section generation
 */
export function buildArtifactsPrompt(ctx: BlockGenerationContext): string {
  // Find issues with artifacts
  const issuesWithArtifacts = ctx.demoIssues.filter(i => i.artifact);

  if (issuesWithArtifacts.length === 0 && ctx.demoIssues.length === 0) {
    return `Нет артефактов для демонстрации.

Верни JSON объект:
{
  "artifacts": []
}`;
  }

  return `Сформируй список артефактов для демонстрации партнёрам.

## Задачи для демо
${formatIssuesForPrompt(ctx.demoIssues)}

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

/**
 * Build prompt for next sprint planning section generation
 */
export function buildNextSprintPrompt(ctx: BlockGenerationContext): string {
  const notDoneIssues = ctx.issues.filter(i => i.statusCategory !== 'done');
  const nextSprintNumber = String(Number(ctx.sprintInfo.number) + 1);

  return `Сформулируй план на следующий спринт.

## Текущий спринт
- Номер: ${ctx.sprintInfo.number}
- Цель: ${ctx.sprintInfo.goal ?? 'не указана'}
- Прогресс: ${ctx.stats.progressPercent}%

## Невыполненные задачи (переносятся)
${formatIssuesForPrompt(notDoneIssues)}

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

/**
 * Build prompt for blockers section generation
 */
export function buildBlockersPrompt(ctx: BlockGenerationContext): string {
  const notDoneIssues = ctx.issues.filter(i => i.statusCategory !== 'done');

  // If all tasks are done, likely no blockers
  if (notDoneIssues.length === 0 && ctx.stats.progressPercent >= 90) {
    return `Спринт выполнен на ${ctx.stats.progressPercent}%, явных блокеров нет.

Верни JSON объект:
{
  "blockers": []
}`;
  }

  return `Определи возможные блокеры для следующего спринта.

## Текущий спринт
- Цель: ${ctx.sprintInfo.goal ?? 'не указана'}
- Прогресс: ${ctx.stats.progressPercent}%

## Невыполненные задачи
${formatIssuesForPrompt(notDoneIssues)}

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

/**
 * Build prompt for PM questions section generation
 */
export function buildPmQuestionsPrompt(ctx: BlockGenerationContext): string {
  let goalMatchContext = '';
  if (ctx.goalIssueMatch && ctx.goalIssueMatch.matchLevel === 'weak') {
    goalMatchContext = `
## Проблема соответствия задач цели
- Оценка: ${ctx.goalIssueMatch.matchLevel}
- Комментарий: ${ctx.goalIssueMatch.comment}
`;
  }

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

// =============================================================================
// Partner Readiness Validation Prompt (Step 3)
// =============================================================================

/**
 * Build prompt for AI-based partner readiness assessment
 */
export function buildPartnerReadinessPrompt(
  reportJson: string,
  dataSummary: string,
): string {
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

