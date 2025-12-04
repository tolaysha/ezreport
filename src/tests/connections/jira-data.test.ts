/**
 * Jira Data Fetch Test
 *
 * Проверяет получение данных из Jira:
 * - Список досок
 * - Спринты на доске
 * - Задачи в спринте
 */

import axios from 'axios';

import { isJiraConfigured, JIRA_CONFIG } from '../../config';

export interface JiraBoard {
  id: number;
  name: string;
  type: string;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'closed' | 'future';
}

export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
}

export interface SprintInfo {
  id: number;
  name: string;
  issuesCount: number;
  issues: JiraIssue[];
}

export interface JiraDataTestResult {
  service: 'Jira Data';
  success: boolean;
  message: string;
  details?: {
    boardId: string;
    boardName?: string;
    lastClosedSprint?: SprintInfo;
    activeSprint?: SprintInfo;
  };
  error?: string;
}

/**
 * Получает auth header для Jira API
 */
function getAuthHeader(): string {
  return Buffer.from(
    `${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`,
  ).toString('base64');
}

/**
 * Тестирует получение данных из Jira.
 *
 * Проверяет:
 * - Доступность доски (JIRA_BOARD_ID)
 * - Список спринтов на доске
 * - Задачи в активном спринте (если есть)
 */
export async function testJiraDataFetch(): Promise<JiraDataTestResult> {
  const baseResult: JiraDataTestResult = {
    service: 'Jira Data',
    success: false,
    message: '',
  };

  // Проверка конфигурации
  if (!isJiraConfigured()) {
    return {
      ...baseResult,
      message: 'Конфигурация Jira не задана',
      error: 'Отсутствуют JIRA_BASE_URL, JIRA_EMAIL или JIRA_API_TOKEN',
    };
  }

  if (!JIRA_CONFIG.boardId) {
    return {
      ...baseResult,
      message: 'JIRA_BOARD_ID не задан',
      error: 'Укажите JIRA_BOARD_ID в .env файле',
    };
  }

  const auth = getAuthHeader();
  const headers = {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Проверяем доступность доски
    let boardName: string | undefined;
    try {
      const boardResponse = await axios.get(
        `${JIRA_CONFIG.baseUrl}/rest/agile/1.0/board/${JIRA_CONFIG.boardId}`,
        { headers, timeout: 10000 },
      );
      boardName = boardResponse.data.name;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {
          ...baseResult,
          message: `Доска с ID ${JIRA_CONFIG.boardId} не найдена`,
          error: 'Проверьте JIRA_BOARD_ID. Используйте test:jira:boards чтобы увидеть доступные доски',
          details: { boardId: JIRA_CONFIG.boardId },
        };
      }
      throw error;
    }

    // 2. Получаем спринты
    const sprintsResponse = await axios.get(
      `${JIRA_CONFIG.baseUrl}/rest/agile/1.0/board/${JIRA_CONFIG.boardId}/sprint`,
      { headers, timeout: 10000 },
    );

    const sprints: JiraSprint[] = sprintsResponse.data.values;
    const activeSprint = sprints.find(s => s.state === 'active');
    const closedSprints = sprints.filter(s => s.state === 'closed');
    const lastClosedSprint = closedSprints[closedSprints.length - 1];

    // 3. Получаем задачи спринта
    async function getSprintIssues(sprintId: number): Promise<JiraIssue[]> {
      try {
        const issuesResponse = await axios.post(
          `${JIRA_CONFIG.baseUrl}/rest/api/3/search/jql`,
          {
            jql: `sprint = ${sprintId}`,
            maxResults: 100,
            fields: ['summary', 'status'],
          },
          { headers, timeout: 10000 },
        );
        return (issuesResponse.data.issues ?? []).map((issue: { key: string; fields: { summary: string; status: { name: string } } }) => ({
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status.name,
        }));
      } catch {
        return [];
      }
    }

    let activeSprintInfo: SprintInfo | undefined;
    let lastClosedSprintInfo: SprintInfo | undefined;

    if (activeSprint) {
      const issues = await getSprintIssues(activeSprint.id);
      activeSprintInfo = {
        id: activeSprint.id,
        name: activeSprint.name,
        issuesCount: issues.length,
        issues,
      };
    }
    if (lastClosedSprint) {
      const issues = await getSprintIssues(lastClosedSprint.id);
      lastClosedSprintInfo = {
        id: lastClosedSprint.id,
        name: lastClosedSprint.name,
        issuesCount: issues.length,
        issues,
      };
    }

    // Формируем сообщение
    let message = 'Данные получены.';
    if (lastClosedSprintInfo) {
      message += ` Прошлый: ${lastClosedSprintInfo.name} (${lastClosedSprintInfo.issuesCount} задач).`;
    }
    if (activeSprintInfo) {
      message += ` Текущий: ${activeSprintInfo.name} (${activeSprintInfo.issuesCount} задач).`;
    }

    return {
      service: 'Jira Data',
      success: true,
      message,
      details: {
        boardId: JIRA_CONFIG.boardId,
        boardName,
        lastClosedSprint: lastClosedSprintInfo,
        activeSprint: activeSprintInfo,
      },
    };
  } catch (error) {
    let errorMessage = 'Неизвестная ошибка';

    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          errorMessage = 'Ошибка авторизации (401). Проверьте JIRA_API_TOKEN';
        } else if (status === 403) {
          errorMessage = 'Доступ запрещён (403). Нет прав на доску или спринты';
        } else if (status === 404) {
          errorMessage = 'Ресурс не найден (404). Проверьте JIRA_BOARD_ID';
        } else {
          errorMessage = `HTTP ошибка ${status}: ${error.response.statusText}`;
        }
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Таймаут соединения';
      } else {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      ...baseResult,
      message: 'Не удалось получить данные из Jira',
      error: errorMessage,
      details: { boardId: JIRA_CONFIG.boardId },
    };
  }
}

/**
 * Получает список всех доступных досок.
 * Полезно для диагностики и выбора правильного JIRA_BOARD_ID.
 */
export async function listJiraBoards(): Promise<{
  success: boolean;
  boards?: JiraBoard[];
  error?: string;
}> {
  if (!isJiraConfigured()) {
    return {
      success: false,
      error: 'Конфигурация Jira не задана',
    };
  }

  const auth = getAuthHeader();
  const headers = {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.get(
      `${JIRA_CONFIG.baseUrl}/rest/agile/1.0/board`,
      { headers, timeout: 10000 },
    );

    return {
      success: true,
      boards: response.data.values.map((b: JiraBoard) => ({
        id: b.id,
        name: b.name,
        type: b.type,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: axios.isAxiosError(error)
        ? error.message
        : 'Неизвестная ошибка',
    };
  }
}

