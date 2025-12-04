import {
  SprintReportStructured,
  SprintReportWorkflowResult,
} from '@/types/workflow';

export type ReportBlockId =
  | 'version'
  | 'sprint'
  | 'overview'
  | 'notDone'
  | 'achievements'
  | 'artifacts'
  | 'nextSprint'
  | 'blockers'
  | 'pmQuestions';

export interface ReportBlockConfig {
  id: ReportBlockId;
  title: string;
  description: string;
  promptTemplate: string;
  getInputPreview: (result: SprintReportWorkflowResult | null) => unknown;
  getBlockText: (report: SprintReportStructured | null) => string | undefined;
}

export const REPORT_BLOCKS: ReportBlockConfig[] = [
  {
    id: 'version',
    title: 'Версия',
    description: 'Идентификатор версии формата отчёта.',
    promptTemplate:
      'Укажи версию формата отчёта (например, "1.0"). Это техническое поле для совместимости.',
    getInputPreview: () => ({
      note: 'Версия формата генерируется автоматически.',
    }),
    getBlockText: (report) => report?.version,
  },
  {
    id: 'sprint',
    title: 'Информация о спринте',
    description: 'Название спринта и ключевые даты.',
    promptTemplate:
      'Сформируй краткую строку с названием спринта и датами в формате: "Sprint Name (DD.MM - DD.MM.YYYY)".',
    getInputPreview: (result) => ({
      sprint: result?.sprint,
    }),
    getBlockText: (report) => report?.sprint,
  },
  {
    id: 'overview',
    title: 'Обзор спринта',
    description: 'Обзор завершённого спринта (5–10 предложений).',
    promptTemplate:
      'Сгенерируй обзор спринта (5–10 предложений) на основе цели спринта, списка задач и их статусов. Пиши по-деловому, понятно для внешнего партнёра. Не упоминай внутренние детали, фокусируйся на результатах.',
    getInputPreview: (result) => ({
      sprint: result?.sprint,
      dataValidation: {
        goalIssueMatchLevel: result?.dataValidation?.goalIssueMatchLevel,
        goalIssueMatchComment: result?.dataValidation?.goalIssueMatchComment,
      },
    }),
    getBlockText: (report) => report?.overview,
  },
  {
    id: 'notDone',
    title: 'Не выполнено',
    description: 'Список задач, которые не были завершены в спринте.',
    promptTemplate:
      'Составь список незавершённых задач спринта. Для каждой укажи название и краткую причину (если известна). Формат: маркированный список.',
    getInputPreview: (result) => ({
      sprint: result?.sprint,
      note: 'Список незавершённых задач берётся из данных Jira.',
    }),
    getBlockText: (report) => report?.notDone,
  },
  {
    id: 'achievements',
    title: 'Достижения',
    description: 'Ключевые достижения и завершённые задачи спринта.',
    promptTemplate:
      'Опиши ключевые достижения спринта: завершённые фичи, важные исправления, улучшения. Пиши конкретно, с акцентом на бизнес-ценность для партнёра.',
    getInputPreview: (result) => ({
      sprint: result?.sprint,
      note: 'Данные о завершённых задачах берутся из Jira.',
    }),
    getBlockText: (report) => report?.achievements,
  },
  {
    id: 'artifacts',
    title: 'Артефакты',
    description: 'Ссылки на документы, релизы, демо и другие материалы.',
    promptTemplate:
      'Перечисли артефакты спринта: ссылки на документацию, релизы, демо-видео, дизайн-макеты. Если артефактов нет — укажи "Нет артефактов".',
    getInputPreview: (result) => ({
      sprint: result?.sprint,
      note: 'Артефакты могут быть указаны в описании задач или в extra-параметрах.',
    }),
    getBlockText: (report) => report?.artifacts,
  },
  {
    id: 'nextSprint',
    title: 'Следующий спринт',
    description: 'Планы и приоритеты на следующий спринт.',
    promptTemplate:
      'Опиши планы на следующий спринт: основные приоритеты, ожидаемые фичи, технический долг. Если информации нет — укажи "Планы уточняются".',
    getInputPreview: (result) => ({
      sprint: result?.sprint,
      note: 'Планы на следующий спринт могут быть в extra-параметрах или в бэклоге.',
    }),
    getBlockText: (report) => report?.nextSprint,
  },
  {
    id: 'blockers',
    title: 'Блокеры',
    description: 'Проблемы и блокеры, влияющие на прогресс.',
    promptTemplate:
      'Перечисли блокеры и проблемы спринта: технические сложности, зависимости от внешних команд, нехватка ресурсов. Если блокеров не было — укажи "Блокеров не выявлено".',
    getInputPreview: (result) => ({
      sprint: result?.sprint,
      dataValidation: {
        errors: result?.dataValidation?.errors,
        warnings: result?.dataValidation?.warnings,
      },
    }),
    getBlockText: (report) => report?.blockers,
  },
  {
    id: 'pmQuestions',
    title: 'Вопросы к PM',
    description: 'Вопросы и уточнения, требующие внимания PM.',
    promptTemplate:
      'Сформулируй вопросы к проектному менеджеру: уточнения по требованиям, приоритетам, срокам. Если вопросов нет — укажи "Вопросов нет".',
    getInputPreview: (result) => ({
      sprint: result?.sprint,
      dataValidation: {
        warnings: result?.dataValidation?.warnings,
      },
    }),
    getBlockText: (report) => report?.pmQuestions,
  },
];

