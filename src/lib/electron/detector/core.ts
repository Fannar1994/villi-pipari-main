
/**
 * Ultra-simplified API detection
 */
import { ElectronAPI, ConnectionTestResult } from '../types';

export function getElectronAPI(): ElectronAPI | null {
  return window.electron || null;
}

export function isElectronAPIAvailable(): boolean {
  return !!window.electron;
}

export function testConnection(): ConnectionTestResult {
  const api = window.electron;
  
  if (!api) {
    return { available: false, details: 'API not available' };
  }
  
  return { available: true, details: 'API available' };
}
