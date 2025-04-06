
// This ensures TypeScript recognizes the Electron API on the window object
interface Window {
  electron?: {
    writeFile: (options: { filePath: string; data: Uint8Array }) => Promise<{ success: boolean; error?: string }>;
    selectDirectory: () => Promise<string | null>;
    fileExists: (filePath: string) => Promise<boolean>;
    _testConnection: () => { available: boolean; time: string; preloadVersion?: string };  // Required now, not optional
  };
  // Backup API access - for production use
  electronBackupAPI?: {
    writeFile: (options: { filePath: string; data: Uint8Array }) => Promise<{ success: boolean; error?: string }>;
    selectDirectory: () => Promise<string | null>;
    fileExists: (filePath: string) => Promise<boolean>;
    _testConnection: () => { available: boolean; time: string; preloadVersion?: string };  // Required now, not optional
  };
}

// Support for testing direct access to Electron from the global context
declare global {
  var electronBackupAPI: Window['electron'];
}
