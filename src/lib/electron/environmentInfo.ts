
/**
 * Utility functions for getting environment information
 */

export interface EnvironmentInfo {
  userAgent: string;
  platform: string;
  renderer: string;
  node: string;
  chrome: string;
  electron: string;
}

/**
 * Gets detailed information about the current environment
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  const info = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    renderer: 'Unknown',
    node: typeof process !== 'undefined' ? process.versions?.node || 'N/A' : 'N/A',
    chrome: typeof process !== 'undefined' ? process.versions?.chrome || 'N/A' : 'N/A',
    electron: typeof process !== 'undefined' ? process.versions?.electron || 'N/A' : 'N/A',
  };
  
  // Try to get more detailed renderer info
  try {
    if (typeof window !== 'undefined' && window.navigator) {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.indexOf('electron') > -1) {
        info.renderer = 'Electron';
      } else if (ua.indexOf('chrome') > -1) {
        info.renderer = 'Chrome';
      } else if (ua.indexOf('firefox') > -1) {
        info.renderer = 'Firefox';
      } else if (ua.indexOf('safari') > -1) {
        info.renderer = 'Safari';
      }
    }
  } catch (e) {
    console.error('Error getting renderer info:', e);
  }
  
  return info;
}
