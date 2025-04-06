
import { TimesheetEntry } from '@/types/timesheet';
import { formatDateIcelandic } from '../utils/dateUtils';
import { formatNumber } from '../utils/formatters';

/**
 * Creates invoice data structure from timesheet entries
 * Now adding a total formula at D10 to be referenced by the summary sheet
 */
export function createInvoiceData(entries: TimesheetEntry[]): (string | number | { t: 'n', f: string })[][] {
  // Initialize with 15 empty rows of 4 columns each
  const data: (string | number | { t: 'n', f: string })[][] = Array(15).fill(null).map(() => Array(4).fill(''));
  
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
    
    // Add a total formula in cell D10 (index 9, 3) to sum all hours
    // This will be referenced by the summary sheet
    data[9][3] = { 
      t: 'n',  // Type: numeric
      f: 'SUM(B4:B10)' // Sum hours in column B from rows 4 to 10
    };
  }

  return data;
}
