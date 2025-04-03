
import * as XLSX from 'xlsx';
import * as path from 'path';
import { TimesheetEntry } from '@/types/timesheet';
import { createSafeSheetName } from '../utils/formatters';
import { groupEntriesByLocation, createInvoiceData } from './processor';

/**
 * Generates Excel invoices from timesheet entries
 */
export async function generateInvoices(
  timesheetEntries: TimesheetEntry[],
  outputFile: File,
  outputDirectory: string
): Promise<number> {
  try {
    // Read the template file (outputFile is actually the template file)
    const outputArrayBuffer = await outputFile.arrayBuffer();
    const outputWorkbook = XLSX.read(outputArrayBuffer, { type: 'array' });
    
    // Group entries by location and apartment
    const groupedEntries = groupEntriesByLocation(timesheetEntries);
    console.log("Grouped entries:", Object.keys(groupedEntries).length);
    let invoiceCount = 0;

    for (const [key, entries] of Object.entries(groupedEntries)) {
      if (entries.length > 0) {
        // Use the location (hvar) and apartment (íbúð) fields from the first entry
        const firstEntry = entries[0];
        const safeSheetName = createSafeSheetName(
          firstEntry.location,  // This is from the 'hvar' column
          firstEntry.apartment  // This is from the 'íbúð' column
        );
        
        console.log(`Creating sheet for: ${safeSheetName}`);
        const worksheetData = createInvoiceData(entries);
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // Set column widths for better formatting
        const cols = [
          { wch: 12 }, // Column A width
          { wch: 8 },  // Column B width
          { wch: 20 }, // Column C width
          { wch: 15 }  // Column D width
        ];
        worksheet['!cols'] = cols;

        XLSX.utils.book_append_sheet(outputWorkbook, worksheet, safeSheetName);
        invoiceCount++;
      }
    }

    if (invoiceCount === 0) {
      throw new Error('Engar færslur fundust til að búa til reikninga');
    }

    // Write the workbook to a buffer
    const wbout = XLSX.write(outputWorkbook, { bookType: 'xlsx', type: 'buffer' });

    // For browser environment (if electron is not available)
    if (!window.electron) {
      console.log("Running in browser environment, skipping file write");
      return invoiceCount;
    }

    // Create a valid filename with the current date
    const filename = `Invoices_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    let filePath: string;
    
    // Handle different path formats
    if (outputDirectory.includes('/') || outputDirectory.includes('\\')) {
      // It's already a path
      filePath = path.join(outputDirectory, filename);
    } else {
      // It's just a folder name, assume Documents folder
      filePath = path.join('C:\\Users\\Fanna\\Documents', outputDirectory, filename);
    }
    
    console.log("Saving file to:", filePath);
    
    // Use the window.electron API for file operations
    const result = await window.electron.writeFile({
      filePath: filePath,
      data: new Uint8Array(wbout)
    });

    if (!result.success) {
      throw new Error(result.error || 'Villa kom upp við að vista skjalið');
    }

    return invoiceCount;
  } catch (error) {
    console.error('Error generating invoices:', error);
    throw new Error(error.message || 'Villa við að búa til reikninga');
  }
}
