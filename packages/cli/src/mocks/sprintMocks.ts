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
    overallScore: 85,
    summary: 'Спринт хорошо согласован с целями версии. Команда фокусируется на ключевых задачах для подготовки MVP к бета-тестированию с партнёрами.',
  };
}


