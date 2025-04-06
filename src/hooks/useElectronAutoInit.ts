
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export function useElectronAutoInit() {
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Simple check if API is available
    const isAvailable = !!(
      window.electron && 
      typeof window.electron.writeFile === 'function' && 
      typeof window.electron.selectDirectory === 'function'
    );
    
    setApiAvailable(isAvailable);
    
    if (!isAvailable) {
      toast({
        title: "API Not Available",
        description: "Please restart the application",
        variant: "destructive"
      });
    }
  }, []);

  return { apiAvailable };
}
