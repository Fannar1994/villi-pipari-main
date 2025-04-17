
/**
 * Utilities for interacting with the Electron API
 */

/**
 * Checks if the Electron APIs are available and working
 */
export function isElectronAvailable(): boolean {
  try {
    // More robust check for Electron environment
    if (typeof window === 'undefined') return false;
    if (typeof window.electron === 'undefined') return false;
    if (typeof window.electron.writeFile !== 'function') return false;

    // Check if the isElectron flag is set
    const hasElectronFlag = window.isElectron === true;

    console.log("Electron API check:", {
      hasWindowObject: typeof window !== 'undefined',
      hasElectronObject: typeof window.electron !== 'undefined',
      hasWriteFileFunction: typeof window.electron?.writeFile === 'function',
      hasElectronFlag: hasElectronFlag
    });

    // Return true only if all conditions are met
    return hasElectronFlag && typeof window.electron.writeFile === 'function';
  } catch (err) {
    console.error("Error checking for Electron:", err);
    return false;
  }
}

/**
 * Writes a file to disk using the Electron API
 * @returns Promise with success/failure info
 */
export async function writePdfToDisk(
  filePath: string,
  pdfBlob: ArrayBuffer
): Promise<boolean> {
  // First verify Electron is available
  if (!isElectronAvailable()) {
    console.error("Electron API not available for file writing");
    throw new Error(
      "PDF útflutningur er aðeins í boði í Electron útgáfunni."
    );
  }

  try {
    console.log(`Attempting to save PDF to: ${filePath}`);
    console.log("Electron API status:", {
      electronObject: typeof window.electron,
      writeFileFunction: typeof window.electron.writeFile
    });

    // Call Electron's writeFile API and wait for the result
    const result = await window.electron.writeFile({
      filePath: filePath,
      data: new Uint8Array(pdfBlob),
    });

    // Validate the result
    if (!result || result.error) {
      console.error(`Error writing file: ${result?.error || "Unknown error"}`);
      throw new Error(result?.error || "Villa við skráarskrifun");
    }

    // Verify the file exists after writing
    try {
      const fileExists = await window.electron.fileExists(filePath);
      if (!fileExists) {
        console.error(`File was not found after writing: ${filePath}`);
        throw new Error(`Skrá fannst ekki eftir vistun: ${filePath}`);
      }
    } catch (verifyError) {
      console.error("Error verifying file exists:", verifyError);
      // Continue even if verification fails - the write might have succeeded
    }

    console.log(`PDF successfully saved to: ${filePath}`);
    return true;
  } catch (error: any) {
    console.error("Failed to write PDF file:", error);
    throw new Error(
      `Villa við að vista skrá: ${
        error instanceof Error ? error.message : "Óþekkt villa"
      }`
    );
  }
}

/**
 * Verifies that the output directory exists
 */
export function validateOutputDirectory(outputDirectory: string): void {
  if (!outputDirectory || outputDirectory.trim() === "") {
    throw new Error("Úttak mappa verður að vera valin.");
  }
  
  console.log(`Using output directory: ${outputDirectory}`);
}
