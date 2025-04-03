import * as XLSX from 'xlsx';
import * as path from 'path';

declare global {
  interface Window {
    electronAPI?: {
      writeFile: (filepath: string, buffer: Buffer | Uint8Array) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

export interface TimesheetEntry {
  date: string;      // Dagsetning
  hours: number;     // Tímar
  workType: string;  // Vinna
  location: string;  // Hvar
  apartment: string; // íbúð
  other: string;     // Annað
  employee: string;  // Starfsmaður
}

function formatNumber(num: number): string {
  // Convert number to Icelandic format (using comma as decimal separator)
  return num.toString().replace('.', ',');
}

export async function parseTimesheetFile(file: File): Promise<TimesheetEntry[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    console.log("Available sheets:", workbook.SheetNames);

    const monthPattern = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec).*-kop$/i;
    const targetSheet = workbook.SheetNames.find(name => monthPattern.test(name.toLowerCase()));

    if (!targetSheet) {
      throw new Error('Engin mánaðarleg vinnuskýrsla fannst');
    }

    console.log("Selected sheet:", targetSheet);

    const worksheet = workbook.Sheets[targetSheet];
    
    // Convert sheet to raw data to access cells directly
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as string[][];
    
    console.log("Raw data loaded, rows:", rawData.length);
    
    const entries: TimesheetEntry[] = [];
    
    // Find the header row (should be around row 12)
    let headerRowIndex = -1;
    for (let i = 0; i < rawData.length; i++) {
      if (rawData[i] && rawData[i].includes('Dagsetning')) {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      throw new Error('Fyrirsögn fannst ekki í vinnuskýrslu');
    }
    
    console.log("Header row found at index:", headerRowIndex);
    
    // Map column indices based on headers
    const headerRow = rawData[headerRowIndex];
    const getColumnIndex = (header: string): number => {
      const index = headerRow.findIndex(cell => 
        cell && cell.toLowerCase().includes(header.toLowerCase()));
      return index;
    };
    
    const dateColIdx = getColumnIndex('dagsetning');
    const hoursColIdx = getColumnIndex('tímar');
    const workTypeColIdx = getColumnIndex('vinna');
    const locationColIdx = getColumnIndex('hvar');
    const apartmentColIdx = getColumnIndex('íbúð');
    const otherColIdx = getColumnIndex('annað');
    const employeeColIdx = getColumnIndex('starfsmaður');
    
    console.log("Mapped columns:", {
      date: dateColIdx,
      hours: hoursColIdx,
      workType: workTypeColIdx,
      location: locationColIdx,
      apartment: apartmentColIdx,
      other: otherColIdx,
      employee: employeeColIdx
    });
    
    // Process data rows (starting from the next row after header)
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i];
      
      // Skip empty rows
      if (!row || row.length === 0 || !row.some(cell => cell)) {
        continue;
      }
      
      // Parse hours - convert comma to dot for number parsing
      const hoursStr = row[hoursColIdx] || '0';
      const hours = parseFloat(hoursStr.replace(',', '.')) || 0;
      
      const entry: TimesheetEntry = {
        date: row[dateColIdx] || '',
        hours: hours,
        workType: row[workTypeColIdx] || '',
        location: row[locationColIdx] || '',
        apartment: row[apartmentColIdx] || '',
        other: row[otherColIdx] || '',
        employee: row[employeeColIdx] || ''
      };
      
      // Only add non-empty entries
      if (entry.date || entry.hours || entry.location) {
        entries.push(entry);
      }
    }
    
    console.log("Extracted entries:", entries.length);
    return entries;

  } catch (error) {
    console.error('Error parsing timesheet file:', error);
    throw new Error(`Villa við lestur á vinnuskýrslu: ${error.message || 'Óþekkt villa'}`);
  }
}

