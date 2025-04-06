
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bug, WrenchIcon } from 'lucide-react';

interface DebugToolsProps {
  gatherDebugInfo: () => void;
  attemptEnhancedRepair: () => void;
}

export function DebugTools({ gatherDebugInfo, attemptEnhancedRepair }: DebugToolsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button 
        size="sm" 
        variant="outline" 
        className="text-xs flex-1"
        onClick={gatherDebugInfo}
      >
        <AlertTriangle className="h-3 w-3 mr-1" />
        Gather Debug Info
      </Button>
      
      <Button 
        size="sm" 
        variant="outline" 
        className="text-xs flex-1"
        onClick={attemptEnhancedRepair}
      >
        <Bug className="h-3 w-3 mr-1" />
        Repair API
      </Button>
      
      <Button 
        size="sm" 
        variant="default" 
        className="text-xs w-full bg-yellow-600 hover:bg-yellow-700 mt-1"
        onClick={attemptEnhancedRepair}
      >
        <WrenchIcon className="h-3 w-3 mr-1" />
        Virkja neyðarham (Emergency Mode)
      </Button>
    </div>
  );
}
