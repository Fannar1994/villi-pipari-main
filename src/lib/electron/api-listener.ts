/**
 * Simple API listener - Monitors for API availability
 */

// Keep track of whether we're already monitoring
let isMonitoring = false;

/**
 * Start monitoring for API availability - simplified version
 */
export function startApiMonitor(): void {
  if (isMonitoring) return;
  
  console.log('🔍 Starting simplified API monitor');
  isMonitoring = true;
  
  // Set up interval to check API availability
  const checkInterval = setInterval(() => {
    // Simple check for API
    const available = !!(
      window.electron && 
      typeof window.electron.writeFile === 'function' && 
      typeof window.electron.selectDirectory === 'function'
    );
    
    if (available) {
      console.log('✅ API is available, stopping monitor');
      clearInterval(checkInterval);
      isMonitoring = false;
    } else {
      // Try backup API
      if (window.electronBackupAPI) {
        console.log('🔄 Restoring API from backup');
        window.electron = window.electronBackupAPI;
        
        // Stop monitoring if successful
        if (window.electron) {
          clearInterval(checkInterval);
          isMonitoring = false;
        }
      }
    }
  }, 3000); // Check every 3 seconds
}
