/**
 * Language configuration for sprint reports.
 * Supports multiple languages for prompts, dates, and UI strings.
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Supported languages for report generation
 */
export type SupportedLanguage = 'ru' | 'en';

/**
 * Locale string for date formatting (BCP 47)
 */
export type LocaleString = 'ru-RU' | 'en-US';

/**
 * Language configuration for the workflow
 */
export interface LanguageConfig {
  code: SupportedLanguage;
  locale: LocaleString;
  name: string;
  nativeName: string;
}

/**
 * Localized strings for report sections
 */
export interface LocalizedStrings {
  // Page title
  pageTitle: (sprintName: string, date: string) => string;

  // Section headers
  sectionSprintReport: string;
  sectionOverview: string;
  sectionNotDone: string;
  sectionAchievements: string;
  sectionArtifacts: string;
  sectionNextSprint: string;
  sectionBlockers: string;
  sectionPmQuestions: string;

  // Callout templates
  versionCallout: (number: string, deadline: string, goal: string, progress: number) => string[];
  sprintCallout: (number: string, startDate: string, endDate: string, goal: string, progress: number) => string[];

  // Placeholders and defaults
  placeholderTimeline: string;
  placeholderArtifacts: string;
  allTasksCompleted: string;
  noBlockers: string;
  noQuestions: string;
  artifactsLater: string;

  // Labels
  labelDescription: string;
  labelJiraLink: string;
  labelArtifacts: string;
  labelSprintGoal: string;
}

// =============================================================================
// Language Configurations
// =============================================================================

export const LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  ru: {
    code: 'ru',
    locale: 'ru-RU',
    name: 'Russian',
    nativeName: 'Русский',
  },
  en: {
    code: 'en',
    locale: 'en-US',
    name: 'English',
    nativeName: 'English',
  },
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// =============================================================================
// Localized Strings
// =============================================================================

const STRINGS_RU: LocalizedStrings = {
  pageTitle: (sprintName, date) => `Отчёт по спринту: ${sprintName} (${date})`,

  sectionSprintReport: '1. Отчет по итогам реализованного спринта:',
  sectionOverview: 'Overview спринта:',
  sectionNotDone: 'Не реализовано в прошедшем спринте:',
  sectionAchievements: 'Ключевые достижения, выводы и инсайты спринта:',
  sectionArtifacts: '2. Артефакты по итогам реализованного спринта:',
  sectionNextSprint: '3. Планирование следующего спринта:',
  sectionBlockers: 'Блокеры для реализации следующего спринта:',
  sectionPmQuestions: '4. Вопросы и предложения от Product Manager:',

  versionCallout: (number, deadline, goal, progress) => [
    `Версия №${number} — дедлайн реализации ${deadline}`,
    `Цель версии — ${goal}`,
    `Версия реализована на ${progress}%`,
  ],
  sprintCallout: (number, startDate, endDate, goal, progress) => [
    `Спринт №${number} — срок реализации с ${startDate} по ${endDate}`,
    `Цель спринта — ${goal}`,
    `Спринт реализован на ${progress}%`,
  ],

  placeholderTimeline: '[Скриншот timeline спринта из Jira будет добавлен вручную]',
  placeholderArtifacts: '[Скриншоты/видео/макеты будут добавлены вручную]',
  allTasksCompleted: 'Все задачи спринта выполнены.',
  noBlockers: 'Нет',
  noQuestions: 'Нет',
  artifactsLater: 'Артефакты будут добавлены позже.',

  labelDescription: 'Описание:',
  labelJiraLink: 'Эпик / задача в Jira:',
  labelArtifacts: 'Артефакты:',
  labelSprintGoal: 'Цель следующего спринта —',
};

const STRINGS_EN: LocalizedStrings = {
  pageTitle: (sprintName, date) => `Sprint Report: ${sprintName} (${date})`,

  sectionSprintReport: '1. Sprint Results Report:',
  sectionOverview: 'Sprint Overview:',
  sectionNotDone: 'Not Completed in This Sprint:',
  sectionAchievements: 'Key Achievements, Takeaways and Insights:',
  sectionArtifacts: '2. Sprint Artifacts:',
  sectionNextSprint: '3. Next Sprint Planning:',
  sectionBlockers: 'Blockers for Next Sprint:',
  sectionPmQuestions: '4. Questions and Proposals from Product Manager:',

  versionCallout: (number, deadline, goal, progress) => [
    `Version #${number} — deadline ${deadline}`,
    `Version goal — ${goal}`,
    `Version completed at ${progress}%`,
  ],
  sprintCallout: (number, startDate, endDate, goal, progress) => [
    `Sprint #${number} — from ${startDate} to ${endDate}`,
    `Sprint goal — ${goal}`,
    `Sprint completed at ${progress}%`,
  ],

  placeholderTimeline: '[Jira timeline screenshot will be added manually]',
  placeholderArtifacts: '[Screenshots/videos/mockups will be added manually]',
  allTasksCompleted: 'All sprint tasks completed.',
  noBlockers: 'None',
  noQuestions: 'None',
  artifactsLater: 'Artifacts will be added later.',

  labelDescription: 'Description:',
  labelJiraLink: 'Epic / Jira task:',
  labelArtifacts: 'Artifacts:',
  labelSprintGoal: 'Next sprint goal —',
};

export const LOCALIZED_STRINGS: Record<SupportedLanguage, LocalizedStrings> = {
  ru: STRINGS_RU,
  en: STRINGS_EN,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get language configuration by code
 */
export function getLanguageConfig(lang: SupportedLanguage): LanguageConfig {
  return LANGUAGES[lang];
}

/**
 * Get localized strings for a language
 */
export function getLocalizedStrings(lang: SupportedLanguage): LocalizedStrings {
  return LOCALIZED_STRINGS[lang];
}

/**
 * Format date according to language locale
 */
export function formatDate(dateStr: string | undefined, lang: SupportedLanguage): string | undefined {
  if (!dateStr) {
    return undefined;
  }
  try {
    const config = getLanguageConfig(lang);
    const date = new Date(dateStr);
    return date.toLocaleDateString(config.locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Check if text contains characters of the expected language
 */
export function isTextInLanguage(text: string, lang: SupportedLanguage): boolean {
  if (lang === 'ru') {
    // Check for Cyrillic characters
    return /[а-яА-ЯёЁ]/.test(text);
  }
  // For English, check for Latin characters (and absence of Cyrillic in significant parts)
  return /[a-zA-Z]/.test(text);
}

/**
 * Parse language from CLI argument
 */
export function parseLanguage(langArg: string | undefined): SupportedLanguage {
  if (!langArg) {
    return DEFAULT_LANGUAGE;
  }
  const normalized = langArg.toLowerCase().trim();
  if (normalized === 'ru' || normalized === 'russian' || normalized === 'русский') {
    return 'ru';
  }
  if (normalized === 'en' || normalized === 'english') {
    return 'en';
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Validate that a language code is supported
 */
export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return lang === 'ru' || lang === 'en';
}



