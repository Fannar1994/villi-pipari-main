
import React from 'react';
import { EnvironmentInfo } from '@/lib/electron/environmentInfo';

interface EnvironmentDisplayProps {
  envInfo: EnvironmentInfo;
}

export function EnvironmentDisplay({ envInfo }: EnvironmentDisplayProps) {
  return (
    <div className="space-y-1 text-xs">
      <p className="font-semibold">Environment:</p>
      <div>User Agent: {envInfo.userAgent}</div>
      <div>Platform: {envInfo.platform}</div>
      <div>Renderer: {envInfo.renderer}</div>
      <div>Node: {envInfo.node}</div>
      <div>Chrome: {envInfo.chrome}</div>
      <div>Electron: {envInfo.electron}</div>
    </div>
  );
}
