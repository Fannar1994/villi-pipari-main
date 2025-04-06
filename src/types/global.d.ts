
// This ensures TypeScript recognizes the Electron API on the window object
interface Window {
  electron?: {
    writeFile: (options: { filePath: string; data: Uint8Array | Buffer }) => Promise<{ 
      success: boolean; 
      error?: string;
      path?: string;
      details?: string;
    }>;
    selectDirectory: () => Promise<string | null>;
    fileExists: (filePath: string) => Promise<boolean>;
  };
}
