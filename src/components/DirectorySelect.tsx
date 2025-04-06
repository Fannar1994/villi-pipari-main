
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

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

  // Simple direct API check
  useEffect(() => {
    const checkApi = () => {
      const available = typeof window !== 'undefined' && 
                       !!window.electron && 
                       typeof window.electron.selectDirectory === 'function';
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
      
      // Direct API access
      if (window.electron && typeof window.electron.selectDirectory === 'function') {
        try {
          console.log('Calling selectDirectory...');
          const result = await window.electron.selectDirectory();
          console.log('selectDirectory result:', result);
          
          if (result) {
            onChange(result);
            console.log('Directory selected successfully:', result);
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
        />
        <Button
          type="button"
          variant={apiAvailable ? "default" : "destructive"}
          onClick={handleButtonClick}
          disabled={disabled || isSelecting}
          className="whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {icon}
          {isSelecting ? 'Velur...' : apiAvailable ? 'Velja möppu' : 'API vantar'}
        </Button>
      </div>
      {!apiAvailable && (
        <p className="text-xs text-destructive">
          Electron API ekki tiltækt. Endurræstu forritið.
        </p>
      )}
    </div>
  );
}
