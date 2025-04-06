
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export function useElectronAutoInit() {
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Ultra simple check
    const available = !!window.electron;
    setApiAvailable(available);
    
    if (!available) {
      toast({
        title: "Restart needed",
        description: "Please restart the application",
        variant: "destructive"
      });
    }
  }, []);

  return { apiAvailable };
}
