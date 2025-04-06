
// This ensures TypeScript recognizes the Electron API on the window object
interface Window {
  electron?: {
    writeFile: (options: { 
      filePath: string; 
      data: Uint8Array | Buffer | Array<number> 
    }) => Promise<{ 
      success: boolean; 
      error?: string;
      path?: string;
      details?: string;
      code?: string;
      stack?: string;
    }>;
    selectDirectory: () => Promise<string | null>;
    fileExists: (filePath: string) => Promise<boolean>;
  };
}
