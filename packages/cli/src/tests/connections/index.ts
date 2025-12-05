/**
 * Connection Tests Runner
 *
 * Модуль для проверки соединений со всеми внешними сервисами.
 * Запуск: npm run test:connections
 */

import { logger } from '../../utils/logger';

import { testJiraConnection, type JiraConnectionTestResult } from './jira.test';
import { testJiraDataFetch, testJiraVersions, listJiraBoards, type JiraDataTestResult, type JiraVersionTestResult } from './jira-data.test';
import { testNotionConnection, type NotionConnectionTestResult } from './notion.test';
import { testOpenAIConnection, type OpenAIConnectionTestResult } from './openai.test';

// =============================================================================
// Types
// =============================================================================

export type ConnectionTestResult =
  | JiraConnectionTestResult
  | JiraDataTestResult
  | JiraVersionTestResult
  | NotionConnectionTestResult
  | OpenAIConnectionTestResult;

export interface ConnectionTestsReport {
  timestamp: string;
  results: ConnectionTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

// =============================================================================
// Console Output Helpers
// =============================================================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
} as const;

function printHeader(text: string): void {
  console.log();
  console.log(`${COLORS.bright}${COLORS.cyan}${'═'.repeat(60)}${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}  ${text}${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}${'═'.repeat(60)}${COLORS.reset}`);
  console.log();
}

function printServiceHeader(service: string): void {
  console.log(`${COLORS.bright}${COLORS.blue}▶ ${service}${COLORS.reset}`);
}

function printSuccess(message: string): void {
  console.log(`  ${COLORS.green}✓${COLORS.reset} ${message}`);
}

function printError(message: string): void {
  console.log(`  ${COLORS.red}✗${COLORS.reset} ${message}`);
}

function printDetail(label: string, value: string): void {
  console.log(`  ${COLORS.dim}${label}:${COLORS.reset} ${value}`);
}

function printSummary(passed: number, failed: number): void {
  console.log();
  console.log(`${COLORS.bright}${'─'.repeat(60)}${COLORS.reset}`);

  const total = passed + failed;
  const statusColor = failed === 0 ? COLORS.green : COLORS.red;
  const statusText = failed === 0 ? 'ВСЕ ТЕСТЫ ПРОЙДЕНЫ' : 'ЕСТЬ ОШИБКИ';

  console.log(
    `${COLORS.bright}Результат:${COLORS.reset} ${statusColor}${statusText}${COLORS.reset}`,
  );
  console.log(
    `${COLORS.bright}Всего:${COLORS.reset} ${total} | ` +
      `${COLORS.green}Успешно:${COLORS.reset} ${passed} | ` +
      `${COLORS.red}Ошибки:${COLORS.reset} ${failed}`,
  );
  console.log();
}

function printResult(result: ConnectionTestResult): void {
  printServiceHeader(result.service);

  if (result.success) {
    printSuccess(result.message);
  } else {
    printError(result.message);
    if (result.error) {
      printDetail('Причина', result.error);
    }
  }

  // Выводим детали
  if (result.details) {
    const details = result.details;

    if ('baseUrl' in details && details.baseUrl) {
      printDetail('URL', details.baseUrl);
    }
    if ('email' in details && details.email) {
      printDetail('Email', details.email);
    }
    if ('serverInfo' in details && details.serverInfo) {
      printDetail(
        'Сервер',
        `${details.serverInfo.version} (${details.serverInfo.deploymentType})`,
      );
    }
    if ('boardId' in details && details.boardId) {
      printDetail('Board ID', details.boardId);
    }
    if ('boardName' in details && details.boardName) {
      printDetail('Доска', details.boardName);
    }
    if ('lastClosedSprint' in details && details.lastClosedSprint) {
      const sprint = details.lastClosedSprint;
      console.log();
      console.log(`  ${COLORS.bright}✓ Прошлый спринт: ${sprint.name}${COLORS.reset} (ID: ${sprint.id}, задач: ${sprint.issuesCount})`);
      if (sprint.issues && sprint.issues.length > 0) {
        for (const issue of sprint.issues) {
          console.log(`    ${COLORS.dim}${issue.key}${COLORS.reset} [${issue.status}] ${issue.summary}`);
        }
      }
    }
    if ('activeSprint' in details && details.activeSprint) {
      const sprint = details.activeSprint;
      console.log();
      console.log(`  ${COLORS.bright}▶ Текущий спринт: ${sprint.name}${COLORS.reset} (ID: ${sprint.id}, задач: ${sprint.issuesCount})`);
      if (sprint.issues && sprint.issues.length > 0) {
        for (const issue of sprint.issues) {
          console.log(`    ${COLORS.dim}${issue.key}${COLORS.reset} [${issue.status}] ${issue.summary}`);
        }
      }
    }
    // Version details
    if ('projectKey' in details && details.projectKey) {
      printDetail('Проект', `${details.projectName ?? ''} (${details.projectKey})`);
    }
    if ('totalVersions' in details) {
      printDetail('Версии', `${details.totalVersions} всего (${details.releasedVersions ?? 0} выпущено, ${details.unreleasedVersions ?? 0} в работе)`);
    }
    if ('activeVersion' in details && details.activeVersion) {
      const version = details.activeVersion;
      console.log();
      console.log(`  ${COLORS.bright}🎯 Активная версия: ${version.name}${COLORS.reset}`);
      if (version.description) {
        console.log(`    ${COLORS.dim}Описание:${COLORS.reset} ${version.description}`);
      }
      if (version.releaseDate) {
        console.log(`    ${COLORS.dim}Дата релиза:${COLORS.reset} ${version.releaseDate}`);
      }
      console.log(`    ${COLORS.dim}Прогресс:${COLORS.reset} ${version.progressPercent}%`);
    }
    if ('allVersions' in details && details.allVersions && details.allVersions.length > 0) {
      console.log();
      console.log(`  ${COLORS.dim}Все версии:${COLORS.reset}`);
      for (const v of details.allVersions) {
        const status = v.released ? `${COLORS.green}✓${COLORS.reset}` : `${COLORS.yellow}○${COLORS.reset}`;
        const date = v.releaseDate ? ` (${v.releaseDate})` : '';
        console.log(`    ${status} ${v.name}${date}`);
      }
    }
    if ('parentPageId' in details && details.parentPageId) {
      printDetail('Parent Page ID', details.parentPageId);
    }
    if ('pageTitle' in details && details.pageTitle) {
      printDetail('Страница', details.pageTitle);
    }
    if ('workspaceName' in details && details.workspaceName) {
      printDetail('Workspace', details.workspaceName);
    }
    if ('model' in details && details.model) {
      printDetail('Модель', details.model);
    }
    if ('modelsAvailable' in details && details.modelsAvailable) {
      printDetail('Доступные модели', details.modelsAvailable.join(', '));
    }
  }

  console.log();
}

