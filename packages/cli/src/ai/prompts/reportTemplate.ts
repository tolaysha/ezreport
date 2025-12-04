/**
 * Sprint Report Generation Template
 *
 * This template defines the structure and format for generating
 * partner-ready sprint reports from structured data.
 */

// =============================================================================
// Input Data Types
// =============================================================================

export interface ReportInputData {
  projectName: string;

  version: {
    number: number | string;
    deadline: string;
    goal: string;
    progressPercent: number;
  };

  sprint: {
    number: number | string;
    startDate: string;
    endDate: string;
    goal: string;
    progressPercent: number;
    overview: string;
    achievements: Array<{
      title: string;
      description: string;
    }>;
    notDone: Array<{
      title: string;
      reason: string;
      newDeadline?: string;
    }>;
    timelineScreenshotUrl?: string;
  };

  artifacts: Array<{
    title: string;
    description: string;
    epicLink?: string;
    assets: string[];
  }>;

  nextSprint: {
    number: number | string;
    goal: string;
    timelineScreenshotUrl?: string;
    blockers: Array<{
      title: string;
      description: string;
      resolution?: string;
    }>;
  };

  pmQuestions: Array<{
    title: string;
    description?: string;
  }>;

  decisionLogItems?: string[];
}

// =============================================================================
// System Prompt
// =============================================================================

export const REPORT_GENERATION_SYSTEM_PROMPT = `Ты — AI, который из структурированных данных о версии продукта и спринтах генерирует готовый партнёрский отчёт по шаблону.

ТВОЯ ЗАДАЧА:
- Сгенерировать ОДИН markdown-документ отчёта строго по шаблону ниже.
- Сохранить структуру, форматирование и визуальную логику 1-в-1, как в примере.
- Писать простым бизнес-языком, без технических терминов уровня API, пайплайн, девопс и т.п.
- НИКОГДА не оставлять квадратные скобки, заглушки и «TODO» — всегда подставлять реальные данные или аккуратно писать «Нет» / «Не было».

ТРЕБОВАНИЯ К СТИЛЮ:
- Тон: уверенный, спокойный, партнёрский.
- Фокус на бизнес-смысле, а не на технических деталях.
- Overview — 2–3 абзаца, 5–10 предложений, без «воды», подчёркивая:
  - что планировали,
  - что сделали,
  - что это значит для продукта/партнёров.
- Достижения/артефакты — простым языком, объяснять «зачем это важно».
- Если чего-то не было (нет блокеров, нет вопросов PM и т.п.) — явно и коротко «Нет».

ДОПОЛНИТЕЛЬНЫЕ ПРАВИЛА:
1. Никогда не выводи фигурные скобки и имена полей буквально — всегда подставляй готовый текст.
2. Если нет данных для какого-то блока:
   - либо опусти блок целиком (если это логично),
   - либо лаконично напиши, что данных нет/пунктов нет.
3. Не меняй структуру:
   - Заголовки уровней (#, ##, ###), разделители ---, <aside> блоки и формат списков должны соответствовать шаблону.
4. Не добавляй новые секции, которых нет в шаблоне, даже если тебе хочется что-то дополнительно прокомментировать.`;

// =============================================================================
// Report Template
// =============================================================================

export const REPORT_MARKDOWN_TEMPLATE = `# ✅ {{projectName}}

## **Отчет по итогам реализованного спринта**

<aside>
🚀

**Версия** **№ {{version.number}} - дедлайн реализации {{version.deadline}}**

**Цель версии** — {{version.goal}}.

**Версия реализована на {{version.progressPercent}}%**

</aside>

<aside>
✅

**Спринт №{{sprint.number}} - срок реализации с {{sprint.startDate}} по {{sprint.endDate}}**

**Цель спринта** — {{sprint.goal}}.

**Спринт реализован на {{sprint.progressPercent}}%**

</aside>

## **1. Отчет по итогам реализованного спринта:**

{{sprint.timelineScreenshot}}

### **Overview спринта:**

{{sprint.overview}}

---

### Ключевые достижения, выводы и инсайты спринта:

{{sprint.achievements}}

{{sprint.notDone}}

---

## **2. Артефакты по итогам реализованного спринта:**

{{artifacts}}

---

## **3. Планирование спринта № {{nextSprint.number}}**

### Цель

{{nextSprint.goal}}

---

### Timeline спринта

{{nextSprint.timelineScreenshot}}

---

### Блокеры для реализации следующего спринта:

{{nextSprint.blockers}}

---

## **4. Вопросы и предложения от Product Manager:**

{{pmQuestions}}

<aside>
📌

**Decision Log:**

{{decisionLog}}

</aside>`;

