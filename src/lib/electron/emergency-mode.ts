
/**
 * SIMPLIFIED EMERGENCY MODE ADAPTER
 * This file exists only to maintain compatibility with the rest of the code
 */

import { ElectronAPI } from './types';
import { getElectronAPI, setEmergencyApiBackup, getEmergencyApiBackup } from './detector-core';

/**
 * Emergency mode is now disabled in favor of using direct window.electron approach
 */
export function enableEmergencyMode(): boolean {
  console.log('Emergency mode is disabled - using direct window.electron approach only');
  return false;
}

/**
 * Check if backup API is available
 * Simplified to just check window.electron
 */
export function isBackupApiAvailable(): boolean {
  return !!window.electron;
}

export default {
  enableEmergencyMode,
  isBackupApiAvailable
};
