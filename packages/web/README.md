# EzReport Web Console

A terminal-style web client for the EzReport sprint report backend. The interface provides a visual way to collect sprint data, run AI analysis, and generate partner-ready reports.

## Overview

This is a web client that interfaces with the EzReport HTTP API. The application features a console/terminal aesthetic with a black background, green text, and monospace fonts.

## Tech Stack

- Next.js 13 with App Router
- TypeScript
- Tailwind CSS
- JetBrains Mono font
- No database, no authentication

## Pages

### Data Collection (`/data`)

- Terminal-style interface with command input
- Collects sprint data from Jira via `start <board_id>` command
- Displays version, previous and current sprint cards
- Runs AI strategic analysis via `analyze` command
- Shows alignment scores and demo recommendations

### Analysis & Generation (`/analyse`)

- Generates full markdown report
- Shows report structure preview
- Displays generated sections (overview, achievements, etc.)

### Final Report (`/report`)

- Displays the complete generated report
- Partner-ready Markdown format
- Copy to clipboard functionality

### Home Page (`/`)

Simple navigation console:
- Press `1` to go to Data
- Press `2` to go to Analyse
- Press `3` to go to Report

## Configuration

The application requires one environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

This should point to your EzReport backend API.

## API Endpoints

The backend provides:

| Endpoint | Description |
|----------|-------------|
| `GET /api/ping` | Health check |
| `POST /api/collect-data` | Collect sprint data from Jira |
| `POST /api/analyze-data` | AI analysis of provided data |
| `POST /api/analyze` | Collect + AI analysis |
| `POST /api/generate-report` | Full report generation |

See `docs/api-contracts.md` for detailed API documentation.

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
│   │   └── page.tsx          # Data Collection & Analysis
│   ├── analyse/
│   │   └── page.tsx          # Report Generation
│   └── report/
│       └── page.tsx          # Final Report View
├── components/
│   ├── console/              # Console UI primitives
│   │   ├── ConsolePanel.tsx
│   │   ├── ConsoleHeading.tsx
│   │   ├── ConsoleButton.tsx
│   │   ├── ConsoleInput.tsx
│   │   ├── ConsoleCheckbox.tsx
│   │   ├── BackendStatus.tsx
│   │   ├── Breadcrumb.tsx
│   │   └── index.ts
│   ├── sprint/               # Sprint display components
│   │   ├── SprintCard.tsx
│   │   ├── VersionCard.tsx
│   │   ├── AnalysisPanel.tsx
│   │   └── index.ts
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── apiClient.ts          # API communication layer
│   └── utils.ts              # Utility functions
└── types/
    └── workflow.ts           # TypeScript types (re-exports from @ezreport/shared)
```

## Console UI Components

Reusable console-style components:

- `ConsolePanel` - Bordered container with green glow
- `ConsoleHeading` - Styled headings (h1, h2, h3)
- `ConsoleButton` - Terminal-style buttons
- `ConsoleInput` - Text inputs and textareas
- `ConsoleCheckbox` - Checkbox with label
- `BackendStatus` - Real-time backend health indicator
- `Breadcrumb` - Navigation breadcrumb

## Sprint Components

- `SprintCard` - Displays sprint info with issues
- `VersionCard` - Shows product version info
- `AnalysisPanel` - AI analysis results with alignments

## Deployment

This project can be deployed as a standalone Next.js application.

When deploying, update `NEXT_PUBLIC_API_BASE_URL` to point to your backend service.

## License

Private project for EzReport.
