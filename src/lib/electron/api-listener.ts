
export function startApiMonitor(): void {
  console.log('Starting API monitor');
  
  // Simple one-time check for API availability
  const available = !!(
    window.electron && 
    typeof window.electron.writeFile === 'function' && 
    typeof window.electron.selectDirectory === 'function'
  );
  
  if (available) {
    console.log('API is available');
  } else {
    console.log('API not available');
  }
}
