
import { TimesheetEntry } from '@/types/timesheet';
import { generateSummaryPdf } from './summaryPdfGenerator';
import { generateLocationPdf } from './locationPdfGenerator';
import { 
  validatePdfPrerequisites, 
  prepareEntriesForPdfGeneration,
  getCurrentDateString,
  isElectronFileApiAvailable,
  checkElectronConnection
} from './pdfUtils';

/**
 * Generates PDF files from timesheet entries
 * Main function that orchestrates all PDF generation process
 */
export async function generatePdfFiles(
  timesheetEntries: TimesheetEntry[],
  outputDirectory: string
): Promise<number> {
  try {
    console.log("Starting PDF generation with", timesheetEntries.length, "entries");
    console.log("Output directory:", outputDirectory);
    
    // Check if we're running in Electron environment
    if (typeof window === 'undefined') {
      console.error('PDF generation requires browser environment');
      throw new Error('PDF generation requires browser environment');
    }
    
    console.log("Window object exists:", !!window);
    console.log("Window electron property exists:", 'electron' in window);
    
    // Try to access the Electron API directly to check if it's defined
    const electronApiDefined = typeof window.electron !== 'undefined';
    console.log("Electron API defined:", electronApiDefined);
    
    // Direct troubleshooting - make a small PDF in memory and try to save it
    if (electronApiDefined && typeof window.electron.writeFile === 'function') {
      try {
        console.log("DIRECT TEST: Attempting to create and save a simple test PDF");
        // Import jsPDF directly here to avoid issues if it's not loaded elsewhere
        const { jsPDF } = await import('jspdf');
        const testPdf = new jsPDF();
        testPdf.text('Test PDF', 10, 10);
        const testPdfBlob = testPdf.output('arraybuffer');
        const testPath = `${outputDirectory}/test_pdf_${Date.now()}.pdf`;
        console.log("DIRECT TEST: Writing test PDF to:", testPath);
        
        const testResult = await window.electron.writeFile({
          filePath: testPath,
          data: new Uint8Array(testPdfBlob)
        });
        
        console.log("DIRECT TEST: Test PDF result:", testResult);
        if (testResult && testResult.success) {
          console.log("DIRECT TEST: Test PDF creation successful!");
        } else {
          console.error("DIRECT TEST: Test PDF creation failed:", testResult?.error || "Unknown error");
        }
      } catch (e) {
        console.error("DIRECT TEST: Error creating test PDF:", e);
      }
    }
    
    if (electronApiDefined) {
      // List available methods on the electron object
      console.log("Available electron API methods:", Object.keys(window.electron || {}));
      
      // Check specific methods
      console.log("writeFile method exists:", typeof window.electron?.writeFile === 'function');
      console.log("selectDirectory method exists:", typeof window.electron?.selectDirectory === 'function');
      console.log("fileExists method exists:", typeof window.electron?.fileExists === 'function');
    }
    
    // Perform detailed API check
    const isAPIConnected = await checkElectronConnection();
    console.log("Detailed API check result:", isAPIConnected);
    
    // Test if we can actually call one of the methods
    if (electronApiDefined && typeof window.electron.selectDirectory === 'function') {
      try {
        console.log("Attempting to call selectDirectory to test API");
        const testDir = await window.electron.selectDirectory();
        console.log("selectDirectory test result:", testDir);
      } catch (e) {
        console.error("Error calling selectDirectory:", e);
      }
    }
    
    // More verbose check for Electron API
    if ('electron' in window) {
      console.log("Electron object is available in window");
    } else {
      console.error("Electron object is NOT available in window");
      throw new Error('Ekki er hægt að búa til PDF - vantar skráarkerfisvirkni');
    }
    
    // Check if Electron API is available
    if (!isElectronFileApiAvailable()) {
      console.error("Electron file API is not available");
      throw new Error('Ekki er hægt að búa til PDF - vantar skráarkerfisvirkni');
    }
    
    if (!validatePdfPrerequisites(timesheetEntries)) {
      throw new Error('Engar færslur fundust til að búa til PDF skjöl');
    }
    
    // Group entries by location and apartment
    const groupedEntries = prepareEntriesForPdfGeneration(timesheetEntries);
    console.log("Grouped entries into", Object.keys(groupedEntries).length, "location groups");
    
    let pdfCount = 0;
    const currentDate = getCurrentDateString();
    
    // Create a summary PDF first
    const summarySuccess = await generateSummaryPdf(timesheetEntries, outputDirectory, currentDate);
    if (summarySuccess) {
      pdfCount++;
      console.log("Summary PDF generated successfully");
    } else {
      console.warn("Failed to generate summary PDF");
    }
    
    // Create individual invoice-style PDFs for each location
    const usedFilenames = new Map<string, number>();
    
    for (const [key, entries] of Object.entries(groupedEntries)) {
      console.log(`Creating PDF for location group: ${key} with ${entries.length} entries`);
      
      const locationSuccess = await generateLocationPdf(
        entries, 
        outputDirectory, 
        currentDate,
        usedFilenames
      );
      
      if (locationSuccess) {
        pdfCount++;
        console.log(`Location PDF for ${key} generated successfully`);
      } else {
        console.warn(`Failed to generate location PDF for ${key}`);
      }
    }
    
    console.log(`Total PDFs created: ${pdfCount}`);
    return pdfCount;
    
  } catch (error) {
    console.error('Error generating PDFs:', error);
    throw new Error(error instanceof Error ? error.message : 'Villa við að búa til PDF skjöl');
  }
}
