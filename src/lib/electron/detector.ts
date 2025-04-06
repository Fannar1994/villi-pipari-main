
/**
 * Electron API detection and recovery module
 * This is now a central export file that re-exports from the smaller modules
 */

// Export all functionality from the refactored modules
export { 
  getElectronAPI, 
  isElectronAPIAvailable, 
  testConnection,
  forceApiRecovery
} from './detector-core';

export { activateEmergencyMode } from './emergency-mode';
export { tryLegacyRecovery } from './api-recovery';
