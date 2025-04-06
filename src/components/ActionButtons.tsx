
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileCheck, FileText } from 'lucide-react';
import { CardFooter } from '@/components/ui/card';

interface ActionButtonsProps {
  onGenerateInvoices: () => Promise<void>;
  onGeneratePdfs: () => Promise<void>;
  isProcessing: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onGenerateInvoices,
  onGeneratePdfs,
  isProcessing
}) => {
  return (
    <CardFooter className="border-t border-primary bg-card flex flex-col gap-2">
      <div className="flex w-full gap-2">
        <Button 
          onClick={onGenerateInvoices} 
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isProcessing}
        >
          <FileCheck className="mr-2 h-4 w-4" />
          {isProcessing ? 'Vinnur...' : 'Búa til reikninga'}
        </Button>
        <Button 
          onClick={onGeneratePdfs} 
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isProcessing}
        >
          <FileText className="mr-2 h-4 w-4" />
          {isProcessing ? 'Vinnur...' : 'Búa til PDF skjöl'}
        </Button>
      </div>
    </CardFooter>
  );
};
