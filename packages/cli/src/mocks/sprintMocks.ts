/**
 * Mock data generators for sprint-related entities.
 * Used for testing and demo purposes.
 */

import type {
  SprintMeta,
  SprintIssue,
  VersionMeta,
  StrategicAnalysis,
} from '@ezreport/shared';

export function generateMockPreviousSprint(): SprintMeta {
  return {
    id: '1005',
    name: 'Sprint 5',
    state: 'closed',
    startDate: '17 ноября 2025',
    endDate: '28 ноября 2025',
    goal: 'Реализация основного пользовательского сценария и подготовка демо для партнёров',
  };
}

export function generateMockCurrentSprint(): SprintMeta {
  return {
    id: '1006',
    name: 'Sprint 6',
    state: 'active',
    startDate: '1 декабря 2025',
    endDate: '12 декабря 2025',
    goal: 'Завершение интеграции с партнёрской системой и подготовка к закрытому бета-тестированию',
  };
}

export function generateMockPreviousSprintIssues(): SprintIssue[] {
  return [
    {
      key: 'PROJ-101',
      summary: 'Реализовать основной пользовательский сценарий',
      status: 'Done',
      statusCategory: 'done',
      storyPoints: 8,
      assignee: 'Иван Петров',
      artifact: 'https://figma.com/demo-scenario',
      issueType: 'История',
      priority: 'High',
      epicKey: 'PROJ-50',
    },
    {
      key: 'PROJ-102',
      summary: 'Улучшить производительность главной страницы',
      status: 'Done',
      statusCategory: 'done',
      storyPoints: 5,
      assignee: 'Мария Сидорова',
      artifact: null,
      issueType: 'Задача',
      priority: 'Medium',
      epicKey: 'PROJ-51',
    },
    {
      key: 'PROJ-103',
      summary: 'Добавить систему уведомлений',
      status: 'Done',
      statusCategory: 'done',
      storyPoints: 3,
      assignee: 'Иван Петров',
      artifact: 'https://loom.com/notifications-demo',
      issueType: 'История',
      priority: 'Medium',
      epicKey: 'PROJ-50',
    },
    {
      key: 'PROJ-106',
      summary: 'Обновить дизайн личного кабинета',
      status: 'Done',
      statusCategory: 'done',
      storyPoints: 5,
      assignee: 'Мария Сидорова',
      artifact: 'https://figma.com/cabinet-redesign',
      issueType: 'История',
      priority: 'High',
      epicKey: 'PROJ-51',
    },
  ];
}

export function generateMockCurrentSprintIssues(): SprintIssue[] {
  return [
    {
      key: 'PROJ-111',
      summary: 'Интеграция с партнёрской системой аналитики',
      status: 'Done',
      statusCategory: 'done',
      storyPoints: 8,
      assignee: 'Алексей Козлов',
      artifact: 'https://loom.com/partner-integration-demo',
      issueType: 'История',
      priority: 'Highest',
      epicKey: 'PROJ-52',
    },
    {
      key: 'PROJ-112',
      summary: 'Реализовать систему уведомлений в реальном времени',
      status: 'Done',
      statusCategory: 'done',
      storyPoints: 5,
      assignee: 'Иван Петров',
      artifact: 'https://loom.com/notifications-demo',
      issueType: 'История',
      priority: 'High',
      epicKey: 'PROJ-50',
    },
    {
      key: 'PROJ-113',
      summary: 'Обновить документацию API для партнёров',
      status: 'Done',
      statusCategory: 'done',
      storyPoints: 3,
      assignee: 'Мария Сидорова',
      artifact: null,
      issueType: 'Задача',
      priority: 'Medium',
      epicKey: 'PROJ-52',
    },
    {
      key: 'PROJ-114',
      summary: 'Подготовить тестовые сценарии для бета-тестирования',
      status: 'In Progress',
      statusCategory: 'indeterminate',
      storyPoints: 5,
      assignee: 'Иван Петров',
      artifact: null,
      issueType: 'Задача',
      priority: 'High',
      epicKey: 'PROJ-52',
    },
    {
      key: 'PROJ-115',
      summary: 'Настроить мониторинг для продакшн-окружения',
      status: 'To Do',
      statusCategory: 'new',
      storyPoints: 3,
      assignee: null,
      artifact: null,
      issueType: 'Задача',
      priority: 'Medium',
    },
    {
      key: 'PROJ-116',
      summary: 'Исправить ошибку при загрузке файлов',
      status: 'Done',
      statusCategory: 'done',
      storyPoints: 2,
      assignee: 'Алексей Козлов',
      artifact: null,
      issueType: 'Баг',
      priority: 'High',
    },
  ];
}

export function generateMockActiveVersion(): VersionMeta {
  return {
    id: 'v1',
    name: 'v1.0 MVP',
    description: 'Запуск MVP продукта с базовым функционалом для первых пользователей',
    releaseDate: '29 марта 2026',
    released: false,
    progressPercent: 45,
  };
}

export function generateMockStrategicAnalysis(): StrategicAnalysis {
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
    completionPrediction: {
      confidencePercent: 72,
      comment: 'Высокая вероятность завершения спринта в срок. 4 из 6 задач уже выполнены, оставшиеся задачи имеют средний уровень сложности. Основной риск — задача по тестовым сценариям требует координации с партнёрами.',
      risks: [
        'Задача PROJ-114 зависит от внешних партнёров',
        'Задача PROJ-115 не назначена на исполнителя',
      ],
    },
    overallScore: 85,
    summary: 'Спринт хорошо согласован с целями версии. Команда фокусируется на ключевых задачах для подготовки MVP к бета-тестированию с партнёрами.',
  };
}

export function generateMockEpics(): Array<{ key: string; name: string; summary: string; done: boolean }> {
  return [
    {
      key: 'PROJ-50',
      name: 'Пользовательский сценарий',
      summary: 'Реализация основного пользовательского сценария',
      done: false,
    },
    {
      key: 'PROJ-51',
      name: 'Оптимизация UI',
      summary: 'Улучшение производительности и дизайна интерфейса',
      done: true,
    },
    {
      key: 'PROJ-52',
      name: 'Партнёрская интеграция',
      summary: 'Интеграция с партнёрскими системами',
      done: false,
    },
  ];
}


