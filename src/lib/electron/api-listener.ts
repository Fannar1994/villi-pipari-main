/**
 * API listener system - monitors for API availability changes
 */

import { enableEmergencyMode } from './emergency-mode';
import { toast } from '@/hooks/use-toast';

// Keep track of whether we're already monitoring
let isMonitoring = false;

/**
 * Start monitoring for API availability
 */
export function startApiMonitor(): void {
  if (isMonitoring) return;
  
  console.log('🔍 Starting API monitor');
  isMonitoring = true;
  
  // Check immediately
  const initialAvailable = checkApiAvailability();
  
  // Set up interval to check API availability
  const checkInterval = setInterval(() => {
    const available = checkApiAvailability();
    
    // If API became available and wasn't before
    if (available && !initialAvailable) {
      console.log('🎉 API became available during monitoring!');
      toast({
        title: "API endurheimt",
        description: "API hefur verið endurheimt - virkni er nú í lagi",
      });
      
      // We can stop monitoring now
      clearInterval(checkInterval);
      isMonitoring = false;
    }
    
    // If API is still unavailable after multiple checks, try emergency mode
    if (!available) {
      console.log('❌ API still unavailable, trying emergency mode');
      const success = enableEmergencyMode();
      
      if (success) {
        console.log('✅ Emergency mode successfully restored API');
        toast({
          title: "Neyðarhamur virkjaður",
          description: "API hefur verið endurheimt í neyðarham",
        });
        
        // We can stop monitoring if successful
        clearInterval(checkInterval);
        isMonitoring = false;
      }
    }
  }, 2000);
  
  // Also listen for localStorage emergency communication
  try {
    window.addEventListener('storage', (event) => {
      if (event.key === 'electron_emergency_response' && event.newValue) {
        console.log('📡 Received emergency response via localStorage');
        
        // Try to recover API again
        const success = enableEmergencyMode();
        if (success) {
          toast({
            title: "API endurheimt",
            description: "API hefur verið endurheimt í gegnum neyðarboð",
          });
        }
      }
    });
  } catch (e) {
    console.error('❌ Failed to set up storage listener:', e);
  }
}

// Helper to check API availability
function checkApiAvailability(): boolean {
  return !!(window.electron && 
    typeof window.electron.writeFile === 'function' && 
    typeof window.electron.selectDirectory === 'function' && 
    typeof window.electron.fileExists === 'function');
}
