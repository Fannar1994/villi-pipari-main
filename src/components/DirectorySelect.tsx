
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { selectDirectory } from '@/lib/electron/fileSystem'; // Import the function directly

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

  const handleButtonClick = async () => {
    try {
      setIsSelecting(true);
      console.log('Directory selection button clicked');
      
      // Use the selectDirectory function directly from our fileSystem module
      const result = await selectDirectory();
      console.log('Directory selection result:', result);
      
      if (result) {
        onChange(result);
        console.log('Directory selected successfully:', result);
        toast({
          title: "Mappa valin",
          description: `Mappa: ${result}`,
        });
      } else {
        console.warn('No directory selected or dialog was cancelled');
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
          title={value} // Show full path on hover
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
