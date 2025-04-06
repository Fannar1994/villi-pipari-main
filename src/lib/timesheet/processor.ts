import { TimesheetEntry, SummaryEntry, EmployeeSummary, LocationHours } from '@/types/timesheet';
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
 * Creates detailed summary data for all timesheet entries, with location breakdown 
 */
export function createSummaryData(entries: TimesheetEntry[]): SummaryEntry[] {
  // Create a more detailed summary with location information
  const summaryEntries: SummaryEntry[] = [];
  
  // Group entries by date, employee, and location
  entries.forEach(entry => {
    if (!entry.date || !entry.employee) return;
    
    summaryEntries.push({
      date: entry.date,
      employee: entry.employee,
      location: entry.location || '',
      apartment: entry.apartment || '',
      hours: entry.hours,
      isHoliday: isIcelandicHoliday(entry.date)
    });
  });
  
  // Sort by date, then employee, then location
  return summaryEntries.sort((a, b) => {
    // Sort by date first
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) return dateComparison;
    
    // Then by employee
    const employeeComparison = a.employee.localeCompare(b.employee);
    if (employeeComparison !== 0) return employeeComparison;
    
    // Then by location
    return (a.location + a.apartment).localeCompare(b.location + b.apartment);
  });
}

/**
 * Creates employee summaries with location breakdown
 */
export function createEmployeeSummaries(entries: TimesheetEntry[]): EmployeeSummary[] {
  // Group entries by employee first
  const employeeMap = new Map<string, EmployeeSummary>();
  
  entries.forEach(entry => {
    if (!entry.employee) return;
    
    // Initialize employee summary if it doesn't exist
    if (!employeeMap.has(entry.employee)) {
      employeeMap.set(entry.employee, {
        employee: entry.employee,
        totalHours: 0,
        locationBreakdown: []
      });
    }
    
    const employeeSummary = employeeMap.get(entry.employee)!;
    employeeSummary.totalHours += entry.hours;
    
    // Create a location key
    const locationKey = `${entry.location || ''}-${entry.apartment || ''}`;
    
    // Find existing location entry or create new one
    let locationEntry = employeeSummary.locationBreakdown.find(
      lb => `${lb.location}-${lb.apartment}` === locationKey
    );
    
    if (!locationEntry) {
      locationEntry = {
        location: entry.location || '',
        apartment: entry.apartment || '',
        hours: 0
      };
      employeeSummary.locationBreakdown.push(locationEntry);
    }
    
    locationEntry.hours += entry.hours;
  });
  
  // Sort by employee name
  return Array.from(employeeMap.values())
    .sort((a, b) => a.employee.localeCompare(b.employee));
}

/**
 * Creates formatted summary sheet data with styling information
 */
export function createSummarySheetData(entries: TimesheetEntry[]): {
  data: (string | number)[][];
  styles: { [cell: string]: { font: { color: string } } };
} {
  const summaryEntries = createSummaryData(entries);
  const employeeSummaries = createEmployeeSummaries(entries);
  
  // Create headers
  const data: (string | number)[][] = [
    ['Samantekt'], // Title
    [], // Empty row
    ['Dagsetning', 'Starfsmaður', 'Staðsetning', 'Tímar'], // Updated headers to include location
  ];
  
  // Styling information for cells
  const styles: { [cell: string]: { font: { color: string } } } = {};
  
  // Track the current date and employee to add separators
  let currentDate = '';
  let currentEmployee = '';
  
  // Add data rows
  summaryEntries.forEach((entry, index) => {
    const rowIndex = index + 3; // Start after headers
    
    // Format location display
    const locationDisplay = entry.apartment 
      ? `${entry.location}, ${entry.apartment}`
      : entry.location;
    
    // Only show date and employee when they change
    const dateToShow = currentDate !== entry.date ? formatDateIcelandic(entry.date) : '';
    const employeeToShow = currentDate !== entry.date || currentEmployee !== entry.employee ? entry.employee : '';
    
    data[rowIndex] = [
      dateToShow,
      employeeToShow,
      locationDisplay,
      formatNumber(entry.hours)
    ];
    
    // Mark holidays in red
    if (entry.isHoliday && dateToShow) {
      styles[`A${rowIndex + 1}`] = { font: { color: 'FF0000' } }; // Red font for date
    }
    
    // Update tracking variables
    currentDate = entry.date;
    currentEmployee = entry.employee;
  });
  
  // Calculate the next row for employee summary section
  const nextRowIndex = data.length + 2; // Add 2 more empty rows
  
  // Add two empty rows as separator
  data.push([]);
  data.push([]);
  
  // Add employee summary section headers
  data.push(['Samantekt per starfsmann']);
  data.push(['Starfsmaður', 'Heildar tímar', 'Staðsetning', 'Tímar']);
  
  // Add employee summaries
  let currentRow = nextRowIndex + 2; // Start after the headers
  
  employeeSummaries.forEach(empSummary => {
    // Add the employee row with total hours
    data.push([empSummary.employee, formatNumber(empSummary.totalHours), '', '']);
    currentRow++;
    
    // Add breakdown by location
    empSummary.locationBreakdown.forEach((location, i) => {
      // Skip empty locations
      if (!location.location) return;
      
      const locationDisplay = location.apartment 
        ? `${location.location}, ${location.apartment}`
        : location.location;
        
      data.push(['', '', locationDisplay, formatNumber(location.hours)]);
      currentRow++;
    });
    
    // Add an empty row after each employee for better readability
    data.push([]);
    currentRow++;
  });
  
  return { data, styles };
}
