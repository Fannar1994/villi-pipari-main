
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export function useElectronAutoInit() {
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Very simple API check
    const api = window.electron;
    setApiAvailable(!!api);
    
    if (!api) {
      toast({
        title: "Restart needed",
        description: "Please restart the application",
        variant: "destructive"
      });
    }
  }, []);

  return { apiAvailable };
}
