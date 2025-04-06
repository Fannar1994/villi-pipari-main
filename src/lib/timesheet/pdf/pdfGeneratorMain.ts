
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
    
    // Try to restore API from backup if needed
    if (!window.electron && (window as any).electronBackupAPI) {
      try {
        console.log("Restoring window.electron from backup API");
        window.electron = (window as any).electronBackupAPI;
      } catch (e) {
        console.error("Error restoring API:", e);
      }
    }
    
    // Perform detailed API check
    const isAPIConnected = await checkElectronConnection();
    console.log("Detailed API check result:", isAPIConnected);
    
    // Check if Electron API is available
    if (!isElectronFileApiAvailable()) {
      console.error("Electron file API is not available after restoration attempts");
      throw new Error('Ekki er hægt að búa til PDF - vantar skráarkerfisvirkni. Endurræstu forritið.');
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
