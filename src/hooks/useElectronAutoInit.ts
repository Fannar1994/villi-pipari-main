
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

export function useElectronAutoInit() {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);

  useEffect(() => {
    if (initialized) return;
    
    const checkApi = () => {
      const isAvailable = !!(
        window.electron && 
        typeof window.electron.writeFile === 'function' && 
        typeof window.electron.selectDirectory === 'function'
      );
      
      if (isAvailable) {
        setApiAvailable(true);
      } else {
        toast({
          title: "API Not Available",
          description: "Please restart the application",
          variant: "destructive"
        });
      }
      
      setInitialized(true);
    };
    
    checkApi();
  }, [initialized]);

  return { initialized, apiAvailable };
}
