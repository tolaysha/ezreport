# Project Context: EzReport — Sprint Report Automation

## 1. High-level Project Description

This repo contains a Node.js + TypeScript monorepo with three main packages:

1. **CLI (`packages/cli`)** — Command-line tool and HTTP server for sprint report generation
2. **Web Console (`packages/web`)** — Terminal-style Next.js web interface
3. **Shared (`packages/shared`)** — Shared TypeScript types

The tool helps product/engineering teams generate clear, partner-ready sprint reports in Notion using data from Jira and AI-generated text, without manual copy-paste work.

## 2. What the Backend Does

The backend (`packages/cli`):
- Fetches sprint issues from Jira (by board ID)
- Aggregates and normalizes them into internal domain types (`SprintIssue`, `SprintCardData`)
- Runs AI-powered strategic analysis (goal alignment, demo recommendations)
- Generates partner-ready markdown reports
- Optionally creates a Notion page with the report

There is a **MOCK mode**:
- When `MOCK_MODE=true`, the tool uses fake Jira issues, fake AI text
- This allows development and testing without real API calls

## 3. Domain Types

The main domain types are defined in `@ezreport/shared`:

- `SprintMeta` — Sprint metadata (id, name, dates, goal, state)
- `SprintIssue` — Normalized Jira issue (key, summary, status, storyPoints, artifact)
- `SprintCardData` — Sprint + issues + goal match assessment
- `BasicBoardSprintData` — Board data with previous and current sprints
- `VersionMeta` — Product version info (name, releaseDate, progress)
- `StrategicAnalysis` — AI analysis result (alignments, scores, demo recommendations)

## 4. Current Goals for This Tool

- Make sprint reporting fast and consistent
- Provide partner-facing, human-readable summaries in Russian
- Keep integration details (Jira, OpenAI) decoupled from the reporting logic

## 5. Report Template

The generated report follows a specific template in Russian:
1. **Версия** — Version info (number, deadline, goal, progress %)
2. **Спринт** — Sprint info (number, dates, goal, progress %)
3. **Overview спринта** — 2-3 paragraphs summary
4. **Ключевые достижения** — Key achievements
5. **Не реализовано** — What was not done and why
6. **Артефакты** — Demo links, artifacts
7. **Планирование следующего спринта** — Next sprint planning
8. **Блокеры** — Blockers if any
9. **Вопросы от PM** — PM questions/proposals

## 6. Backend Architecture

### REST API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/ping` | Health check |
| `POST /api/collect-data` | Collect sprint data from Jira (no AI) |
| `POST /api/analyze-data` | AI analysis of provided data |
| `POST /api/analyze` | Collect + AI analysis |
| `POST /api/generate-report` | Full cycle: collect → analyze → report |

### Data Flow

```
1. /api/collect-data
   Jira API → collectBasicBoardSprintData() → BasicBoardSprintData

2. /api/analyze-data  
   BasicBoardSprintData → strategicAnalyzer (OpenAI) → StrategicAnalysis

3. /api/generate-report
   BasicBoardSprintData + StrategicAnalysis → partnerReport (OpenAI) → Markdown
```

### Module Structure

```
packages/cli/src/
├── server.ts          # HTTP server (Express)
├── index.ts           # CLI entry point
├── config.ts          # Environment configuration
├── services/
│   ├── collectBasicBoardSprintData.ts  # Jira data collection
│   ├── partnerReport.ts                # Report generation
│   ├── sprintReport.ts                 # CLI-only workflow
│   └── demoSelector.ts                 # Demo issue selection
├── ai/
│   ├── strategicAnalyzer.ts   # AI analysis
│   ├── openaiClient.ts        # OpenAI wrapper
│   └── prompts/               # Prompt templates
├── jira/
│   ├── boardFetcher.ts        # Board/sprint fetching
│   ├── client.ts              # Jira HTTP client
│   └── types.ts               # Jira API types
├── notion/
│   ├── client.ts              # Notion API client
│   └── builder.ts             # Page builder
└── mocks/
    └── sprintMocks.ts         # Mock data generators
```

## 7. Web Console (`packages/web`)

A terminal-style Next.js web interface for the sprint report workflow.

### Pages

| Page | Description |
|------|-------------|
| `/` | Home navigation |
| `/data` | Data collection + AI analysis |
| `/analyse` | Report generation preview |
| `/report` | Final report display |

### Key Components

- `ConsolePanel`, `ConsoleHeading`, etc. — Terminal-style UI primitives
- `SprintCard`, `VersionCard` — Sprint/version data display
- `AnalysisPanel` — AI analysis results display

### API Client

Located in `lib/apiClient.ts`:
- `ping()` — Health check
- `collectData()` — Fetch sprint data
- `analyzeData()` — Run AI analysis
- `generateReport()` — Generate full report

## 8. Practices for Using AI in This Repo

When using AI (Cursor / LLMs) to modify this repo:

- **Always respect the domain types** from `@ezreport/shared`
- **Keep business logic separate** from HTTP/integration logic
- **Do not spread raw API response shapes** across the code
- Map external APIs to domain types in a single place
- Prefer small, focused modules with explicit logging
- **Type safety**: Use conversion functions (`toSprintMeta`, `toSprintIssue`) at integration boundaries

## 9. Project Structure

```
ezreport/
├── packages/
│   ├── cli/                    # CLI tool + HTTP server
│   │   ├── src/
│   │   │   ├── index.ts        # CLI entry point
│   │   │   ├── server.ts       # HTTP server
│   │   │   ├── config.ts       # Configuration
│   │   │   ├── services/       # Business logic
│   │   │   ├── ai/             # OpenAI integration
│   │   │   ├── jira/           # Jira integration
│   │   │   ├── notion/         # Notion integration
│   │   │   └── mocks/          # Test data
│   │   └── package.json
│   │
│   ├── shared/                 # Shared types
│   │   ├── src/types/          # Type definitions
│   │   └── package.json
│   │
│   └── web/                    # Web console (Next.js)
│       ├── app/                # Next.js pages
│       ├── components/         # UI components
│       ├── lib/                # API client, utils
│       └── package.json
│
└── docs/
    ├── project-context.md      # This file
    └── api-contracts.md        # API documentation
```

## 10. Running the Project

### Backend (HTTP Server)

```bash
cd packages/cli
npm run server       # Real APIs
npm run server:mock  # Mock mode (no real API calls)
```

### Web Console

```bash
cd packages/web
npm run dev          # Development server on port 3000
```

### CLI

```bash
cd packages/cli
npm run sprint-report -- --sprint="Sprint 5"
npm run sprint-report -- --sprint="Sprint 5" --dry-run
npm run sprint-report:test  # E2E test mode
```
