
// Ultra-simplified API check
export function startApiMonitor(): void {
  if (window.electron) {
    console.log('API available');
  } else {
    console.log('API not available');
  }
}
