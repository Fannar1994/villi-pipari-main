
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
  // In a real application with Electron/Node.js, we would have access to the file system
  // For this web demo, we'll simulate directory selection
  
  const handleButtonClick = () => {
    // In a real app, we'd use something like:
    // const result = await window.electron.showOpenDialog({ properties: ['openDirectory'] });
    // if (!result.canceled) {
    //   onChange(result.filePaths[0]);
    // }
    
    // For the demo, we'll simulate selecting the user's Documents folder
    onChange('C:/Users/User/Documents');
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
