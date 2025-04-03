
export {};

declare global {
  interface Window {
    electron: {
      selectDirectory: () => Promise<string | null>;
      writeFile: (options: { filePath: string; data: Buffer | Uint8Array }) => Promise<{ success: boolean; error?: string }>;
      fileExists: (filePath: string) => Promise<boolean>;
    };
  }
}
