# EzReport Web Console

A terminal-style web client for the EzReport sprint-report workflow backend. The interface is organized into a **3-stage workflow** for step-by-step report generation and validation.

## Overview

This is a web client that interfaces with an external HTTP API for managing sprint report workflows. The application features a console/terminal aesthetic with a black background, green text, and monospace fonts.

## Tech Stack

- Next.js 13 with App Router
- TypeScript
- Tailwind CSS
- JetBrains Mono font
- No database, no authentication

## 3-Stage Workflow

The console is organized into three dedicated pages for different stages of the sprint report workflow:

### Data Collection & Validation (`/data`)

- Collects sprint data from Jira
- Validates data quality and completeness
- Shows sprint info, dates, goal
- Displays validation results: DATA_VALID, GOAL_MATCH level
- Lists errors and warnings

### Analysis & Generation (`/analyse`)

- Generates report in blocks (overview, achievements, blockers, etc.)
- For each block shows:
  - Prompt template (what we ask the model)
  - Input data preview (data used for generation)
  - Generated result
- "Go" button for triggering generation
- Visual progress through report blocks

### Final Report (`/report`)

- Displays the complete generated report
- Partner-ready Markdown format
- Copy to clipboard functionality
- Links to Notion page if created

### Home Page (`/`)

The home page is a simple navigation console that links to all three stages:

- Press `1` to go to Data
- Press `2` to go to Analyse
- Press `3` to go to Report

## Configuration

The application requires one environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

This should point to your EzReport workflow backend API.

## API Endpoints

The backend is expected to provide:

- `GET /api/workflow/ping` - Health check endpoint
- `POST /api/workflow/run-step` - Execute workflow steps
  - `step`: `"collect"` | `"generate"` | `"validate"` | `"full"`
  - `params`: Sprint parameters (sprintId, sprintName, boardId, mockMode, extra)

## Available Scripts

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Linting
npm run lint

# Type checking
npm run typecheck
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your API base URL
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── page.tsx              # Home navigation page
│   ├── layout.tsx            # Root layout with console theme
│   ├── globals.css           # Global styles
│   ├── data/
│   │   └── page.tsx          # Data Collection & Validation
│   ├── analyse/
│   │   └── page.tsx          # Analysis & Report Generation
│   └── report/
│       └── page.tsx          # Final Report View
├── components/
│   ├── Accordion.tsx         # Collapsible section component
│   ├── ControlPanel.tsx      # Legacy control panel (for reference)
│   ├── ResultsPanel.tsx      # Legacy results panel (for reference)
│   └── console/              # Reusable console UI components
│       ├── ConsolePanel.tsx
│       ├── ConsoleHeading.tsx
│       ├── ConsoleButton.tsx
│       ├── ConsoleInput.tsx
│       ├── ConsoleCheckbox.tsx
│       ├── BackendStatus.tsx
│       ├── WorkflowParams.tsx
│       └── index.ts
├── lib/
│   ├── apiClient.ts          # API communication layer
│   ├── blocksConfig.ts       # Report blocks configuration for Stage 2
│   └── utils.ts              # Utility functions
└── types/
    └── workflow.ts           # TypeScript type definitions
```

## Console UI Components

The project includes reusable console-style components:

- `ConsolePanel` - Bordered container with green glow
- `ConsoleHeading` - Styled headings (h1, h2, h3)
- `ConsoleButton` - Terminal-style buttons
- `ConsoleInput` - Text inputs and textareas
- `ConsoleCheckbox` - Checkbox with label
- `BackendStatus` - Real-time backend health indicator

## Report Blocks (Analyse)

The report is divided into the following blocks:

1. **version** - Report format version
2. **sprint** - Sprint name and dates
3. **overview** - Sprint overview (5-10 sentences)
4. **notDone** - Tasks not completed
5. **achievements** - Key achievements
6. **artifacts** - Links to docs, releases, demos
7. **nextSprint** - Plans for next sprint
8. **blockers** - Issues and blockers
9. **pmQuestions** - Questions for PM

Each block can be viewed with its prompt template and input data preview.

## Deployment

This project can be deployed as a standalone Next.js application or integrated into a monorepo structure.

When deploying, update `NEXT_PUBLIC_API_BASE_URL` to point to your backend service.

## License

Private project for EzReport workflow management.