function groupEntriesByLocation(entries: TimesheetEntry[]): Record<string, TimesheetEntry[]> {
  return entries.reduce((groups, entry) => {
    // Use location (hvar) and apartment (íbúð) fields for grouping
    const key = `${entry.location}-${entry.apartment}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(entry);
    return groups;
  }, {} as Record<string, TimesheetEntry[]>);
}

function createInvoiceData(entries: TimesheetEntry[]): (string | number)[][] {
  // Initialize with 15 empty rows of 4 columns each
  const data: (string | number)[][] = Array(15).fill(null).map(() => Array(4).fill(''));
  
  // Set headers in row 3 (index 2)
  data[2] = ['Dagsetning:', 'Tímar:', 'Vinnuliður:', 'Starfsmaður:'];
  
  // Set location headers in row 11 (index 10)
  data[10] = ['Vinnustaður:', 'Íbúð:', 'Annað:', ''];

  if (entries.length > 0) {
    // Map location data starting at row 12 (index 11)
    data[11] = [
      entries[0].location,
      entries[0].apartment,
      entries[0].other,
      ''
    ];

    // Map entries starting from row 4 (index 3)
    entries.forEach((entry, index) => {
      if (index < 7) { // Limit to 7 entries per invoice
        const rowIndex = index + 3; // Start at row 4
        data[rowIndex] = [
          entry.date,                // Date in A4+
          formatNumber(entry.hours), // Hours in B4+ with comma decimal
          entry.workType,            // Work type in C4+
          entry.employee             // Employee in D4+
        ];
      }
    });
  }

  return data;
}

function createSafeSheetName(location: string, apartment: string): string {
  // Clean and normalize the location and apartment strings
  const cleanLocation = location
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-zA-Z0-9\s]/g, "");

  const cleanApartment = apartment
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "");

  // Combine location and apartment with comma
  return `${cleanLocation}, ${cleanApartment}`.substring(0, 31);
}

// A simple fallback join function (using OS-specific separator if needed)
function safeJoin(...parts: string[]): string {
  if (typeof path.join === 'function') {
    return path.join(...parts);
  }
  // Fallback: ensure there is a single slash between parts
  return parts.map((part, idx) => {
    if (idx === 0) return part.replace(/[\\/]+$/, '');
    return part.replace(/^[\\/]+/, '').replace(/[\\/]+$/, '');
  }).join('/');
}

// Helper function to check if a path is absolute
function isAbsolutePath(filePath: string): boolean {
  return filePath.startsWith('/') || filePath.match(/^[a-zA-Z]:\\/)!== null;
}

export async function generateInvoices(
  timesheetEntries: TimesheetEntry[],
  outputFile: File,
  outputDirectory: string
): Promise<number> {
  try {
    // Read the template file
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

    // For browser environment (if electronAPI is not available)
    if (!window.electronAPI) {
      console.log("Running in browser environment, skipping file write");
      return invoiceCount;
    }

    // Create a valid filename with the current date
    const filename = `Invoices_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Handle path creation
    let filePath = filename;
    if (outputDirectory) {
      // Check if outputDirectory is an absolute path
      if (outputDirectory.match(/^([A-Za-z]:)?[\\/]/)) {
        // If absolute, use as is
        filePath = outputDirectory.replace(/[\\/]+$/, '') + '\\' + filename;
      } else {
        // If relative, treat as subdirectory of Documents
        filePath = `C:\\Users\\Fanna\\Documents\\${outputDirectory}\\${filename}`.replace(/\\+/g, '\\');
      }
    }
    
    console.log("Saving file to:", filePath);
    
    const result = await window.electronAPI.writeFile(
      filePath,
      new Uint8Array(wbout)
    );

    if (!result.success) {
      throw new Error(result.error || 'Villa kom upp við að vista skjalið');
    }

    return invoiceCount;
  } catch (error) {
    console.error('Error generating invoices:', error);
    throw new Error(error.message || 'Villa við að búa til reikninga');
  }
}
