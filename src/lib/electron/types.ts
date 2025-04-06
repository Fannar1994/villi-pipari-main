
/**
 * Type definitions for Electron API
 */

export interface ElectronFileOperation {
  filePath: string;
  data: Uint8Array;
}

export interface ElectronFileResult {
  success: boolean;
  error?: string;
}

export interface ElectronConnectionResult {
  available: boolean;
  time: string;
  preloadVersion?: string;
}

export interface ElectronAPI {
  writeFile: (options: ElectronFileOperation) => Promise<ElectronFileResult>;
  selectDirectory: () => Promise<string | null>;
  fileExists: (filePath: string) => Promise<boolean>;
  _testConnection: () => ElectronConnectionResult; // Changed from optional to required
}

export interface ConnectionTestResult {
  available: boolean;
  details: string;
}
