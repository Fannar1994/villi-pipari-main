
/**
 * Enhanced Electron API access with improved reliability
 * Main API export module
 */

// Re-export all functionality from modules
export { getElectronAPI, isElectronAPIAvailable, testConnection } from './detector';
export { writeFile, selectDirectory, fileExists } from './fileSystem';
export type { 
  ElectronAPI,
  ElectronFileOperation,
  ElectronFileResult,
  ElectronConnectionResult,
  ConnectionTestResult
} from './types';
