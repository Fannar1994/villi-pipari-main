
import * as XLSX from 'xlsx';
import { TimesheetEntry } from '@/types/timesheet';
import { createSafeSheetName } from '../utils/formatters';
import { groupEntriesByLocation, createInvoiceData, createSummarySheetData } from './processor';

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
    
    // Add summary sheet
    const { data: summaryData, styles: summaryStyles } = createSummarySheetData(timesheetEntries);
    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Apply styles to the summary worksheet
    if (!summaryWorksheet['!cols']) {
      summaryWorksheet['!cols'] = [
        { wch: 12 }, // Date column width
        { wch: 20 }, // Employee column width
        { wch: 12 }  // Hours column width
      ];
    }
    
    // Apply cell styles for the summary sheet
    for (const [cell, style] of Object.entries(summaryStyles)) {
      if (!summaryWorksheet[cell]) {
        // Skip cells that don't exist
        continue;
      }
      
      // Ensure the cell has a 's' (style) property
      if (!summaryWorksheet[cell].s) {
        summaryWorksheet[cell].s = {};
      }
      
      // Apply the font color
      summaryWorksheet[cell].s = {
        ...summaryWorksheet[cell].s,
        ...style
      };
    }
    
    XLSX.utils.book_append_sheet(outputWorkbook, summaryWorksheet, 'Samantekt');
    
    // Group entries by location and apartment
    const groupedEntries = groupEntriesByLocation(timesheetEntries);
    console.log("Grouped entries:", Object.keys(groupedEntries).length);
    let invoiceCount = 0;

    // Track used sheet names to avoid duplicates
    const usedSheetNames = new Set<string>();

    for (const [key, entries] of Object.entries(groupedEntries)) {
      if (entries.length > 0) {
        // Use the location (hvar) and apartment (íbúð) fields from the first entry
        const firstEntry = entries[0];
        let safeSheetName = createSafeSheetName(
          firstEntry.location,  // This is from the 'hvar' column
          firstEntry.apartment  // This is from the 'íbúð' column
        );
        
        // Check if the sheet name is already used, if so, append a counter
        let counter = 1;
        let originalName = safeSheetName;
        while (usedSheetNames.has(safeSheetName)) {
          // Truncate if needed to ensure name with counter doesn't exceed Excel's 31 character limit
          const truncatedName = originalName.substring(0, 27 - counter.toString().length);
          safeSheetName = `${truncatedName} (${counter})`;
          counter++;
        }
        
        // Add the sheet name to our tracking set
        usedSheetNames.add(safeSheetName);
        
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

    if (invoiceCount === 0 && Object.keys(groupedEntries).length === 0) {
      throw new Error('Engar færslur fundust til að búa til reikninga');
    }

    // Write the workbook to a buffer
    const wbout = XLSX.write(outputWorkbook, { bookType: 'xlsx', type: 'buffer', bookSST: false });

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
    
    // Log the output directory for debugging
    console.log("Output directory:", outputDirectory);
    
    // Normalize the output directory to prevent path issues
    // Remove any trailing slashes for consistency
    const normalizedDir = outputDirectory.replace(/[\/\\]+$/, '');
    
    // Create the full file path without using path.join (which isn't available in browser)
    // Use forward slashes for cross-platform compatibility
    const fullPath = `${normalizedDir}/${filename}`;
    
    console.log("Saving file to:", fullPath);
    
    try {
      // Use the window.electron API for file operations with the full path
      const result = await window.electron.writeFile({
        filePath: fullPath,
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
