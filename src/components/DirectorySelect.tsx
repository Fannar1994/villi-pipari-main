
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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
  const handleButtonClick = async () => {
    try {
      // First try the main API
      if (typeof window !== 'undefined' && window.electron && window.electron.selectDirectory) {
        console.log('Using primary Electron API to select directory');
        const result = await window.electron.selectDirectory();
        if (result) {
          onChange(result);
          return;
        }
      }
      
      // If that fails, try the backup API
      if (typeof window !== 'undefined' && (window as any).electronBackupAPI && 
          typeof (window as any).electronBackupAPI.selectDirectory === 'function') {
        console.log('Using backup Electron API to select directory');
        const result = await (window as any).electronBackupAPI.selectDirectory();
        if (result) {
          onChange(result);
          return;
        }
      }
      
      // If all else fails, try to restore API from backup
      if (typeof window !== 'undefined' && (window as any).electronBackupAPI) {
        try {
          console.log('Attempting to restore window.electron from backup API');
          window.electron = (window as any).electronBackupAPI;
          
          if (window.electron && typeof window.electron.selectDirectory === 'function') {
            console.log('Using restored Electron API to select directory');
            const result = await window.electron.selectDirectory();
            if (result) {
              onChange(result);
              return;
            }
          }
        } catch (restoreError) {
          console.error("Error restoring API:", restoreError);
        }
      }
      
      // Fallback for web version (demo mode)
      console.log("Electron API not available, using demo path");
      onChange('C:/Users/User/Documents');
    } catch (error) {
      console.error("Error selecting directory:", error);
      // Still provide a fallback path so the app doesn't completely break
      onChange('C:/Users/User/Documents');
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
          disabled={disabled}
          className="whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {icon}
          Velja möppu
        </Button>
      </div>
    </div>
  );
}
