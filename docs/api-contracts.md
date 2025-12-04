# API Contracts: Web Console ↔ Backend

Документация по REST API, которое веб-консоль вызывает на бэкенде.

**Base URL:** `http://localhost:4000`

---

## Endpoints

### 1. Health Check

Проверка доступности бэкенда.

```
GET /api/workflow/ping
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-04T07:33:53.321Z"
}
```

**Статус коды:**
- `200` — бэкенд доступен
- Нет ответа — бэкенд недоступен

---

### 2. Run Workflow Step

Выполнение шага воркфлоу генерации отчёта.

```
POST /api/workflow/run-step
Content-Type: application/json
```

**Request Body:**
```typescript
{
  step: WorkflowStep;
  params: SprintReportWorkflowParams;
}
```

**Response:**
```typescript
{
  step: WorkflowStep;
  params: SprintReportWorkflowParams;
  result: SprintReportWorkflowResult | null;
  logs?: string[];
  error?: string;  // только при ошибке
}
```

**Статус коды:**
- `200` — успешное выполнение (даже если result содержит ошибки валидации)
- `400` — неверные параметры запроса
- `500` — внутренняя ошибка сервера

---

## Types

### WorkflowStep

```typescript
type WorkflowStep = "collect" | "generate" | "validate" | "full";
```

| Step       | Описание                                           |
|------------|---------------------------------------------------|
| `collect`  | Сбор данных из Jira + валидация данных            |
| `generate` | Генерация блоков отчёта через AI                  |
| `validate` | Финальная валидация отчёта                        |
| `full`     | Полный воркфлоу (collect → generate → validate)   |

---

### SprintReportWorkflowParams

Параметры для запуска воркфлоу.

```typescript
interface SprintReportWorkflowParams {
  sprintId?: string;      // ID спринта в Jira
  sprintName?: string;    // Название спринта
  boardId?: string;       // ID доски в Jira
  mockMode?: boolean;     // Использовать тестовые данные
  extra?: Record<string, unknown>;  // Дополнительные параметры
}
```

**Примечания:**
- Достаточно указать один из: `sprintId`, `sprintName`, или `boardId`
- `mockMode: true` — бэкенд использует фейковые данные без реальных API-вызовов
- `extra` — передаётся как `versionMeta` в CLI (информация о версии продукта)

---

### SprintReportWorkflowResult

Результат выполнения шага воркфлоу.

```typescript
interface SprintReportWorkflowResult {
  sprint?: SprintInfo;
  dataValidation?: SprintDataValidationResult | null;
  report?: SprintReportStructured | null;
  reportValidation?: SprintReportValidationResult | null;
  notionPage?: NotionPageResult | null;
}
```

---

### SprintInfo

Информация о спринте.

```typescript
interface SprintInfo {
  id?: string;
  name?: string;
  goal?: string;
  startDate?: string;   // Формат: "17 ноября 2025"
  endDate?: string;
}
```

---

### SprintDataValidationResult

Результат валидации данных (Step 1).

```typescript
interface SprintDataValidationResult {
  isValid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  goalIssueMatchLevel?: "strong" | "medium" | "weak";
  goalIssueMatchComment?: string;
}
```

---

### SprintReportStructured

Сгенерированный отчёт (Step 2). Все поля — строки с отформатированным текстом.

```typescript
interface SprintReportStructured {
  version?: string;      // "v1 (29 Марта 2026) - Запуск MVP..."
  sprint?: string;       // "Спринт 4 (17 ноября - 28 ноября)\nЦель: ...\nПрогресс: 55%"
  overview?: string;     // Обзор спринта (5-10 предложений)
  notDone?: string;      // Список незавершённых задач
  achievements?: string; // Ключевые достижения
  artifacts?: string;    // Артефакты (ссылки на демо, документы)
  nextSprint?: string;   // Планы на следующий спринт
  blockers?: string;     // Блокеры или "Блокеров не выявлено"
  pmQuestions?: string;  // Вопросы к PM или "Вопросов нет"
}
```

---

### SprintReportValidationResult

Результат валидации отчёта (Step 3).

```typescript
interface SprintReportValidationResult {
  isValid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  partnerReadiness?: PartnerReadiness;
}
```

