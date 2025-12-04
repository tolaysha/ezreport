/**
 * Board-level types used across CLI and Web.
 */

import type { SprintCardData } from './sprint';
import type { VersionMeta } from './version';
import type { StrategicAnalysis } from './analysis';

/**
 * Availability flags indicating what data was successfully fetched.
 */
export interface BoardDataAvailability {
  hasPreviousSprint: boolean;
  hasCurrentSprint: boolean;
}

/**
 * Complete board sprint snapshot.
 * Contains data for two sprints: previous (closed) and current (active).
 */
export interface BasicBoardSprintData {
  boardId: string;
  projectKey?: string;
  projectName?: string;
  activeVersion?: VersionMeta;
  previousSprint?: SprintCardData;
  currentSprint?: SprintCardData;
  analysis?: StrategicAnalysis;
  availability: BoardDataAvailability;
}

