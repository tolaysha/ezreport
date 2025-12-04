# Project Context: EzReport — Sprint Report Automation

## 1. High-level Project Description

This repo contains a Node.js + TypeScript monorepo with two main packages:

1. **CLI (`packages/cli`)** — Command-line tool and HTTP server for sprint report generation
2. **Web Console (`packages/web`)** — Terminal-style Next.js web interface for the workflow

The tool helps product/engineering teams generate clear, partner-ready sprint reports in Notion using data from Jira and AI-generated text, without manual copy-paste work.

## 2. What the CLI Does

The CLI:
- fetches sprint issues from Jira (by sprint name or ID),
- aggregates and normalizes them into internal domain types (`SprintIssue`),
- selects 2–3 demo issues that are good for showcasing to partners (Done, have artifacts, high impact),
- calls an AI model (OpenAI) to generate structured text sections:
  - Sprint summary
  - What was done
  - What was not done and why
  - Demo section with highlights
- creates a Notion page with separate sections/blocks based on this data.

There is also a MOCK mode:
- when `MOCK_MODE=true`, the tool uses fake Jira issues, fake AI text, and simulates Notion page creation.
- this allows us to develop and test the pipeline without real API calls.

## 3. Domain Types

The main domain types in the codebase are:

- `SprintIssue` — normalized representation of a Jira issue for sprint reporting:
  - `key`, `summary`, `status`, `statusCategory`, `storyPoints`, `assignee`, `artifact`.
- `SprintReportStructured` — the structured result of AI generation:
  - `version`, `sprint`, `overview`, `notDone`, `achievements`, `artifacts`, `nextSprint`, `blockers`, `pmQuestions`.
- `NotionPageResult` — the result of creating a Notion page:
  - `id`, `url`.

The pipeline operates only on these domain types. Integration details with Jira/Notion/OpenAI are hidden behind adapters that map raw API responses to these types.

## 4. Current Goals for This Tool

- Make sprint reporting fast and consistent.
- Provide partner-facing, human-readable summaries in Russian without manual copy-paste.
- Keep integration details (Jira, Notion, OpenAI) decoupled from the reporting logic, so we can:
  - change field mappings,
  - adjust prompts and AI behavior,
  - or swap tools, without rewriting the pipeline.

## 5. Report Template

The generated Notion page follows a specific template in Russian:
1. **Версия** — Version info callout (number, deadline, goal, progress %)
2. **Спринт** — Sprint info callout (number, dates, goal, progress %)
3. **Отчет по итогам реализованного спринта**
   - Overview спринта (5-10 sentences)
   - Не реализовано в прошедшем спринте
   - Ключевые достижения, выводы и инсайты спринта
4. **Артефакты по итогам реализованного спринта**
5. **Планирование следующего спринта** (+ blockers)
6. **Вопросы и предложения от Product Manager**

## 6. Practices for Using AI in This Repo

When using AI (Cursor / LLMs) to modify this repo:

- **Always respect the domain types:**
  - Keep `SprintIssue`, `SprintReportStructured`, and `NotionPageResult` as central abstractions.
  - Map external APIs into these types in a single place (Jira client, OpenAI client, Notion client).
- **Do not spread raw Jira/Notion/OpenAI response shapes across the code.**
- **Keep business logic (selection of demo issues, report structure) separate from HTTP/integration logic.**
- If you change report structure or prompts, update this doc and the typing accordingly.
- Prefer small, focused modules and explicit logging for the pipeline steps.
- **Type safety**: Functions like `toSprintIssue()` convert raw API types (e.g., `ParsedJiraIssue`) to domain types (`SprintIssue`). Never call conversion functions on already-converted domain objects.

This document is the single source of truth for the project context and should be kept up to date when the overall purpose or architecture of the tool changes.

## 7. Workflow for AI-powered Sprint Report Generation

The sprint report generation follows a three-stage workflow implemented in `src/services/sprintReportWorkflow.ts`:

