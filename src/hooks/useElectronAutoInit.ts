
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

/**
 * Hook that automatically initializes the Electron API
 * when the application starts - Simplified version
 */
export function useElectronAutoInit() {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Run initialization only once
    if (initialized) return;
    
    const initializeAPI = () => {
      console.log('🚀 Checking Electron API availability...');
      
      // Simple check if API is available directly
      const isAvailable = !!(
        window.electron && 
        typeof window.electron.writeFile === 'function' && 
        typeof window.electron.selectDirectory === 'function' && 
        typeof window.electron.fileExists === 'function'
      );
      
      if (isAvailable) {
        console.log('✅ Electron API is available');
        setApiAvailable(true);
      } else {
        console.log('❌ Electron API not available');
        
        // Try backup location as a simple fallback
        if (window.electronBackupAPI) {
          console.log('🔄 Restoring API from backup location');
          window.electron = window.electronBackupAPI;
          setApiAvailable(true);
          
          toast({
            title: "API restored",
            description: "API has been restored from backup",
          });
        } else {
          console.error('❌ No API available - restart may be required');
          
          toast({
            title: "API Not Available",
            description: "Please restart the application",
            variant: "destructive"
          });
        }
      }
      
      setInitialized(true);
    };
    
    // Run initialization immediately
    initializeAPI();
  }, [initialized]);

  return { initialized, apiAvailable };
}
