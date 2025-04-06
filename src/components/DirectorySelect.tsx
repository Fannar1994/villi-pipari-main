
import React, { useState } from 'react';
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

  // Enhanced directory selection with multiple fallbacks and better error handling
  const handleButtonClick = async () => {
    try {
      setIsSelecting(true);
      
      // First try the main API
      if (typeof window !== 'undefined' && window.electron && window.electron.selectDirectory) {
        console.log('Using primary Electron API to select directory');
        try {
          const result = await window.electron.selectDirectory();
          if (result) {
            onChange(result);
            console.log('Directory selected successfully:', result);
            setIsSelecting(false);
            return;
          }
        } catch (primaryError) {
          console.error('Error using primary API:', primaryError);
        }
      }
      
      // If that fails, try the backup API
      if (typeof window !== 'undefined' && window.electronBackupAPI) {
        console.log('Using backup Electron API to select directory');
        try {
          const result = await window.electronBackupAPI.selectDirectory();
          if (result) {
            onChange(result);
            console.log('Directory selected successfully via backup API:', result);
            setIsSelecting(false);
            return;
          }
        } catch (backupError) {
          console.error('Error using backup API:', backupError);
        }
      }
      
      // If all API attempts fail, show error and provide fallback
      console.log('All API attempts failed, using fallback path');
      toast({
        title: "Villa",
        description: "Ekki náðist að opna möppuval - notaður sjálfgefinn slóð",
        variant: "destructive",
      });
      
      // Use fallback path for testing/demo purposes
      onChange('C:/Users/User/Documents');
      
    } catch (error) {
      console.error("Error selecting directory:", error);
      toast({
        title: "Villa",
        description: "Villa kom upp við möppuval",
        variant: "destructive",
      });
      // Still provide a fallback path so the app doesn't completely break
      onChange('C:/Users/User/Documents');
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
          variant="default"
          onClick={handleButtonClick}
          disabled={disabled || isSelecting}
          className="whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {icon}
          {isSelecting ? 'Velur...' : 'Velja möppu'}
        </Button>
      </div>
    </div>
  );
}