// =============================================================================
// Test Runners
// =============================================================================

/**
 * Запускает тест соединения для указанного сервиса.
 */
export async function runConnectionTest(
  service: 'jira' | 'jira-data' | 'jira-versions' | 'notion' | 'openai',
): Promise<ConnectionTestResult> {
  switch (service) {
    case 'jira':
      return testJiraConnection();
    case 'jira-data':
      return testJiraDataFetch();
    case 'jira-versions':
      return testJiraVersions();
    case 'notion':
      return testNotionConnection();
    case 'openai':
      return testOpenAIConnection();
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}

/**
 * Запускает все тесты соединений.
 */
export async function runAllConnectionTests(): Promise<ConnectionTestsReport> {
  const results: ConnectionTestResult[] = [];

  printHeader('ТЕСТЫ СОЕДИНЕНИЙ С ВНЕШНИМИ СЕРВИСАМИ');

  // Jira
  logger.debug('Running Jira connection test...');
  const jiraResult = await testJiraConnection();
  results.push(jiraResult);
  printResult(jiraResult);

  // Notion
  logger.debug('Running Notion connection test...');
  const notionResult = await testNotionConnection();
  results.push(notionResult);
  printResult(notionResult);

  // OpenAI
  logger.debug('Running OpenAI connection test...');
  const openaiResult = await testOpenAIConnection();
  results.push(openaiResult);
  printResult(openaiResult);

  // Summary
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  printSummary(passed, failed);

  return {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      passed,
      failed,
    },
  };
}

// =============================================================================
// CLI Entry Point
// =============================================================================

/**
 * Точка входа для запуска тестов из командной строки.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Специальная команда: список досок Jira
  if (args.includes('--jira-boards') || args.includes('--boards')) {
    await runJiraBoardsList();
    return;
  }

  // Определяем какие тесты запускать
  const services: Array<'jira' | 'jira-data' | 'jira-versions' | 'notion' | 'openai'> = [];

  if (args.includes('--jira') || args.includes('-j')) {
    services.push('jira');
  }
  if (args.includes('--jira-data') || args.includes('-jd')) {
    services.push('jira-data');
  }
  if (args.includes('--jira-versions') || args.includes('-jv')) {
    services.push('jira-versions');
  }
  if (args.includes('--notion') || args.includes('-n')) {
    services.push('notion');
  }
  if (args.includes('--openai') || args.includes('-o')) {
    services.push('openai');
  }

  // Если сервисы не указаны — запускаем все
  if (services.length === 0) {
    const report = await runAllConnectionTests();
    process.exit(report.summary.failed > 0 ? 1 : 0);
  }

  // Запускаем указанные тесты
  printHeader('ТЕСТЫ СОЕДИНЕНИЙ С ВНЕШНИМИ СЕРВИСАМИ');

  const results: ConnectionTestResult[] = [];

  for (const service of services) {
    const result = await runConnectionTest(service);
    results.push(result);
    printResult(result);
  }

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  printSummary(passed, failed);

  process.exit(failed > 0 ? 1 : 0);
}

/**
 * Выводит список всех досок Jira.
 */
async function runJiraBoardsList(): Promise<void> {
  printHeader('СПИСОК ДОСОК JIRA');

  const result = await listJiraBoards();

  if (!result.success) {
    printError(`Не удалось получить список досок: ${result.error}`);
    process.exit(1);
  }

  if (!result.boards || result.boards.length === 0) {
    console.log('  Доски не найдены');
    return;
  }

  console.log(`  Найдено досок: ${result.boards.length}\n`);
  console.log('  ID     | Тип      | Название');
  console.log('  ' + '─'.repeat(50));

  for (const board of result.boards) {
    const id = String(board.id).padEnd(6);
    const type = board.type.padEnd(8);
    console.log(`  ${id} | ${type} | ${board.name}`);
  }

  console.log();
}

// Запуск при прямом вызове
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Экспорты
export { testJiraConnection } from './jira.test';
export { testJiraDataFetch, testJiraVersions, listJiraBoards } from './jira-data.test';
export { testNotionConnection } from './notion.test';
export { testOpenAIConnection } from './openai.test';

