
import { TimesheetEntry, SummaryEntry } from '@/types/timesheet';
import { isIcelandicHoliday, formatDateIcelandic } from '../utils/dateUtils';

/**
 * Creates summary data for all timesheet entries, grouped by employee and date
 */
export function createSummaryData(entries: TimesheetEntry[]): SummaryEntry[] {
  // Group entries by employee and date
  const summaryMap = new Map<string, SummaryEntry>();
  
  entries.forEach(entry => {
    if (!entry.date || !entry.employee) return;
    
    const key = `${entry.date}-${entry.employee}`;
    const existingEntry = summaryMap.get(key);
    
    if (existingEntry) {
      existingEntry.totalHours += entry.hours;
      // If the location isn't already recorded, add it
      if (!existingEntry.location && entry.location) {
        existingEntry.location = entry.location;
      }
    } else {
      summaryMap.set(key, {
        date: entry.date,
        employee: entry.employee,
        totalHours: entry.hours,
        isHoliday: isIcelandicHoliday(entry.date),
        location: entry.location || '' // Ensure location is always included
      });
    }
  });
  
  // Convert map to array and sort by date and employee
  return Array.from(summaryMap.values()).sort((a, b) => {
    // Sort by date first
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) return dateComparison;
    
    // Then by employee
    return a.employee.localeCompare(b.employee);
  });
}

/**
 * Creates formatted summary sheet data with styling information
 * Uses Excel formulas for automatic calculation of totals
 * Now only shows totals at the bottom, not in individual rows
 */
export function createSummarySheetData(entries: TimesheetEntry[]): {
  data: (string | number | { f: string })[][];
  styles: { [cell: string]: { font: { color: string; bold?: boolean } } };
  merges: { s: { c: number; r: number }; e: { c: number; r: number } }[];
} {
  const summaryEntries = createSummaryData(entries);
  
  // Create headers
  const data: (string | number | { f: string })[][] = [
    ['Samantekt'], // Title
    [], // Empty row
    ['Dagsetning', 'Starfsmaður', 'Tímar', 'Staðsetning'], // Headers with location
  ];
  
  // Styling information for cells
  const styles: { [cell: string]: { font: { color: string; bold?: boolean } } } = {};
  
  // For merging cells
  const merges = [
    // Merge the title row
    { s: { c: 0, r: 0 }, e: { c: 3, r: 0 } }
  ];
  
  // Add data rows - without any calculations in the rows, just raw data
  summaryEntries.forEach((entry, index) => {
    const rowIndex = index + 3; // Start after headers
    
    data[rowIndex] = [
      formatDateIcelandic(entry.date),
      entry.employee,
      entry.totalHours,
      entry.location || '' // Include location information
    ];
    
    // Mark holidays in red
    if (entry.isHoliday) {
      styles[`A${rowIndex + 1}`] = { font: { color: 'FF0000' } }; // Red font for date
    }
  });
  
  // Add a separator row
  const separatorRowIndex = data.length;
  data.push(['', '', '', '']);
  
  // Calculate totals for each employee and add them at the bottom
  const employeeTotals = new Map<string, number>();
  summaryEntries.forEach(entry => {
    const currentTotal = employeeTotals.get(entry.employee) || 0;
    employeeTotals.set(entry.employee, currentTotal + entry.totalHours);
  });
  
  // Add employee subtotals using formulas
  let employeeRowStart = separatorRowIndex + 1;
  employeeTotals.forEach((total, employee) => {
    data.push([
      '',
      `Samtals - ${employee}`,
      { f: `SUMIF(B4:B${separatorRowIndex}, "${employee}", C4:C${separatorRowIndex})` }, // Formula for employee total
      ''
    ]);
    
    styles[`B${employeeRowStart + 1}`] = { font: { color: '000000', bold: true } };
    styles[`C${employeeRowStart + 1}`] = { font: { color: '000000', bold: true } };
    employeeRowStart++;
  });
  
  // Add grand total using formula
  const grandTotalRowIndex = data.length;
  data.push([
    '',
    'HEILDARTALA',
    { f: `SUM(C4:C${separatorRowIndex})` }, // Formula for grand total
    ''
  ]);
  
  // Style for grand total
  styles[`B${grandTotalRowIndex + 1}`] = { font: { color: '000000', bold: true } };
  styles[`C${grandTotalRowIndex + 1}`] = { font: { color: '000000', bold: true } };
  
  return { data, styles, merges };
}
