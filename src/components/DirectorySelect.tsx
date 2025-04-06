
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

// Function to get best available API
function getBestElectronAPI() {
  if (typeof window === 'undefined') return null;
  
  // Try primary API
  if (window.electron && typeof window.electron.selectDirectory === 'function') {
    console.log('Using primary electron API');
    return window.electron;
  }
  
  // Try backup API
  if (window.electronBackupAPI && typeof window.electronBackupAPI.selectDirectory === 'function') {
    console.log('Using backup electron API');
    return window.electronBackupAPI;
  }
  
  // Try global backup (should work in dev mode)
  try {
    if (typeof global !== 'undefined' && global.__ELECTRON_API__) {
      console.log('Using global backup API');
      
      // Also restore it to window while we're here
      if (typeof window !== 'undefined') {
        window.electron = global.__ELECTRON_API__;
        window.electronBackupAPI = global.__ELECTRON_API__;
      }
      
      return global.__ELECTRON_API__;
    }
  } catch (e) {
    console.error('Error accessing global backup API:', e);
  }
  
  console.error('No electron API available');
  return null;
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

  useEffect(() => {
    // Check API availability on mount and every 2 seconds
    const checkApi = () => {
      const api = getBestElectronAPI();
      const available = !!api;
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
      
      const api = getBestElectronAPI();
      
      if (api) {
        try {
          console.log('Calling selectDirectory...');
          const result = await api.selectDirectory();
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
        }
      } else {
        console.error('No API available for directory selection');
        toast({
          title: "Villa",
          description: "Ekki næst samband við skráakerfi. Endurræstu forritið.",
          variant: "destructive",
        });
      }
      
      // Use fallback path if all else fails
      onChange('C:/temp');
      
    } catch (error) {
      console.error("Unexpected error selecting directory:", error);
      toast({
        title: "Villa",
        description: "Villa kom upp við möppuval",
        variant: "destructive",
      });
      onChange('C:/temp');
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
