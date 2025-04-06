
/**
 * Simplified Electron API access
 * Main API export module
 */

// Re-export only needed functionality from modules
export { 
  getElectronAPI, 
  isElectronAPIAvailable, 
  testConnection 
} from './detector';
export { writeFile, selectDirectory, fileExists } from './fileSystem';
export type { 
  ElectronAPI,
  ElectronFileOperation,
  ElectronFileResult,
  ElectronConnectionResult,
  ConnectionTestResult
} from './types';
