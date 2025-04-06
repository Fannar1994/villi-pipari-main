
// Simplified Electron API type definition
interface Window {
  electron?: {
    writeFile: (options: { filePath: string; data: Uint8Array }) => Promise<{ success: boolean; error?: string }>;
    selectDirectory: () => Promise<string | null>;
    fileExists: (filePath: string) => Promise<boolean>;
    _testConnection?: () => { available: boolean; time: string; preloadVersion?: string };
  };
}
