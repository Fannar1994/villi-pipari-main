
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
      // Check if we're running in Electron with the required API
      if (typeof window !== 'undefined' && window.electron && window.electron.selectDirectory) {
        // Use Electron's native dialog
        const result = await window.electron.selectDirectory();
        if (result) {
          onChange(result);
        }
      } else {
        // Fallback for web version (demo mode)
        console.log("Electron API not available, using demo path");
        onChange('C:/Users/User/Documents');
      }
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
          className="flex-1 bg-white"
          id={`dir-${label}`}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={disabled}
          className={cn(
            "whitespace-nowrap",
            value ? "border-blue-500 text-blue-600" : ""
          )}
        >
          {icon}
          Velja möppu
        </Button>
      </div>
    </div>
  );
}
