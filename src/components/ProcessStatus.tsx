
import React from 'react';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessStatusProps {
  status: {
    status: 'idle' | 'processing' | 'success' | 'error';
    message: string;
    invoiceCount?: number;
    pdfCount?: number;
  };
}

export function ProcessStatus({ status }: ProcessStatusProps) {
  return (
    <div className="rounded-md p-4 min-h-[100px] flex flex-col items-center justify-center">
      {status.status === 'idle' && (
        <div className="text-center text-gray-500 flex flex-col items-center">
          <Clock className="h-8 w-8 mb-2 text-gray-400" />
          <p>Tilbúinn til að búa til reikninga</p>
        </div>
      )}
      
      {status.status === 'processing' && (
        <div className="text-center text-blue-600 flex flex-col items-center">
          <Loader2 className="h-8 w-8 mb-2 animate-spin" />
          <p>{status.message}</p>
        </div>
      )}
      
      {status.status === 'success' && (
        <div className="text-center text-green-600 flex flex-col items-center">
          <CheckCircle className="h-8 w-8 mb-2" />
          <p>{status.message}</p>
          {status.invoiceCount !== undefined && (
            <p className="font-bold mt-1">
              Fjöldi reikninga: {status.invoiceCount}
            </p>
          )}
          {status.pdfCount !== undefined && (
            <p className="font-bold mt-1">
              Fjöldi PDF skjala: {status.pdfCount}
            </p>
          )}
        </div>
      )}
      
      {status.status === 'error' && (
        <div className="text-center text-red-600 flex flex-col items-center">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p>{status.message}</p>
        </div>
      )}
    </div>
  );
}
