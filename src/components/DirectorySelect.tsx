
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
  const [apiMode, setApiMode] = useState<'standard' | 'web' | 'unavailable'>('unavailable');

  // Enhanced API check using our improved methods
  useEffect(() => {
    const checkApi = () => {
      const available = isElectronAPIAvailable();
      console.log('Directory selector - API available:', available);
      setApiAvailable(available);
      
      // Determine the API mode
      if (available) {
        const api = getElectronAPI();
        
        // Check if we're in web mode by testing the connection info
        if (api && typeof api._testConnection === 'function') {
          try {
            const result = api._testConnection();
            if (result.preloadVersion && 
               (result.preloadVersion.includes('emergency') || 
                result.preloadVersion.includes('web'))) {
              setApiMode('web');
              console.log('Running in web API mode');
            } else {
              setApiMode('standard');
              console.log('Running in standard API mode');
            }
          } catch (e) {
            console.error('Error checking API mode:', e);
            setApiMode('standard'); // Default to standard if check fails
          }
        } else {
          setApiMode('standard');
        }
      } else {
        setApiMode('unavailable');
      }
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
      
      // Use our enhanced API getter
      const api = getElectronAPI();
      
      if (api && typeof api.selectDirectory === 'function') {
        try {
          console.log('Calling selectDirectory...');
          const result = await api.selectDirectory();
          console.log('selectDirectory result:', result);
          
          if (result) {
            onChange(result);
            
            // Show special notifications based on the type of path returned
            if (apiMode === 'web') {
              // Check if we got a special path format
              if (result.startsWith('web-directory://')) {
                toast({
                  title: "Mappa valin í vafraham",
                  description: "Skrárnar verða vistaðar gegnum vafraviðmót.",
                });
              } else if (result.startsWith('download://')) {
                toast({
                  title: "Niðurhal valið",
                  description: "Skrárnar verða vistaðar sem niðurhal.",
                });
              } else {
                toast({
                  title: "Vafrahamur",
                  description: "Forritið keyrir í vafraham. Sumir eiginleikar gætu verið takmarkaðir.",
                  variant: "destructive", 
                });
              }
            }
            
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

  // Format the display value to be more user-friendly
  const getDisplayValue = () => {
    if (!value) return '';
    
    // For web directory URIs, show a more user-friendly value
    if (value.startsWith('web-directory://')) {
      return value.replace('web-directory://', '🌐 ');
    } else if (value.startsWith('safe-directory://')) {
      return value.replace('safe-directory://', '📁 ');
    } else if (value.startsWith('limited-access://')) {
      return value.replace('limited-access://', '⚠️ ');
    } else if (value.startsWith('download://')) {
      return 'Niðurhal í vafra 📥';
    } else {
      return value;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`dir-${label}`}>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={getDisplayValue()}
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
      {apiMode === 'web' && (
        <p className="text-xs text-amber-500">
          Keyrt í vafraham - veldu möppu sem vafri hefur aðgang að (ekki kerfisskrár).
        </p>
      )}
    </div>
  );
}
