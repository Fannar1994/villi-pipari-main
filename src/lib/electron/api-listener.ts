
export function startApiMonitor(): void {
  console.log('🔍 Starting API monitor');
  
  const checkInterval = setInterval(() => {
    const available = !!(
      window.electron && 
      typeof window.electron.writeFile === 'function' && 
      typeof window.electron.selectDirectory === 'function'
    );
    
    if (available) {
      console.log('✅ API is available');
      clearInterval(checkInterval);
    }
  }, 3000);
}
