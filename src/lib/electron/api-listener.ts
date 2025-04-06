
// Simple API availability check
export function startApiMonitor(): void {
  const api = window.electron;
  
  if (api) {
    console.log('API detected');
  } else {
    console.log('API not detected');
  }
}
