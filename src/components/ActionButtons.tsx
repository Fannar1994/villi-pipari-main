
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileOutput, FileText } from 'lucide-react';

interface ActionButtonsProps {
  onGenerateInvoices: () => void;
  onGeneratePdfs: (() => void) | null;
  isProcessing: boolean;
}

export function ActionButtons({
  onGenerateInvoices,
  onGeneratePdfs,
  isProcessing
}: ActionButtonsProps) {
  return (
    <div className="p-6 pt-0 flex flex-col gap-4">
      <Button 
        onClick={onGenerateInvoices}
        disabled={isProcessing}
        className="w-full"
      >
        <FileText className="mr-2 h-5 w-5" />
        Búa til reikninga
      </Button>
      
      {onGeneratePdfs && (
        <Button 
          onClick={onGeneratePdfs}
          disabled={isProcessing}
          className="w-full"
        >
          <FileOutput className="mr-2 h-5 w-5" />
          Búa til PDF skjöl
        </Button>
      )}
    </div>
  );
}
