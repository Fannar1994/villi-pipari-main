
import React from 'react';
import { EnvironmentInfo, getEnvironmentInfo } from '@/lib/electron/environmentInfo';

export function DebugInfo() {
  const envInfo: EnvironmentInfo = getEnvironmentInfo();

  return (
    <div className="space-y-3">
      <div className="space-y-1 text-xs">
        <p className="font-semibold">Environment:</p>
        <div>User Agent: {envInfo.userAgent}</div>
        <div>Platform: {envInfo.platform}</div>
        <div>Renderer: {envInfo.renderer}</div>
        <div>Node: {envInfo.node}</div>
        <div>Chrome: {envInfo.chrome}</div>
        <div>Electron: {envInfo.electron}</div>
      </div>
      
      <div className="text-xs whitespace-pre-wrap bg-gray-800 p-2 rounded">
        <p className="font-mono">Debug commands for DevTools console:</p>
        <code>window.electron</code> - Check main API<br/>
        <code>window.electronBackupAPI</code> - Check backup API<br/>
        <code>window.electron = window.electronBackupAPI</code> - Restore from backup
      </div>
    </div>
  );
}
