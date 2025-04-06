
import { TimesheetEntry, SummaryEntry } from '@/types/timesheet';
import { formatNumber } from '../utils/formatters';
import { isIcelandicHoliday, formatDateIcelandic } from '../utils/dateUtils';

/**
 * Groups timesheet entries by location and apartment only
 * This ensures that multiple employees at the same location are grouped together
 */
export function groupEntriesByLocation(entries: TimesheetEntry[]): Record<string, TimesheetEntry[]> {
  return entries.reduce((groups, entry) => {
    // Use ONLY location (hvar) and apartment (íbúð) fields for grouping
    const key = `${entry.location || ''}-${entry.apartment || ''}`;
    
    // Skip entries without a location
    if (!entry.location) return groups;
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(entry);
    return groups;
  }, {} as Record<string, TimesheetEntry[]>);
}

/**
 * Creates invoice data structure from timesheet entries
 */
export function createInvoiceData(entries: TimesheetEntry[]): (string | number)[][] {
  // Initialize with 15 empty rows of 4 columns each
  const data: (string | number)[][] = Array(15).fill(null).map(() => Array(4).fill(''));
  
  // Set the header in A1
  data[0] = ['Fylgiskjal reiknings', '', '', ''];
  
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

    // Sort entries by date to show them in chronological order
    const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));

    // Map entries starting from row 4 (index 3)
    sortedEntries.forEach((entry, index) => {
      if (index < 7) { // Limit to 7 entries per invoice
        const rowIndex = index + 3; // Start at row 4
        data[rowIndex] = [
          formatDateIcelandic(entry.date), // Format date in Icelandic format
          formatNumber(entry.hours),       // Hours with comma decimal
          entry.workType,                  // Work type
          entry.employee                   // Employee
        ];
      }
    });
  }

  return data;
}

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
        location: entry.location || ''
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
 */
export function createSummarySheetData(entries: TimesheetEntry[]): {
  data: (string | number)[][];
  styles: { [cell: string]: { font: { color: string } } };
} {
  const summaryEntries = createSummaryData(entries);
  
  // Create headers
  const data: (string | number)[][] = [
    ['Samantekt'], // Title
    [], // Empty row
    ['Dagsetning', 'Starfsmaður', 'Heildar tímar', 'Staðsetning'], // Headers with location
  ];
  
  // Styling information for cells
  const styles: { [cell: string]: { font: { color: string } } } = {};
  
  // Add data rows
  summaryEntries.forEach((entry, index) => {
    const rowIndex = index + 3; // Start after headers
    
    data[rowIndex] = [
      formatDateIcelandic(entry.date),
      entry.employee,
      formatNumber(entry.totalHours),
      entry.location || '' // Include location information
    ];
    
    // Mark overtime (over 8 hours) in red
    if (entry.totalHours > 8) {
      styles[`C${rowIndex + 1}`] = { font: { color: 'FF0000' } }; // Red font for hours
    }
    
    // Mark holidays in red
    if (entry.isHoliday) {
      styles[`A${rowIndex + 1}`] = { font: { color: 'FF0000' } }; // Red font for date
    }
  });
  
  return { data, styles };
}
