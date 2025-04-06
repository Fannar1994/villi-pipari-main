
import { useEffect, useState } from 'react';
import { isElectronAPIAvailable } from '@/lib/electron/detector';
import { enableEmergencyMode } from '@/lib/electron/emergency-mode';
import { startApiMonitor } from '@/lib/electron/api-listener';
import { toast } from '@/hooks/use-toast';

/**
 * Hook that automatically initializes the Electron API
 * when the application starts
 */
export function useElectronAutoInit() {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);
  const [emergencyActive, setEmergencyActive] = useState<boolean>(false);

  useEffect(() => {
    // Run initialization only once
    if (initialized) return;
    
    const initializeAPI = async () => {
      console.log('🚀 Auto-initializing Electron API...');
      
      // First check if API is already available
      const available = isElectronAPIAvailable();
      
      if (available) {
        console.log('✅ Electron API already available');
        setApiAvailable(true);
      } else {
        console.log('❌ Electron API not available, trying emergency mode');
        
        // Try emergency mode
        const recoverySuccess = enableEmergencyMode();
        
        if (recoverySuccess) {
          console.log('✅ Successfully recovered API with emergency mode');
          setApiAvailable(true);
          setEmergencyActive(true);
          
          // Show toast notification
          toast({
            title: "API endurheimt",
            description: "API hefur verið endurheimt í neyðarham",
          });
        } else {
          console.error('❌ Failed to recover API');
          
          // Start monitoring for API availability changes
          startApiMonitor();
        }
      }
      
      setInitialized(true);
    };
    
    // Run initialization with slight delay to let other systems initialize
    const timer = setTimeout(initializeAPI, 500);
    
    return () => clearTimeout(timer);
  }, [initialized]);

  return { initialized, apiAvailable, emergencyActive };
}
