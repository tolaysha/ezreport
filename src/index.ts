#!/usr/bin/env node

interface CliArgs {
  sprint?: string;
  sprintId?: string;
  dryRun?: boolean;
  help?: boolean;
  test?: boolean;
  legacy?: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {};

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--test' || arg === '--e2e-test') {
      result.test = true;
    } else if (arg === '--legacy') {
      result.legacy = true;
    } else if (arg.startsWith('--sprint=')) {
      result.sprint = arg.replace('--sprint=', '');
    } else if (arg.startsWith('--sprint-id=')) {
      result.sprintId = arg.replace('--sprint-id=', '');
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
Sprint Report Generator

Usage:
  npm run sprint-report -- --sprint="Sprint 5"
  npm run sprint-report -- --sprint-id=123
  npm run sprint-report -- --sprint="Sprint 5" --dry-run
  npm run sprint-report:test                              # E2E test mode (auto-detects sprint)

Options:
  --sprint=<name>     Sprint name to generate report for
  --sprint-id=<id>    Sprint ID to generate report for
  --dry-run           Generate report but don't create Notion page
  --test              Run in E2E test mode (resilient, always succeeds)
  --legacy            Use legacy pipeline (single AI prompt, no validation)
  --help, -h          Show this help message

Workflow Stages:
  The default pipeline uses a three-stage workflow:
  1. Data collection & validation (with AI goal-issue match check)
  2. Block-by-block report generation (each block uses its own AI prompt)
  3. Final report validation (structure + AI partner-readiness check)

Test Mode (--test):
  Runs the entire pipeline with resilient fallbacks:
  - Auto-detects current/last sprint from Jira (or use --sprint to override)
  - Tries real Jira/OpenAI/Notion if configured
  - Falls back to mocks for any integration that fails or is not configured
  - Always completes successfully (exit code 0)
  - Useful for verifying the pipeline is wired correctly

Environment Variables (set in cli/.env):
  MOCK_MODE             Set to "true" to run with mock data (no API calls)
  JIRA_BASE_URL         Jira instance URL
  JIRA_EMAIL            Jira account email
  JIRA_API_TOKEN        Jira API token
  JIRA_BOARD_ID         Jira board ID (required for sprint name lookup)
  JIRA_ARTIFACT_FIELD_ID  Custom field ID for artifact
  NOTION_API_KEY        Notion API key
  NOTION_PARENT_PAGE_ID Parent page ID for reports
  OPENAI_API_KEY        OpenAI API key
  OPENAI_MODEL          OpenAI model (default: gpt-4o)

For more information, see: cli/README.md
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Help can run without config validation
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const sprintNameOrId = args.sprint ?? args.sprintId;

  // Test mode: resilient pipeline that always succeeds
  // Sprint is optional in test mode - will auto-detect from Jira
  if (args.test) {
    const { runSprintReportTestMode } = await import('./services/sprintReport');
    const { logger } = await import('./utils/logger');

    logger.info('Starting sprint report generation in TEST MODE', {
      sprint: sprintNameOrId ?? 'auto-detect',
    });

    console.log('\n🧪 Running in E2E TEST MODE...\n');

    await runSprintReportTestMode({ sprintNameOrId });

    // Test mode always exits with 0
    process.exit(0);
  }

  if (!sprintNameOrId) {
    console.error('Error: Please provide --sprint or --sprint-id');
    printHelp();
    process.exit(1);
  }

  // Normal mode: Import config and validate AFTER arg parsing
  // This allows --help to work without valid credentials
  const { validateConfig } = await import('./config');

  try {
    validateConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ ${message}\n`);
    process.exit(1);
  }

  // Legacy mode: use the old single-prompt pipeline
  if (args.legacy) {
    const { generateSprintReport } = await import('./services/sprintReport');
    const { logger } = await import('./utils/logger');

    logger.info('Starting sprint report generation (LEGACY MODE)', {
      sprint: sprintNameOrId,
      dryRun: args.dryRun ?? false,
    });

    console.log('\n⚙️  Running in LEGACY mode (single AI prompt)...\n');

    const result = await generateSprintReport({
      sprintNameOrId,
      dryRun: args.dryRun,
    });

    if (!result.success) {
      console.error(`\n❌ Error: ${result.error}\n`);
      process.exit(1);
    }

    process.exit(0);
  }

  // Default: New three-stage workflow
  const { runSprintReportWorkflow } = await import('./services/sprintReportWorkflow');
  const { logger } = await import('./utils/logger');

  logger.info('Starting sprint report workflow', {
    sprint: sprintNameOrId,
    dryRun: args.dryRun ?? false,
  });

  console.log('\n🚀 Starting Sprint Report Workflow\n');
  console.log('='.repeat(60));

  const result = await runSprintReportWorkflow({
    sprintNameOrId,
    dryRun: args.dryRun,
  });

  console.log('='.repeat(60));

  // Print validation summary
  if (result.dataValidation) {
    const { errors, warnings } = result.dataValidation;
    if (errors.length > 0 || warnings.length > 0) {
      console.log('\n📋 Data Validation Summary:');
      if (errors.length > 0) {
        console.log(`   Errors: ${errors.length}`);
        errors.forEach(e => console.log(`     ❌ ${e.message}`));
      }
      if (warnings.length > 0) {
        console.log(`   Warnings: ${warnings.length}`);
        warnings.forEach(w => console.log(`     ⚠️  ${w.message}`));
      }
    }
  }

  if (result.reportValidation) {
    const { errors, warnings } = result.reportValidation;
    if (errors.length > 0 || warnings.length > 0) {
      console.log('\n📋 Report Validation Summary:');
      if (errors.length > 0) {
        console.log(`   Errors: ${errors.length}`);
        errors.forEach(e => console.log(`     ❌ ${e.message}`));
      }
      if (warnings.length > 0) {
        console.log(`   Warnings: ${warnings.length}`);
        warnings.forEach(w => console.log(`     ⚠️  ${w.message}`));
      }
    }
  }

  if (!result.success) {
    console.error(`\n❌ Workflow failed: ${result.abortReason ?? result.error}\n`);
    process.exit(1);
  }

  if (result.notionPage) {
    console.log(`\n✅ Success! Notion page: ${result.notionPage.url}\n`);
  } else if (args.dryRun) {
    console.log('\n✅ Dry run completed successfully.\n');
  }

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
