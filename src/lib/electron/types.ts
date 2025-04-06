
/**
 * Simplified type definitions for Electron API
 */

export interface ElectronFileOperation {
  filePath: string;
  data: Uint8Array;
}

export interface ElectronFileResult {
  success: boolean;
  error?: string;
}

export interface ElectronAPI {
  writeFile: (options: ElectronFileOperation) => Promise<ElectronFileResult>;
  selectDirectory: () => Promise<string | null>;
  fileExists: (filePath: string) => Promise<boolean>;
  _testConnection?: () => { available: boolean; time: string; };
}
