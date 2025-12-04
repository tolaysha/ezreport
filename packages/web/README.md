# EzReport Web Console

A simple terminal-style dashboard to control the EzReport sprint-report workflow backend.

## Overview

This is a web client that interfaces with an external HTTP API for managing sprint report workflows. The application features a console/terminal aesthetic with a black background, green text, and monospace fonts.

## Tech Stack

- Next.js 13 with App Router
- TypeScript
- Tailwind CSS
- No database, no authentication

## Features

- **Control Panel**: Input sprint parameters and trigger workflow steps
- **Backend Status Monitoring**: Real-time backend health check
- **Results Display**: Organized display of workflow results in three sections:
  - Step 1: Data & Validation
  - Step 2: Generated Report
  - Step 3: Final Validation
- **Raw JSON View**: Toggle view of complete API responses

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

## Workflow Steps

The console supports four workflow operations:

1. **Run full workflow** - Executes all steps in sequence
2. **Run step 1: Collect & Validate Data** - Collects sprint data and validates it
3. **Run step 2: Generate Report** - Generates the sprint report
4. **Run step 3: Validate Report** - Validates the generated report

## Project Structure

```
├── app/
│   ├── page.tsx          # Main dashboard page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── Accordion.tsx     # Collapsible section component
│   ├── ControlPanel.tsx  # Input controls and workflow buttons
│   └── ResultsPanel.tsx  # Results display with sections
├── lib/
│   └── apiClient.ts      # API communication layer
└── types/
    └── workflow.ts       # TypeScript type definitions
```

## Deployment

This project can be deployed as a standalone Next.js application or integrated into a monorepo structure (e.g., under `apps/web`).

When moving to a monorepo, simply update `NEXT_PUBLIC_API_BASE_URL` to point to your backend service.

## License

Private project for EzReport workflow management.
