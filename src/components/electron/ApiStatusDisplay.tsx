
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { ApiStatusType } from '@/hooks/useElectronAPI';

interface ApiStatusDisplayProps {
  apiStatus: ApiStatusType;
  isChecking: boolean;
  onRefresh: () => void;
}

export function ApiStatusDisplay({ apiStatus, isChecking, onRefresh }: ApiStatusDisplayProps) {
  return (
    <div className="space-y-3">
      <div>
        <span className="font-semibold">Status: </span>
        <span>{apiStatus.details}</span>
      </div>
      
      <div className="space-y-1">
        <p className="font-semibold">API Methods:</p>
        {Object.entries(apiStatus.methods).map(([method, available]) => (
          <div key={method} className="flex items-center gap-2 text-sm">
            {available ? (
              <CheckCircle className="text-green-500" size={16} />
            ) : (
              <XCircle className="text-red-500" size={16} />
            )}
            <span>{method}</span>
          </div>
        ))}
      </div>
      
      {apiStatus.backupAvailable && (
        <div className="text-sm text-amber-500">
          Backup API is available and can be used
        </div>
      )}
      
      <Button 
        size="sm" 
        onClick={onRefresh} 
        disabled={isChecking}
        className="w-full"
      >
        {isChecking ? (
          <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-1 h-4 w-4" />
        )}
        Refresh Status
      </Button>
    </div>
  );
}
