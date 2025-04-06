
import { TimesheetEntry } from '@/types/timesheet';
import { createSummaryData } from './summaryCreator';
import { groupEntriesByEmployeeAndLocation } from './grouping';
import { 
  checkElectronApi, 
  savePdfFile, 
  createSummaryPdf, 
  createEmployeePdf, 
  sanitizeFilename 
} from './pdfUtils';

/**
 * Generates PDF files from timesheet entries
 */
export async function generatePdfFiles(
  timesheetEntries: TimesheetEntry[],
  outputDirectory: string
): Promise<number> {
  try {
    console.log("Starting PDF generation with", timesheetEntries.length, "entries");
    if (!timesheetEntries || timesheetEntries.length === 0) {
      throw new Error('No timesheet entries provided');
    }

    // Ensure the Electron API is available
    if (!checkElectronApi()) {
      throw new Error('Electron API er ekki aðgengileg til að vista skrár.');
    }

    // Ensure output directory ends without slash
    const normalizedDir = outputDirectory.replace(/[\/\\]+$/, '');
    
    // Create a summary PDF
    const summaryData = createSummaryData(timesheetEntries);
    const summaryPdf = createSummaryPdf(summaryData);
    
    // Save the summary PDF
    const summaryFilename = `Summary_${new Date().toISOString().split('T')[0]}.pdf`;
    const summaryPath = `${normalizedDir}/${summaryFilename}`;
    
    const summarySuccess = await savePdfFile(
      summaryPdf, 
      summaryPath, 
      "summary PDF"
    );
    
    if (!summarySuccess) {
      throw new Error('Failed to save summary PDF');
    }
    
    // Create individual invoice PDFs
    let pdfCount = 1; // Start with 1 for the summary PDF

    // Group by both employee and location for individual PDFs
    const employeeLocationGroups = groupEntriesByEmployeeAndLocation(timesheetEntries);
    
    console.log(`Creating ${employeeLocationGroups.size} individual PDFs`);
    
    // Process each employee-location group
    for (const [key, entries] of employeeLocationGroups.entries()) {
      if (entries.length === 0) continue;
      
      const firstEntry = entries[0];
      const employee = firstEntry.employee;
      const location = firstEntry.location;
      
      // Skip if missing critical information
      if (!employee || !location) {
        console.log("Skipping entry without employee or location data");
        continue;
      }
      
      try {
        // Create a PDF for this employee-location combination
        const pdf = createEmployeePdf(
          employee, 
          location, 
          firstEntry.apartment, 
          entries
        );
        
        // Save the PDF
        const sanitizedEmployee = sanitizeFilename(employee);
        const sanitizedLocation = sanitizeFilename(location);
        const filename = `${sanitizedEmployee}_${sanitizedLocation}_${new Date().toISOString().split('T')[0]}.pdf`;
        const filePath = `${normalizedDir}/${filename}`;
        
        const success = await savePdfFile(
          pdf, 
          filePath, 
          `PDF for ${employee} at ${location}`
        );
        
        if (success) {
          pdfCount++;
        }
      } catch (error) {
        console.error(`Error processing PDF for ${employee} at ${location}:`, error);
        // Continue with other PDFs rather than stopping the whole process
      }
    }
    
    console.log(`Successfully created ${pdfCount} PDF files in total`);
    return pdfCount;
  } catch (error) {
    console.error('Error generating PDFs:', error);
    throw new Error(error instanceof Error ? error.message : 'Error generating PDF files');
  }
}
