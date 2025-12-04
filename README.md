# EzReport

A **monorepo** for sprint report automation:
- **CLI** — Generate sprint reports in Notion from Jira data using AI
- **Web Console** — Dashboard to control the sprint-report workflow

## Features

- 🔄 **Jira Integration** — Fetch sprint issues automatically
- 🤖 **AI-Powered** — Generate professional reports using OpenAI
- 📝 **Notion Export** — Create beautiful formatted pages
- 🇷🇺 **Russian Business Language** — No technical jargon
- 🌐 **Web Dashboard** — Visual control panel for the workflow
- 🧪 **Mock Mode** — Test without API credentials

## Monorepo Structure

```
ezreport/
├── packages/
│   ├── cli/                 # CLI tool (@ezreport/cli)
│   │   ├── src/
│   │   │   ├── index.ts     # CLI entry point
│   │   │   ├── config.ts    # Environment config
│   │   │   ├── ai/          # OpenAI integration
│   │   │   ├── jira/        # Jira integration
│   │   │   ├── notion/      # Notion integration
│   │   │   └── services/    # Business logic
│   │   └── tsconfig.json
│   └── web/                 # Web Console (@ezreport/web)
│       ├── app/             # Next.js app router
│       ├── components/      # React components
│       └── package.json
├── .env                     # Non-sensitive config
├── .env.local               # Secrets (API keys)
└── package.json             # Workspaces config
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
# Copy the example file
cp env.example.txt .env

# Create .env.local for secrets
touch .env.local

# Edit files and fill in your credentials
```

### 3. Run CLI

```bash
# Generate a report for current sprint (auto-detected from Jira)
npm run sprint-report:test

# Generate for a specific sprint
npm run sprint-report -- --sprint="Sprint 5"
```

### 4. Run Web Console

```bash
npm run dev
# Open http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web console (Next.js dev server) |
| `npm run dev:cli` | Run CLI in dev mode |
| `npm run sprint-report -- --sprint="..."` | Generate sprint report |
| `npm run sprint-report:test` | E2E test (auto-detects sprint) |
| `npm run test:connections` | Test all API connections |
| `npm run build` | Build both CLI and Web |
| `npm run build:cli` | Build CLI only |
| `npm run build:web` | Build Web only |

## Environment Variables

> ⚠️ **Security:** `.env.local` is ignored by git. Never commit real tokens.

| Variable | Required | Description |
|----------|----------|-------------|
| `MOCK_MODE` | No | Set to `"true"` for mock data. Default: `false` |
| `JIRA_BASE_URL` | Yes* | Jira Cloud instance URL |
| `JIRA_EMAIL` | Yes* | Jira account email |
| `JIRA_API_TOKEN` | Yes* | Jira API token |
| `JIRA_BOARD_ID` | No | Board ID for sprint lookups |
| `JIRA_ARTIFACT_FIELD_ID` | No | Custom field for artifacts. Default: `customfield_10001` |
| `NOTION_API_KEY` | Yes* | Notion integration secret |
| `NOTION_PARENT_PAGE_ID` | Yes* | Parent page ID for reports |
| `OPENAI_API_KEY` | Yes* | OpenAI API key |
| `OPENAI_MODEL` | No | Model to use. Default: `gpt-4o` |

*Required only when `MOCK_MODE` is not `true`.

## CLI Options

```bash
npm run sprint-report -- [options]

Options:
  --sprint=<name>     Sprint name to generate report for
  --sprint-id=<id>    Sprint ID to generate report for
  --dry-run           Generate report but don't create Notion page
  --test              E2E test mode (auto-detects sprint, resilient)
  --legacy            Use legacy single-prompt pipeline
  --help, -h          Show help message
```

## Report Template

The CLI generates a Notion page with:

1. **Версия** — Version info callout
2. **Спринт** — Sprint info callout  
3. **Отчет по итогам реализованного спринта**
   - Overview (5-10 sentences)
   - Не реализовано (incomplete items with reasons)
   - Ключевые достижения
4. **Артефакты** — Demo artifacts with descriptions
5. **Планирование следующего спринта**
6. **Вопросы от PM**

All text is in **Russian business language**.

## Getting API Keys

### Jira
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create an API token

### Notion
1. Go to https://www.notion.so/my-integrations
2. Create integration, copy the secret
3. Share the parent page with your integration

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create a new API key

## Development

```bash
# CLI development
npm run dev:cli -- --sprint="Sprint 5"

# Web development
npm run dev

# Type check all packages
npm run typecheck

# Build all
npm run build
```

## Contributing

This is a **vibe coding friendly** project — feel free to experiment, explore ideas, and contribute in whatever way feels natural to you.

### Code Review

All PRs are reviewed by assigned **architecture reviewers** who ensure consistency with the project's architectural decisions and code quality standards.

## License

MIT