---

### PartnerReadiness

Оценка готовности отчёта для партнёров (AI-проверка).

```typescript
interface PartnerReadiness {
  isPartnerReady?: boolean;
  comments?: string[];
}
```

---

### ValidationMessage

Сообщение об ошибке или предупреждении.

```typescript
interface ValidationMessage {
  code?: string;     // Код ошибки (например, "SPRINT_NAME_MISSING")
  message: string;   // Человекочитаемое описание
  details?: string;  // Дополнительные детали (JSON-строка)
}
```

---

### NotionPageResult

Результат создания страницы в Notion.

```typescript
interface NotionPageResult {
  id?: string;   // ID страницы в Notion
  url?: string;  // URL страницы
}
```

---

## Примеры запросов

### Сбор данных (Stage 1)

```bash
curl -X POST http://localhost:4000/api/workflow/run-step \
  -H "Content-Type: application/json" \
  -d '{
    "step": "collect",
    "params": {
      "boardId": "toys",
      "mockMode": true
    }
  }'
```

### Генерация отчёта (Stage 2)

```bash
curl -X POST http://localhost:4000/api/workflow/run-step \
  -H "Content-Type: application/json" \
  -d '{
    "step": "generate",
    "params": {
      "boardId": "toys",
      "mockMode": true
    }
  }'
```

### Полный воркфлоу (Stage 3)

```bash
curl -X POST http://localhost:4000/api/workflow/run-step \
  -H "Content-Type: application/json" \
  -d '{
    "step": "full",
    "params": {
      "boardId": "toys",
      "mockMode": true
    }
  }'
```

---

## Логика выполнения шагов

### `collect`
1. Получает данные из Jira (или mock)
2. Валидирует данные
3. Возвращает `sprint` + `dataValidation`

### `generate`
1. Если нет данных — сначала выполняет `collect`
2. Генерирует блоки отчёта через AI
3. Возвращает `sprint` + `dataValidation` + `report`

### `validate`
1. Если нет отчёта — сначала выполняет `generate`
2. Валидирует структуру отчёта
3. Проверяет готовность для партнёров (AI)
4. Возвращает полный результат с `reportValidation`

### `full`
1. Выполняет весь воркфлоу: collect → generate → validate
2. Останавливается при критических ошибках валидации
3. Возвращает полный результат

---

## Состояние на сервере

Сервер хранит промежуточное состояние в памяти:
- `lastCollectedData` — последние собранные данные
- `lastDataValidation` — результат валидации данных
- `lastReport` — сгенерированный отчёт

Это позволяет:
- Вызывать `generate` без повторного `collect`
- Вызывать `validate` без повторной генерации

**Важно:** Состояние сбрасывается при перезапуске сервера.

---

## Коды ошибок валидации данных

| Код | Описание |
|-----|----------|
| `SPRINT_NAME_MISSING` | Название спринта отсутствует |
| `SPRINT_DATES_MISSING` | Даты спринта не указаны |
| `SPRINT_GOAL_MISSING` | Цель спринта не указана |
| `SPRINT_GOAL_TOO_SHORT` | Цель спринта слишком короткая |
| `ISSUE_KEY_MISSING` | Задача без ключа |
| `ISSUE_SUMMARY_MISSING` | Задача без названия |
| `ISSUE_STATUS_MISSING` | Задача без статуса |
| `GOAL_ISSUE_MATCH_WEAK` | Слабое соответствие задач цели |
| `NO_DONE_ISSUES` | Нет выполненных задач |
| `NO_STORY_POINTS` | Задачи без story points |

## Коды ошибок валидации отчёта

| Код | Описание |
|-----|----------|
| `SECTION_MISSING` | Раздел отчёта отсутствует |
| `SECTION_EMPTY` | Раздел отчёта пустой |
| `WRONG_LANGUAGE` | Текст не на русском языке |
| `PLACEHOLDER_DETECTED` | Обнаружен placeholder в тексте |
| `SPRINT_NUMBER_MISMATCH` | Номер спринта не совпадает |
| `PROGRESS_OUT_OF_RANGE` | Прогресс вне диапазона 0-100 |
| `NOT_PARTNER_READY` | Отчёт не готов для партнёров |

