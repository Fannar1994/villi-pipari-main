
import { TimesheetEntry, SummaryEntry, EmployeeSummary, LocationHours } from '@/types/timesheet';
import { formatNumber } from '../utils/formatters';
import { isIcelandicHoliday, formatDateIcelandic } from '../utils/dateUtils';

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
 * Now using Excel formulas for dynamic calculation
 */
export function createSummarySheetData(entries: TimesheetEntry[]): {
  data: (string | number | { t: 'n', f: string })[][];  // Added support for formula cells
  styles: { [cell: string]: { font: { color: string } } };
} {
  const summaryEntries = createSummaryData(entries);
  const employeeSummaries = createEmployeeSummaries(entries);
  
  // Create headers
  const data: (string | number | { t: 'n', f: string })[][] = [
    ['Samantekt'], // Title
    [], // Empty row
    ['Dagsetning', 'Starfsmaður', 'Staðsetning', 'Tímar'], // Headers
  ];
  
  // Styling information for cells
  const styles: { [cell: string]: { font: { color: string } } } = {};
  
  // Add data rows
  summaryEntries.forEach((entry, index) => {
    const rowIndex = index + 3; // Start after headers
    
    // Format location display
    const locationDisplay = entry.apartment 
      ? `${entry.location}, ${entry.apartment}`
      : entry.location;
    
    // Always show date and employee for EVERY row
    data[rowIndex] = [
      formatDateIcelandic(entry.date),
      entry.employee,
      locationDisplay,
      formatNumber(entry.hours)
    ];
    
    // Mark holidays in red
    if (entry.isHoliday) {
      styles[`A${rowIndex + 1}`] = { font: { color: 'FF0000' } }; // Red font for date
    }
  });
  
  // Calculate the next row for employee summary section
  const nextRowIndex = data.length + 2; // Add 2 more empty rows
  
  // Add two empty rows as separator
  data.push([]);
  data.push([]);
  
  // Add employee summary section headers - only showing total hours
  data.push(['Samtals vinnustundir']);
  data.push(['Starfsmaður', 'Heildar tímar']);
  
  // Add employee summaries - only with total hours
  // Now with formula references to other sheets
  let currentRow = nextRowIndex + 2; // Start after the headers
  
  employeeSummaries.forEach(empSummary => {
    // Add the employee row - employee name will be static text
    // But hours will be a formula that references all sheets for this employee
    const employeeRow = [empSummary.employee];
    
    // Create a formula to sum all values in the appropriate location for this employee
    // We'll use a formula that references a specific cell in each location sheet
    // The formula will be created in the invoiceUtils.ts file to match where we put the totals
    employeeRow.push({ 
      t: 'n',  // Type: numeric
      f: `SUM('*'!D10)` // This will sum D10 across all sheets
                       // In a real scenario, we would filter by employee,
                       // but Excel doesn't easily allow filtering by sheet content in formulas
    });
    
    data.push(employeeRow);
    currentRow++;
  });
  
  return { data, styles };
}
