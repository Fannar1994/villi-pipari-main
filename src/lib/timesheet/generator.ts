
import * as XLSX from 'xlsx';
import { TimesheetEntry } from '@/types/timesheet';
import { createSafeSheetName } from '../utils/formatters';
import { groupEntriesByLocation, createInvoiceData } from './processor';

/**
 * Generates Excel invoices from timesheet entries
 */
export async function generateInvoices(
  timesheetEntries: TimesheetEntry[],
  templateFile: File | null,
  outputDirectory: string
): Promise<number> {
  try {
    // Create a new workbook or use the template if provided
    let outputWorkbook;
    
    if (templateFile) {
      // Use the provided template file
      const templateArrayBuffer = await templateFile.arrayBuffer();
      outputWorkbook = XLSX.read(templateArrayBuffer, { type: 'array' });
    } else {
      // Create a new workbook from scratch
      outputWorkbook = XLSX.utils.book_new();
    }
    
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

    // Check if we're in an Electron environment with the required API
    if (typeof window === 'undefined' || !window.electron || !window.electron.writeFile) {
      console.log("Running in browser environment or electron API not available, skipping file write");
      // For browser demo, offer file download
      if (typeof document !== 'undefined') {
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoices_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      return invoiceCount;
    }

    // Create a valid filename with the current date
    const filename = `Invoices_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Ensure outputDirectory is handled correctly
    console.log("Output directory:", outputDirectory);
    // Use string concatenation instead of path.join which may not be available in browser
    const filePath = outputDirectory.endsWith('/') || outputDirectory.endsWith('\\') 
      ? outputDirectory + filename
      : outputDirectory + '/' + filename;
    
    console.log("Saving file to:", filePath);
    
    try {
      // Use the window.electron API for file operations
      const result = await window.electron.writeFile({
        filePath: filePath,
        data: new Uint8Array(wbout)
      });

      if (!result.success) {
        throw new Error(result.error || 'Villa kom upp við að vista skjalið');
      }
    } catch (error) {
      console.error("Error while using Electron API:", error);
      throw new Error('Villa við að vista skrá: ' + (error.message || 'Óþekkt villa'));
    }

    return invoiceCount;
  } catch (error) {
    console.error('Error generating invoices:', error);
    throw new Error(error.message || 'Villa við að búa til reikninga');
  }
}
