
import React from 'react';

interface DebugConsoleProps {
  debugInfo: string;
}

export function DebugConsole({ debugInfo }: DebugConsoleProps) {
  return (
    <>
      <div className="text-xs whitespace-pre-wrap bg-gray-800 p-2 rounded">
        <p className="font-mono">Debug commands for DevTools console:</p>
        <code>window.electron</code> - Check main API<br/>
        <code>window.electronBackupAPI</code> - Check backup API<br/>
        <code>window.electron = window.electronBackupAPI</code> - Restore from backup
      </div>
      
      {debugInfo && (
        <div className="text-xs whitespace-pre-wrap bg-gray-800 p-2 rounded">
          <p className="font-mono">API Debug Info:</p>
          {debugInfo}
        </div>
      )}
    </>
  );
}
