# API Contracts: Web Console ↔ Backend

Документация по REST API, которое веб-консоль вызывает на бэкенде.

**Base URL:** `http://localhost:4000`

---

## Endpoints

### 1. Health Check

Проверка доступности бэкенда.

```
GET /api/ping
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

### 2. Collect Data

Сбор данных о спринтах с Jira (без AI-вызовов).

```
POST /api/collect-data
Content-Type: application/json
```

**Request Body:**
```typescript
interface SprintReportParams {
  boardId: string;       // ID доски в Jira (обязательный)
  mockMode?: boolean;    // Использовать тестовые данные
}
```

**Response:**
```typescript
interface CollectDataResponse {
  sprint?: {
    id: number;
    name: string;
    goal?: string;
    startDate?: string;
    endDate?: string;
  };
  basicBoardData: BasicBoardSprintData;
  dataValidation: null;
  logs: string[];
}
```

**Статус коды:**
- `200` — успешный сбор данных
- `400` — boardId не указан
- `500` — ошибка при сборе данных

---

### 3. Analyze Data

AI-анализ предоставленных данных (без обращения к Jira).

```
POST /api/analyze-data
Content-Type: application/json
```

**Request Body:**
```typescript
interface AnalyzeDataParams {
  activeVersion?: VersionMeta;
  currentSprint: SprintCardData;       // Обязательный
  previousSprint?: SprintCardData;
  mockMode?: boolean;
}
```

**Response:**
```typescript
interface AnalyzeResponse {
  analysis: StrategicAnalysis | null;
  logs: string[];
}
```

**Статус коды:**
- `200` — успешный анализ
- `400` — currentSprint не указан
- `500` — ошибка при анализе

---

### 4. Analyze

Сбор данных + AI-анализ (комбинация collect-data и analyze-data).

```
POST /api/analyze
Content-Type: application/json
```

**Request Body:**
```typescript
interface SprintReportParams {
  boardId: string;       // ID доски в Jira (обязательный)
  mockMode?: boolean;    // Использовать тестовые данные
}
```

**Response:**
```typescript
interface AnalyzeResponse {
  analysis: StrategicAnalysis | null;
  logs: string[];
}
```

**Статус коды:**
- `200` — успешный анализ
- `400` — boardId не указан или нет текущего спринта
- `500` — ошибка при анализе

---

### 5. Generate Report

Полный цикл генерации отчёта: сбор данных → AI-анализ → markdown-отчёт.

```
POST /api/generate-report
Content-Type: application/json
```

**Request Body:**
```typescript
interface SprintReportParams {
  boardId: string;       // ID доски в Jira (обязательный)
  mockMode?: boolean;    // Использовать тестовые данные
}
```

**Response:**
```typescript
interface GenerateReportResponse {
  sprint: {
    id: string;
    name: string;
    goal?: string;
    startDate?: string;
    endDate?: string;
  };
  reportMarkdown: string;
  logs: string[];
}
```

**Статус коды:**
- `200` — отчёт успешно сгенерирован
- `400` — boardId не указан или нет текущего спринта
- `500` — ошибка при генерации

---

## Types

### BasicBoardSprintData

Данные о доске и спринтах.

```typescript
interface BasicBoardSprintData {
  boardId: string;
  projectKey?: string;
  projectName?: string;
  activeVersion?: VersionMeta;
  previousSprint?: SprintCardData;
  currentSprint?: SprintCardData;
  availability: {
    hasPreviousSprint: boolean;
    hasCurrentSprint: boolean;
  };
}
```

---

### SprintCardData

Данные спринта с задачами.

```typescript
interface SprintCardData {
  sprint: SprintMeta;
  issues: SprintIssue[];
  goalMatchLevel: GoalMatchLevel;
  goalMatchComment: string;
  recommendedArtifactIssues: SprintIssue[];
}
```

---

### SprintMeta

Метаданные спринта.

```typescript
interface SprintMeta {
  id: number;
  name: string;
  state: 'active' | 'closed' | 'future';
  startDate?: string;
  endDate?: string;
  goal?: string;
}
```

---

### SprintIssue

Задача спринта.

```typescript
interface SprintIssue {
  key: string;
  summary: string;
  status: string;
  statusCategory: 'new' | 'indeterminate' | 'done';
  storyPoints?: number;
  assignee?: string;
  artifact?: string;
}
```

---

### VersionMeta

Информация о версии продукта.

```typescript
interface VersionMeta {
  id: string;
  name: string;
  description?: string;
  releaseDate?: string;
  released: boolean;
  progressPercent?: number;
}
```

---

### StrategicAnalysis

Результат AI-анализа.

```typescript
interface StrategicAnalysis {
  versionSprintAlignment: {
    level: 'aligned' | 'partial' | 'misaligned' | 'unknown';
    comment: string;
    recommendations?: string[];
  };
  sprintTasksAlignment: {
    level: 'aligned' | 'partial' | 'misaligned' | 'unknown';
    comment: string;
    directlyRelatedPercent?: number;
    unrelatedTasks?: string[];
  };
  overallScore: number;
  summary: string;
  demoRecommendations?: DemoRecommendation[];
}
```

---

### GoalMatchLevel

Уровень соответствия задач цели спринта.

```typescript
type GoalMatchLevel = 'strong' | 'medium' | 'weak' | 'unknown';
```

---

## Примеры запросов

### Сбор данных

```bash
curl -X POST http://localhost:4000/api/collect-data \
  -H "Content-Type: application/json" \
  -d '{
    "boardId": "133",
    "mockMode": true
  }'
```

### AI-анализ собранных данных

```bash
curl -X POST http://localhost:4000/api/analyze-data \
  -H "Content-Type: application/json" \
  -d '{
    "currentSprint": { ... },
    "mockMode": false
  }'
```

### Полная генерация отчёта

```bash
curl -X POST http://localhost:4000/api/generate-report \
  -H "Content-Type: application/json" \
  -d '{
    "boardId": "133"
  }'
```

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                      HTTP Server                            │
│                      (server.ts)                            │
│                                                             │
│  GET  /api/ping           → Health check                    │
│  POST /api/collect-data   → collectBasicBoardSprintData()  │
│  POST /api/analyze-data   → performStrategicAnalysis()     │
│  POST /api/analyze        → collect + analyze              │
│  POST /api/generate-report→ collect + analyze + report     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Services Layer                            │
│                                                             │
│  collectBasicBoardSprintData.ts  - Jira data collection    │
│  strategicAnalyzer.ts            - AI analysis             │
│  partnerReport.ts                - Report generation       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│               Integration Adapters                          │
│                                                             │
│  jira/      → Jira REST API                                │
│  ai/        → OpenAI API                                   │
│  mocks/     → Mock data for testing                        │
└─────────────────────────────────────────────────────────────┘
```
