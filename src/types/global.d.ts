export {};

declare global {
  interface Window {
    electron: {
      selectDirectory: () => Promise<string | null>;
      writeFile: (options: { filePath: string; data: Buffer }) => Promise<{ success: boolean; error?: string }>;
      fileExists: (filePath: string) => Promise<boolean>;
    };
  }
}
import * as XLSX from 'xlsx';
import { Buffer } from 'buffer';