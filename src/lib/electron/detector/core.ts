
/**
 * Ultra-simplified API detection
 */
import { ElectronAPI } from '../types';

export function getElectronAPI(): ElectronAPI | null {
  return window.electron || null;
}

export function isElectronAPIAvailable(): boolean {
  return !!window.electron;
}

export function testConnection(): { available: boolean; details: string } {
  const api = window.electron;
  
  if (!api) {
    return { available: false, details: 'API not available' };
  }
  
  return { available: true, details: 'API available' };
}
