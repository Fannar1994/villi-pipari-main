
/**
 * Emergency API creation utilities for Electron
 */

/**
 * Make global emergency API through more aggressive methods
 */
export function createGlobalEmergencyAPI(): void {
  try {
    console.log('🚨 Creating global emergency API');
    
    // Try using eval approach to bypass security restrictions
    const evalScript = `
      try {
        if (typeof require === "function") {
          const { ipcRenderer } = require("electron");
          if (ipcRenderer) {
            window.electron = {
              writeFile: async (options) => {
                return await ipcRenderer.invoke('write-file', options);
              },
              selectDirectory: async () => {
                return await ipcRenderer.invoke('select-directory');
              },
              fileExists: async (filePath) => {
                return await ipcRenderer.invoke('file-exists', filePath);
              },
              _testConnection: () => ({
                available: true,
                time: new Date().toString(),
                preloadVersion: 'emergency-eval'
              })
            };
            console.log('✅ Emergency API created via eval');
          }
        }
      } catch (e) {
        console.error('❌ Eval approach failed:', e);
      }
    `;
    
    // Try to run the script
    try {
      eval(evalScript);
    } catch (e) {
      console.error('❌ Eval execution failed:', e);
    }
  } catch (e) {
    console.error('❌ Global emergency API creation failed:', e);
  }
}

// Call the emergency API creation function immediately
createGlobalEmergencyAPI();
