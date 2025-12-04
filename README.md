# EzReport

A Node.js + TypeScript CLI tool that generates **fully structured sprint report pages** in Notion using:
- Data fetched from Jira (issues of a given sprint)
- AI-generated text in **Russian business language** (using OpenAI API)
- Structured Notion pages matching a specific template

## Features

- 🔄 **Jira Integration** — Fetch sprint issues automatically
- 🤖 **AI-Powered** — Generate professional reports using OpenAI
- 📝 **Notion Export** — Create beautiful formatted pages
- 🇷🇺 **Russian Business Language** — No technical jargon
- 🧪 **Mock Mode** — Test without API credentials
- ✅ **Connection Tests** — Verify integrations before use

## Report Template

The CLI generates a Notion page with the following structure:

1. **Версия** — Version info callout (number, deadline, goal, progress %)
2. **Спринт** — Sprint info callout (number, dates, goal, progress %)
3. **Отчет по итогам реализованного спринта**
   - Overview спринта (5-10 sentences)
   - Не реализовано в прошедшем спринте (list of incomplete items with reasons)
   - Ключевые достижения, выводы и инсайты спринта
4. **Артефакты по итогам реализованного спринта** — Demo artifacts with descriptions
5. **Планирование следующего спринта** — Next sprint goal and blockers
6. **Вопросы и предложения от Product Manager**

All text is generated in **Russian**, using **business language** without technical jargon (no API, backend, frontend, pipeline, DevOps, etc.).

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
# Copy the example file
cp env.example.txt .env

# Edit .env and fill in your credentials
```

### 3. Test connections

```bash
npm run test:connections
```

### 4. Generate a report

```bash
npm run sprint-report -- --sprint="Sprint 5"
```

## Environment Configuration

> ⚠️ **Security:** Your `.env` file is ignored by git. Never commit real tokens or API keys.

| Variable | Required | Description |
|----------|----------|-------------|
| `MOCK_MODE` | No | Set to `"true"` to run with mock data. Default: `false` |
| `JIRA_BASE_URL` | Yes* | Your Jira Cloud instance URL |
| `JIRA_EMAIL` | Yes* | Email associated with your Jira account |
| `JIRA_API_TOKEN` | Yes* | Jira API token |
| `JIRA_BOARD_ID` | No | Board ID for sprint name lookups |
| `JIRA_ARTIFACT_FIELD_ID` | No | Custom field ID for artifact links. Default: `customfield_10001` |
| `NOTION_API_KEY` | Yes* | Notion integration secret |
| `NOTION_PARENT_PAGE_ID` | Yes* | Notion page ID where reports will be created |
| `OPENAI_API_KEY` | Yes* | OpenAI API key |
| `OPENAI_MODEL` | No | OpenAI model to use. Default: `gpt-4o` |

*Required only when `MOCK_MODE` is not `true`.

### Getting API Keys

#### Jira
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create an API token
3. Use your email and the token for authentication

#### Notion
1. Go to https://www.notion.so/my-integrations
2. Create a new integration
3. Copy the "Internal Integration Secret"
4. **Important:** Share the parent page with your integration

#### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create a new API key

## Usage

```bash
# By sprint name
npm run sprint-report -- --sprint="Sprint 4"

# By sprint ID
npm run sprint-report -- --sprint-id=123

# Dry run (generate report without creating Notion page)
npm run sprint-report -- --sprint="Sprint 4" --dry-run

# E2E test mode (resilient, always succeeds)
npm run sprint-report:test
```

### Options

| Option | Description |
|--------|-------------|
| `--sprint=<name>` | Sprint name to generate report for |
| `--sprint-id=<id>` | Sprint ID to generate report for |
| `--dry-run` | Generate report but don't create Notion page |
| `--test` | Run in E2E test mode (resilient, always succeeds) |
| `--help`, `-h` | Show help message |

### Mock Mode

Test the CLI without real API calls:

```bash
MOCK_MODE=true npm run sprint-report -- --sprint="Sprint 4"
```

### Connection Tests

Verify your integrations are working:

```bash
# Test all connections
npm run test:connections

# Test individual services
npm run test:jira
npm run test:notion
npm run test:openai
```

## Project Structure

```
ezreport/
├── src/
│   ├── index.ts           # CLI entry point
│   ├── config.ts          # Environment config loader + validation
│   ├── ai/
│   │   ├── types.ts       # Domain types (SprintReportStructured, etc.)
│   │   ├── openaiClient.ts # OpenAI API wrapper
│   │   └── prompts.ts     # Prompt templates for Russian report
│   ├── jira/
│   │   ├── client.ts      # Jira API client
│   │   └── types.ts       # Jira types/interfaces
│   ├── notion/
│   │   ├── client.ts      # Notion API client
│   │   └── builder.ts     # Notion page structure builder
│   ├── services/
│   │   ├── sprintReport.ts # Main pipeline
│   │   └── demoSelector.ts # Demo issue selection
│   ├── tests/
│   │   └── connections/   # Integration connection tests
│   └── utils/
│       └── logger.ts      # Logging utility
├── docs/
│   └── project-context.md # Project context for AI assistants
├── .gitignore
├── env.example.txt
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

1. **Validate Config** — Checks required environment variables
2. **Fetch Sprint Data** — Retrieves issues from Jira (or uses mock data)
3. **Analyze Issues** — Categorizes issues, calculates story points
4. **Select Demo Issues** — Picks best issues for demo (done + artifacts + high points)
5. **Generate Structured Report** — Sends context to OpenAI, generates Russian text
6. **Create Notion Page** — Builds formatted page matching the template

## Development

```bash
# Build TypeScript
npm run build

# Run with ts-node (development)
npm run dev -- --sprint="Sprint 4"

# Test with mock mode
MOCK_MODE=true npm run dev -- --sprint="Sprint 4"
```

## License

MIT
