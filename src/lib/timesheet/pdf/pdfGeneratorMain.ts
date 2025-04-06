
import { TimesheetEntry } from '@/types/timesheet';
import { generateSummaryPdf } from './summaryPdfGenerator';
import { generateLocationPdf } from './locationPdfGenerator';
import { 
  validatePdfPrerequisites, 
  prepareEntriesForPdfGeneration,
  getCurrentDateString,
} from './pdfUtils';
import { toast } from '@/hooks/use-toast';
import { getElectronAPI, isElectronAPIAvailable } from '@/lib/electron/detector';

/**
 * Generates PDF files from timesheet entries
 * Main function that orchestrates all PDF generation process
 * Uses our enhanced API access methods
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
    
    // Check API availability using our enhanced helper
    if (!isElectronAPIAvailable()) {
      console.error("No viable Electron API available for file operations");
      
      // Try to auto-recover API
      console.log("Attempting API auto-recovery...");
      
      // Check for backup API and restore it if available
      if ((window as any).electronBackupAPI) {
        console.log("Found backup API, copying to window.electron");
        window.electron = (window as any).electronBackupAPI;
      }
      
      // Check again after recovery attempt
      const api = getElectronAPI();
      
      if (!api) {
        const errorMsg = 'Ekki er hægt að búa til PDF - vantar skráarkerfisvirkni. Smelltu á "Debug" flipann og "Repair API" hnappinn, eða endurræstu forritið.';
        
        toast({
          title: "Villa",
          description: errorMsg,
          variant: "destructive",
        });
        
        throw new Error(errorMsg);
      } else {
        console.log("API recovery successful!");
      }
    }
    
    // Double-check we have the writeFile method
    const api = getElectronAPI();
    if (!api || typeof api.writeFile !== 'function') {
      throw new Error('Ekki er hægt að búa til PDF - vantar aðgang að skráarkerfi. Vinsamlegast farðu í Debug flipann og smelltu á "Repair API" hnappinn.');
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
