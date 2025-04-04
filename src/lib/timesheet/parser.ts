
import * as XLSX from 'xlsx';
import { TimesheetEntry } from '@/types/timesheet';

/**
 * Parses an Excel timesheet file and extracts timesheet entries
 */
export async function parseTimesheetFile(file: File): Promise<TimesheetEntry[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    console.log("Available sheets:", workbook.SheetNames);

    // Expanded pattern to include many variations of month names with or without -kop suffix
    // This pattern matches month names in English and Icelandic with various spelling variations
    const monthPattern = /(jan|feb|mar|mars|apr|apríl|may|maí|mai|jun|jún|júní|jul|júl|julý|aug|ágú|ágúst|sep|sept|september|oct|okt|október|nov|nóv|nóvember|dec|des|desember)(?:.*kop)?$/i;
    
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
      if (rawData[i] && Array.isArray(rawData[i]) && rawData[i].some(cell => typeof cell === 'string' && cell.toLowerCase().includes('dagsetning'))) {
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
        cell && typeof cell === 'string' && cell.toLowerCase().includes(header.toLowerCase()));
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
