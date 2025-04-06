
/**
 * EMERGENCY MODE ADAPTER
 * This provides last-resort emergency access to the Electron API
 */

import { ElectronAPI } from './types';
import { getElectronAPI } from './detector/core';
import { forceApiRecovery, getEmergencyApiBackup } from './detector/recovery';
import { findElectronAPIAggressively } from './detector/aggressive';
import { createGlobalEmergencyAPI } from './detector/emergency';
import { tryLegacyRecovery } from './api-recovery';

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
  
  // Try direct recovery approach first (quickest)
  console.log('Trying direct API recovery...');
  const recovered = forceApiRecovery();
  if (recovered) {
    console.log('✅ API successfully recovered through direct recovery');
    return true;
  }
  
  // Try legacy recovery approaches
  console.log('Trying legacy recovery approaches...');
  const legacyRecovered = tryLegacyRecovery();
  if (legacyRecovered) {
    console.log('✅ API successfully recovered through legacy recovery');
    return true;
  }
  
  // Check for backups
  console.log('Checking for API backups...');
  const backupApi = getEmergencyApiBackup();
  if (backupApi) {
    console.log('✅ Using backup API');
    window.electron = backupApi;
    return isElectronAPIAvailable();
  }
  
  // Try to create a new emergency API globally
  console.log('Attempting to create global emergency API...');
  createGlobalEmergencyAPI();
  
  // Check if the creation worked
  if (isElectronAPIAvailable()) {
    console.log('✅ Successfully created global emergency API');
    return true;
  }
  
  // Ultra-aggressive search as a final resort
  console.log('Performing ultra-aggressive API search...');
  const aggressiveApi = findElectronAPIAggressively();
  if (aggressiveApi) {
    console.log('✅ API found using aggressive search');
    window.electron = aggressiveApi;
    return isElectronAPIAvailable();
  }
  
  // Last resort: Try injecting the API through localStorage communication
  console.log('🚨 Attempting localStorage-based API recovery...');
  try {
    // Send a message through localStorage that we need emergency API help
    localStorage.setItem('electron_emergency_request', Date.now().toString());
    console.log('📡 Emergency request signal sent via localStorage');
    
    // The main process might be listening and could help us recover
    // We'll check again shortly
    setTimeout(() => {
      const api = getElectronAPI();
      if (api) {
        console.log('✅ API recovered after emergency request!');
      }
    }, 500);
  } catch (e) {
    console.error('❌ localStorage approach failed:', e);
  }
  
  console.error('❌ Failed to enable emergency mode - no API found');
  return false;
}

/**
 * Test if the API is available using various methods
 */
export function isElectronAPIAvailable(): boolean {
  const api = window.electron;
  return !!(api && typeof api.writeFile === 'function' && 
           typeof api.selectDirectory === 'function' && 
           typeof api.fileExists === 'function');
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
  isElectronAPIAvailable,
  isBackupApiAvailable
};
