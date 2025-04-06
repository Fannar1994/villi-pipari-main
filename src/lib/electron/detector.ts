
/**
 * Electron API detection and recovery module
 * This is now a central export file that re-exports from the smaller modules
 */

// Export only core functionality - no emergency mode
export { 
  getElectronAPI, 
  isElectronAPIAvailable, 
  testConnection,
  forceApiRecovery,
  // Add these exports to fix TypeScript errors
  setEmergencyApiBackup,
  getEmergencyApiBackup
} from './detector-core';
