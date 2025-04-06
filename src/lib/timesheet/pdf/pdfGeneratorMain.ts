
import { TimesheetEntry } from '@/types/timesheet';
import { generateSummaryPdf } from './summaryPdfGenerator';
import { generateLocationPdf } from './locationPdfGenerator';
import { 
  validatePdfPrerequisites, 
  prepareEntriesForPdfGeneration,
  getCurrentDateString,
  isElectronFileApiAvailable,
  checkElectronConnection,
  getBestAvailableApi
} from './pdfUtils';
import { toast } from '@/hooks/use-toast';

/**
 * Generates PDF files from timesheet entries
 * Main function that orchestrates all PDF generation process
 * Enhanced with better error handling and API recovery
 */
export async function generatePdfFiles(
  timesheetEntries: TimesheetEntry[],
  outputDirectory: string
): Promise<number> {
  try {
    console.log("Starting PDF generation with", timesheetEntries.length, "entries");
    console.log("Output directory:", outputDirectory);
    
    // Check if we're running in browser environment
    if (typeof window === 'undefined') {
      console.error('PDF generation requires browser environment');
      throw new Error('PDF generation requires browser environment');
    }
    
    // Try to restore API from backup if needed - aggressive approach
    if (!window.electron && window.electronBackupAPI) {
      try {
        console.log("Restoring window.electron from backup API");
        window.electron = window.electronBackupAPI;
        console.log("API restored:", !!window.electron);
        
        // Test the API after restoration
        if (window.electron && window.electron._testConnection) {
          const testResult = window.electron._testConnection();
          console.log("API test after restoration:", testResult);
        }
      } catch (e) {
        console.error("Error restoring API:", e);
      }
    }
    
    // Perform detailed API check
    const isAPIConnected = await checkElectronConnection();
    console.log("Detailed API check result:", isAPIConnected);
    
    // Check if any viable API is available (primary or backup)
    if (!isElectronFileApiAvailable()) {
      console.error("No viable Electron API available for file operations");
      toast({
        title: "Villa",
        description: "Ekki er hægt að búa til PDF - vantar skráarkerfisvirkni. Endurræstu forritið.",
        variant: "destructive",
      });
      throw new Error('Ekki er hægt að búa til PDF - vantar skráarkerfisvirkni. Endurræstu forritið.');
    }
    
    // Check if we have valid entries
    if (!validatePdfPrerequisites(timesheetEntries)) {
      toast({
        title: "Villa",
        description: "Engar færslur fundust til að búa til PDF skjöl",
        variant: "destructive",
      });
      throw new Error('Engar færslur fundust til að búa til PDF skjöl');
    }
    
    // Get the API to use (either primary or backup)
    const api = getBestAvailableApi();
    if (!api) {
      console.error("Failed to get a viable API even after all recovery attempts");
      toast({
        title: "Villa",
        description: "API aðgangur ekki til staðar. Endurræstu forritið.",
        variant: "destructive",
      });
      throw new Error('API aðgangur ekki til staðar. Endurræstu forritið.');
    }
    
    // Group entries by location and apartment
    const groupedEntries = prepareEntriesForPdfGeneration(timesheetEntries);
    console.log("Grouped entries into", Object.keys(groupedEntries).length, "location groups");
    
    // Create toast to show processing status
    toast({
      title: "Vinnur að PDF gerð",
      description: `Vinnur með ${Object.keys(groupedEntries).length} staðsetningar`,
    });
    
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
