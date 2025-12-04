/**
 * Helper functions for sprint components.
 */

import type { GoalMatchLevel, AlignmentLevel, DemoRecommendation } from '@/types/workflow';

export function getGoalMatchColor(level: GoalMatchLevel): string {
  switch (level) {
    case 'strong':
      return 'text-green-400';
    case 'medium':
      return 'text-yellow-500';
    case 'weak':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

export function getGoalMatchLabel(level: GoalMatchLevel): string {
  switch (level) {
    case 'strong':
      return 'Сильное';
    case 'medium':
      return 'Среднее';
    case 'weak':
      return 'Слабое';
    default:
      return 'Неизвестно';
  }
}

export function getAlignmentColor(level: AlignmentLevel): string {
  switch (level) {
    case 'aligned':
      return 'text-green-400';
    case 'partial':
      return 'text-yellow-500';
    case 'misaligned':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

export function getAlignmentLabel(level: AlignmentLevel): string {
  switch (level) {
    case 'aligned':
      return '✓ Согласовано';
    case 'partial':
      return '◐ Частично';
    case 'misaligned':
      return '✗ Рассогласовано';
    default:
      return '? Неизвестно';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-400';
  if (score >= 40) return 'text-yellow-500';
  return 'text-red-500';
}

export function getStatusColor(statusCategory: string): string {
  switch (statusCategory) {
    case 'done':
      return 'text-green-400';
    case 'indeterminate':
      return 'text-yellow-500';
    default:
      return 'text-gray-400';
  }
}

export function getDemoFormatIcon(format: DemoRecommendation['suggestedFormat']): string {
  switch (format) {
    case 'video': return '🎥';
    case 'screenshot': return '📸';
    case 'live': return '🖥️';
    case 'slides': return '📊';
    default: return '📋';
  }
}

export function getComplexityColor(complexity: number): string {
  if (complexity <= 2) return 'text-green-400';
  if (complexity <= 3) return 'text-yellow-500';
  return 'text-red-500';
}

export function getConfidenceColor(percent: number): string {
  if (percent >= 70) return 'text-green-400';
  if (percent >= 40) return 'text-yellow-500';
  return 'text-red-400';
}

export function getConfidenceLabel(percent: number): string {
  if (percent >= 80) return 'Высокая уверенность';
  if (percent >= 60) return 'Умеренная уверенность';
  if (percent >= 40) return 'Низкая уверенность';
  return 'Критический риск';
}