// =============================================================================
// User Prompt Builder
// =============================================================================

export function buildReportGenerationPrompt(data: ReportInputData): string {
  return `Сгенерируй отчёт по следующим данным:

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

Используй шаблон и правила из системного промпта. Верни только готовый markdown-документ без дополнительных комментариев.`;
}

// =============================================================================
// Helper: Build Report Input from Sprint Data
// =============================================================================

export interface SprintDataForReport {
  sprintInfo: {
    number: string;
    name: string;
    startDate?: string;
    endDate?: string;
    goal?: string;
  };
  issues: Array<{
    key: string;
    summary: string;
    status: string;
    statusCategory: string;
    storyPoints: number | null;
    assignee: string | null;
    artifact: string | null;
  }>;
  demoIssues: Array<{
    key: string;
    summary: string;
    artifact: string | null;
  }>;
  stats: {
    progressPercent: number;
    doneIssues: number;
    notDoneIssues: number;
  };
  versionMeta?: {
    number?: string;
    deadline?: string;
    goal?: string;
    progressPercent?: number;
  };
  nextSprintNumber?: string;
  projectName?: string;
}

export function buildReportInputFromSprintData(
  data: SprintDataForReport,
): ReportInputData {
  const doneIssues = data.issues.filter((i) => i.statusCategory === 'done');
  const notDoneIssues = data.issues.filter((i) => i.statusCategory !== 'done');

  return {
    projectName: data.projectName || 'Проект',

    version: {
      number: data.versionMeta?.number || '1',
      deadline: data.versionMeta?.deadline || '—',
      goal: data.versionMeta?.goal || 'Реализация MVP продукта.',
      progressPercent: data.versionMeta?.progressPercent || data.stats.progressPercent,
    },

    sprint: {
      number: data.sprintInfo.number,
      startDate: data.sprintInfo.startDate || '—',
      endDate: data.sprintInfo.endDate || '—',
      goal: data.sprintInfo.goal || 'Реализация запланированных задач.',
      progressPercent: data.stats.progressPercent,
      overview: `В спринте ${data.sprintInfo.number} команда работала над ${data.issues.length} задачами. Завершено ${doneIssues.length} задач (${data.stats.progressPercent}%).`,
      achievements: doneIssues.slice(0, 5).map((issue) => ({
        title: issue.summary,
        description: `Задача ${issue.key} успешно завершена.`,
      })),
      notDone: notDoneIssues.map((issue) => ({
        title: issue.summary,
        reason: `Задача ${issue.key} не завершена в текущем спринте.`,
        newDeadline: data.nextSprintNumber ? `Спринт ${data.nextSprintNumber}` : undefined,
      })),
    },

    artifacts: data.demoIssues
      .filter((issue) => issue.artifact)
      .map((issue) => ({
        title: issue.summary,
        description: `Демонстрация функционала по задаче ${issue.key}.`,
        epicLink: undefined,
        assets: issue.artifact ? [issue.artifact] : [],
      })),

    nextSprint: {
      number: data.nextSprintNumber || String(Number(data.sprintInfo.number) + 1),
      goal: 'Продолжение работы над продуктом и завершение перенесённых задач.',
      blockers: [],
    },

    pmQuestions: [],
    decisionLogItems: [],
  };
}


