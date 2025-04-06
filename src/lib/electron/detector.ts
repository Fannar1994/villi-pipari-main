
/**
 * Electron API detection and recovery module
 * This is the main entry point that re-exports functionality from specialized modules
 */

// Export core functionality from separate modules
export { 
  getElectronAPI,
  isElectronAPIAvailable, 
  testConnection 
} from './detector/core';

export { 
  forceApiRecovery,
  setEmergencyApiBackup,
  getEmergencyApiBackup 
} from './detector/recovery';

export { createGlobalEmergencyAPI } from './detector/emergency';