1. **Data Collection & Validation** — Fetches sprint data from Jira, converts to domain types (`SprintInfo`, `SprintIssue`), validates required fields, and uses AI to assess how well the sprint issues match the declared sprint goal (`goalIssueMatchLevel`).

2. **Block-by-block Report Generation** — Each section of `SprintReportStructured` is generated via a separate AI prompt. Prompt builders are located in `src/ai/prompts/sprintReportPrompts.ts`. This allows fine-grained control over each report block (version, sprint, overview, notDone, achievements, artifacts, nextSprint, blockers, pmQuestions).

3. **Final Report Validation** — Checks structure completeness, Russian language presence, placeholder detection, data consistency (sprint numbers, dates, progress), and uses AI for partner-readiness assessment.

The workflow is orchestrated by `runSprintReportWorkflow()` which stops early if validation fails at any stage. The CLI defaults to this workflow; use `--legacy` flag for the old single-prompt pipeline.

## 8. Web Console (`packages/web`)

A terminal-style Next.js web interface that provides a visual way to run the sprint report workflow. Features a black background, green text, and monospace font aesthetic.

### Architecture

- **Frontend:** Next.js 13 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Express HTTP server in `packages/cli/src/server.ts` wrapping the workflow logic
- **Communication:** REST API calls to `http://localhost:4000`

### 3-Stage Workflow UI

The web console is organized into three dedicated pages:

1. **Stage 1 (`/stage-1`)** — Data Collection & Validation
   - Input: Board ID only (sprint info auto-detected)
   - Shows: Sprint info, DATA_VALID status, GOAL_MATCH level, errors/warnings

2. **Stage 2 (`/stage-2`)** — Block-by-Block Generation
   - Displays each report block (overview, achievements, blockers, etc.)
   - For each block shows: prompt template, input data preview, generated result
   - "Go" button triggers generation

3. **Stage 3 (`/stage-3`)** — Final Validation
   - REPORT_VALID status, partner readiness check
   - Validation errors and warnings
   - Link to Notion page if created

### API Endpoints

The HTTP server (`packages/cli/src/server.ts`) exposes:

- `GET /api/workflow/ping` — Health check
- `POST /api/workflow/run-step` — Execute workflow step
  - `step`: `"collect"` | `"generate"` | `"validate"` | `"full"`
  - `params`: `{ boardId?, sprintId?, sprintName?, mockMode?, extra? }`

### Running the Web Console

```bash
# Terminal 1: Start the backend (port 4000)
cd packages/cli
npm run server:mock   # With mock data
npm run server        # With real APIs

# Terminal 2: Start the frontend (port 3000)
cd packages/web
npm run dev
```

### Shared Types

Web types are defined in `packages/web/types/workflow.ts` and mirror the CLI domain types with slight adaptations for the REST API. The server converts between CLI and web type formats.

## 9. Project Structure

```
ezreport/
├── packages/
│   ├── cli/                    # CLI tool + HTTP server
│   │   ├── src/
│   │   │   ├── index.ts        # CLI entry point
│   │   │   ├── server.ts       # HTTP server for web console
│   │   │   ├── services/
│   │   │   │   ├── sprintReportWorkflow.ts  # Main workflow
│   │   │   │   └── workflowTypes.ts         # Domain types
│   │   │   ├── ai/             # OpenAI integration
│   │   │   ├── jira/           # Jira integration
│   │   │   └── notion/         # Notion integration
│   │   └── package.json
│   │
│   └── web/                    # Web console (Next.js)
│       ├── app/
│       │   ├── page.tsx        # Home navigation
│       │   ├── stage-1/        # Data collection page
│       │   ├── stage-2/        # Block generation page
│       │   └── stage-3/        # Validation page
│       ├── components/
│       │   └── console/        # Reusable console UI components
│       ├── lib/
│       │   ├── apiClient.ts    # HTTP client for backend
│       │   └── blocksConfig.ts # Report blocks configuration
│       ├── types/
│       │   └── workflow.ts     # Web API types
│       └── package.json
│
└── docs/
    └── project-context.md      # This file
```
