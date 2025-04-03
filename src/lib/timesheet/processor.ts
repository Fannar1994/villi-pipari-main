
import { TimesheetEntry } from '@/types/timesheet';
import { formatNumber } from '../utils/formatters';

/**
 * Groups timesheet entries by location and apartment
 */
export function groupEntriesByLocation(entries: TimesheetEntry[]): Record<string, TimesheetEntry[]> {
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

/**
 * Creates invoice data structure from timesheet entries
 */
export function createInvoiceData(entries: TimesheetEntry[]): (string | number)[][] {
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
