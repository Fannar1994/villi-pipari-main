
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  label: string;
  accept?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function FileUpload({
  value,
  onChange,
  label,
  accept,
  icon,
  disabled = false,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`file-${label}`}>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value ? value.name : ''}
          readOnly
          placeholder="Engin skrá valin"
          className="flex-1 bg-secondary"
          id={`file-display-${label}`}
        />
        <Button
          type="button"
          variant="default"
          onClick={handleButtonClick}
          disabled={disabled}
          className="whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {icon}
          Velja skrá
        </Button>
        <Input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          accept={accept}
          id={`file-${label}`}
          disabled={disabled}
          className="hidden"
        />
      </div>
    </div>
  );
}
