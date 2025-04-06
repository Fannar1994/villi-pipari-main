
import { TimesheetEntry } from '@/types/timesheet';
import { generateSummaryPdf } from './summaryPdfGenerator';
import { generateLocationPdf } from './locationPdfGenerator';
import { 
  validatePdfPrerequisites, 
  prepareEntriesForPdfGeneration,
  getCurrentDateString
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
      }
    }
    
    console.log(`Total PDFs created: ${pdfCount}`);
    return pdfCount;
    
  } catch (error) {
    console.error('Error generating PDFs:', error);
    throw new Error(error instanceof Error ? error.message : 'Villa við að búa til PDF skjöl');
  }
}
