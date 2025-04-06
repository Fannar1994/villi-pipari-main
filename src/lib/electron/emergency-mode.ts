
/**
 * EMERGENCY MODE ADAPTER
 * This provides last-resort emergency access to the Electron API
 */

import { ElectronAPI } from './types';
import { getElectronAPI } from './detector/core';
import { forceApiRecovery, getEmergencyApiBackup } from './detector/recovery';
import { findElectronAPIAggressively } from './detector/aggressive';

/**
 * Enable emergency mode - tries all available methods to restore API access
 */
export function enableEmergencyMode(): boolean {
  console.log('🚨 Emergency mode activated');
  
  // First check if API is already available
  const currentApi = getElectronAPI();
  if (currentApi && typeof currentApi.writeFile === 'function') {
    console.log('API already available, no recovery needed');
    return true;
  }
  
  // Try using the recovery function
  const recovered = forceApiRecovery();
  if (recovered) {
    console.log('API successfully recovered');
    return true;
  }
  
  // Check for backups
  const backupApi = getEmergencyApiBackup();
  if (backupApi) {
    console.log('Using backup API');
    window.electron = backupApi;
    return true;
  }
  
  // Last resort: try direct access to backups
  if ((window as any).electronBackupAPI) {
    console.log('Using window.electronBackupAPI');
    window.electron = (window as any).electronBackupAPI;
    return true;
  }
  
  // Ultra-aggressive search as a final resort
  const aggressiveApi = findElectronAPIAggressively();
  if (aggressiveApi) {
    console.log('API found using aggressive search');
    window.electron = aggressiveApi;
    return true;
  }
  
  console.error('Failed to enable emergency mode - no API found');
  return false;
}

/**
 * Check if backup API is available
 */
export function isBackupApiAvailable(): boolean {
  return !!(
    (window as any).electronBackupAPI || 
    (typeof global !== 'undefined' && (global as any).electronBackupAPI)
  );
}

export default {
  enableEmergencyMode,
  isBackupApiAvailable
};
