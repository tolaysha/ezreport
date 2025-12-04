/**
 * Version-related types used across CLI and Web.
 */

/**
 * Version (release) metadata.
 * Contains essential version info for display.
 */
export interface VersionMeta {
  id: string;
  name: string;
  description?: string;
  releaseDate?: string;
  released: boolean;
  /** Computed progress percentage (0-100) */
  progressPercent?: number;
}

/**
 * Version info for report blocks (simplified view).
 */
export interface VersionBlockInfo {
  number: string;
  deadline: string;
  goal: string;
  progressPercent: number;
}

