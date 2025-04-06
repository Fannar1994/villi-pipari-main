
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { getElectronAPI, isElectronAPIAvailable } from '@/lib/electron/api';

interface DirectorySelectProps {
  value: string;
  onChange: (path: string) => void;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function DirectorySelect({
  value,
  onChange,
  label,
  icon,
  disabled = false,
}: DirectorySelectProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);

  // Check API availability
  useEffect(() => {
    const checkApi = () => {
      const available = isElectronAPIAvailable();
      console.log('Directory selector - API available:', available);
      setApiAvailable(available);
    };
    
    // Initial check
    checkApi();
    
    // Set up periodic checks
    const interval = setInterval(checkApi, 2000);
    
    // Cleanup
    return () => clearInterval(interval);
  }, []);

  const handleButtonClick = async () => {
    try {
      setIsSelecting(true);
      
      const api = getElectronAPI();
      
      if (api && typeof api.selectDirectory === 'function') {
        console.log('Calling selectDirectory from DirectorySelect component...');
        try {
          const result = await api.selectDirectory();
          console.log('selectDirectory result from component:', result);
          
          if (result) {
            onChange(result);
            console.log('Directory selected successfully:', result);
            toast({
              title: "Mappa valin",
              description: `Mappa: ${result}`,
            });
            return;
          } else {
            console.warn('No directory selected or dialog was cancelled');
          }
        } catch (error) {
          console.error('Error selecting directory:', error);
          toast({
            title: "Villa",
            description: "Villa kom upp við möppuval.",
            variant: "destructive",
          });
        }
      } else {
        console.error('No API available for directory selection');
        toast({
          title: "Villa",
          description: "Ekki næst samband við skráakerfi. Endurræstu forritið.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error("Unexpected error selecting directory:", error);
      toast({
        title: "Villa",
        description: "Villa kom upp við möppuval",
        variant: "destructive",
      });
    } finally {
      setIsSelecting(false);
    }
  };

  // Add a retry mechanism for API availability
  const handleRetry = () => {
    // Check API availability again
    const available = isElectronAPIAvailable();
    setApiAvailable(available);
    
    if (available) {
      toast({
        title: "Árangur",
        description: "Samband við skráakerfi hefur verið endurheimt.",
      });
    } else {
      toast({
        title: "Villa",
        description: "Ekki tókst að endurheimta samband við skráakerfi. Vinsamlegast endurræstu forritið.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`dir-${label}`}>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          readOnly
          placeholder="Engin mappa valin"
          className="flex-1 bg-secondary"
          id={`dir-${label}`}
          title={value} // Show full path on hover
        />
        <Button
          type="button"
          variant={apiAvailable ? "default" : "destructive"}
          onClick={apiAvailable ? handleButtonClick : handleRetry}
          disabled={disabled || isSelecting}
          className="whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {icon}
          {isSelecting ? 'Velur...' : apiAvailable ? 'Velja möppu' : 'Endurreyna'}
        </Button>
      </div>
      {!apiAvailable && (
        <p className="text-xs text-destructive">
          Electron API ekki tiltækt. Smelltu á "Endurreyna" eða endurræstu forritið.
        </p>
      )}
    </div>
  );
}
