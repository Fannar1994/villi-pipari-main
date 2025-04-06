
/**
 * Emergency mode for Electron API access when normal methods fail
 * This module is being phased out in favor of direct window.electron access
 */
import { ElectronAPI } from './types';
import { toast } from '@/hooks/use-toast';
import { 
  getElectronAPI, 
  isElectronAPIAvailable, 
  setEmergencyApiBackup, 
  getEmergencyApiBackup 
} from './detector-core'; // Import directly from detector-core

/**
 * Activate emergency mode
 * This creates a simple emergency-mode API that can access file system
 * by using direct DOM-based communication with the Electron main process
 * 
 * Note: This function is deprecated and will be removed in a future version
 */
export function activateEmergencyMode(): boolean {
  console.log('🚨 ACTIVATING EMERGENCY MODE...');
  console.log('⚠️ Emergency mode is deprecated. Please use window.electron directly.');
  
  // Check if window.electron already exists - if so, we don't need emergency mode
  if (isElectronAPIAvailable()) {
    console.log('✓ Standard API is available - no need for emergency mode');
    return true;
  }
  
  // Show toast notification about deprecation
  toast({
    title: "Neyðarhamur ekki lengur studdur",
    description: "Vinsamlega endurræstu forritið til að nota staðlað API",
    variant: "destructive",
  });
  
  return false; // Always return false as this mode is being phased out
}

/**
 * Set up handlers for the emergency message passing system
 * This is a stub function that doesn't do anything anymore
 */
function setupEmergencyMessageHandlers() {
  console.log('Emergency mode is deprecated - message handlers not set up');
}
