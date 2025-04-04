
import * as XLSX from 'xlsx';
import { TimesheetEntry } from '@/types/timesheet';
import { isIcelandicHoliday, formatDate, parseDate } from '../utils/icelandicHolidays';

/**
 * Generates a summary sheet from timesheet entries
 */
export function generateSummarySheet(entries: TimesheetEntry[]): XLSX.WorkSheet {
  // Group entries by employee
  const employeeEntries = groupEntriesByEmployee(entries);
  
  // Initialize summary data
  const summaryData: (string | number)[][] = [];
  
  // Add header row
  summaryData.push(['Starfsmaður', 'Heildar tímar', 'Fjöldi daga', 'Meðal tímar á dag']);
  
  // Calculate summary for each employee
  Object.entries(employeeEntries).forEach(([employee, empEntries]) => {
    if (!employee) return; // Skip entries with no employee name
    
    const totalHours = empEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const uniqueDays = new Set(empEntries.map(entry => entry.date)).size;
    const avgHoursPerDay = uniqueDays > 0 ? totalHours / uniqueDays : 0;
    
    summaryData.push([
      employee,
      totalHours,
      uniqueDays,
      avgHoursPerDay
    ]);
  });
  
  // Add a blank row
  summaryData.push([]);
  
  // Add detail section header
  summaryData.push(['Vinnustaður', 'Heildartímar', 'Hlutfall af heild']);
  
  // Group by location
  const locationEntries = groupEntriesByLocation(entries);
  const grandTotal = entries.reduce((sum, entry) => sum + entry.hours, 0);
  
  // Calculate summary for each location
  Object.entries(locationEntries).forEach(([location, locEntries]) => {
    if (!location) return; // Skip entries with no location
    
    const totalHours = locEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const percentage = grandTotal > 0 ? (totalHours / grandTotal) * 100 : 0;
    
    summaryData.push([
      location,
      totalHours,
      `${percentage.toFixed(1)}%`
    ]);
  });
  
  // Add another blank row
  summaryData.push([]);
  
  // Add a third section showing hours by work type
  summaryData.push(['Vinnuliður', 'Heildartímar', 'Hlutfall af heild']);
  
  // Group by work type
  const workTypeEntries = groupEntriesByWorkType(entries);
  
  // Calculate summary for each work type
  Object.entries(workTypeEntries).forEach(([workType, wtEntries]) => {
    if (!workType) return; // Skip entries with no work type
    
    const totalHours = wtEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const percentage = grandTotal > 0 ? (totalHours / grandTotal) * 100 : 0;
    
    summaryData.push([
      workType,
      totalHours,
      `${percentage.toFixed(1)}%`
    ]);
  });
  
  // Create the worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths
  const cols = [
    { wch: 20 }, // Column A - Employee/Location/Work Type
    { wch: 12 }, // Column B - Hours
    { wch: 12 }, // Column C - Days/Percentage
    { wch: 18 }  // Column D - Average
  ];
  worksheet['!cols'] = cols;
  
  return worksheet;
}

/**
 * Groups timesheet entries by employee
 */
function groupEntriesByEmployee(entries: TimesheetEntry[]): Record<string, TimesheetEntry[]> {
  return entries.reduce((groups, entry) => {
    const key = entry.employee || 'Unknown';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(entry);
    return groups;
  }, {} as Record<string, TimesheetEntry[]>);
}

/**
 * Groups timesheet entries by location
 */
function groupEntriesByLocation(entries: TimesheetEntry[]): Record<string, TimesheetEntry[]> {
  return entries.reduce((groups, entry) => {
    const key = entry.location || 'Unknown';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(entry);
    return groups;
  }, {} as Record<string, TimesheetEntry[]>);
}

/**
 * Groups timesheet entries by work type
 */
function groupEntriesByWorkType(entries: TimesheetEntry[]): Record<string, TimesheetEntry[]> {
  return entries.reduce((groups, entry) => {
    const key = entry.workType || 'Unknown';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(entry);
    return groups;
  }, {} as Record<string, TimesheetEntry[]>);
}

/**
 * Generates an employee timesheet template
 */
export function generateEmployeeTemplate(entries: TimesheetEntry[]): XLSX.WorkBook {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Group entries by employee
  const employeeEntries = groupEntriesByEmployee(entries);
  
  // Process each employee
  Object.entries(employeeEntries).forEach(([employee, empEntries]) => {
    if (!employee) return; // Skip entries with no employee name
    
    // Group entries by month
    const monthlyEntries = groupEntriesByMonth(empEntries);
    
    // Process each month
    Object.entries(monthlyEntries).forEach(([month, monthEntries]) => {
      // Create sheet name
      const sheetName = `${employee}-${month}`.substring(0, 31);
      
      // Generate employee timesheet for this month
      const worksheet = createEmployeeMonthlySheet(employee, month, monthEntries);
      
      // Add the sheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
  });
  
  return workbook;
}

/**
 * Groups entries by month (YYYY-MM format)
 */
function groupEntriesByMonth(entries: TimesheetEntry[]): Record<string, TimesheetEntry[]> {
  return entries.reduce((groups, entry) => {
    // Parse the date
    const date = parseDate(entry.date);
    if (!date) return groups;
    
    // Create a month key (YYYY-MM)
    const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(entry);
    return groups;
  }, {} as Record<string, TimesheetEntry[]>);
}

/**
 * Creates a monthly timesheet for an employee
 */
function createEmployeeMonthlySheet(employee: string, monthKey: string, entries: TimesheetEntry[]): XLSX.WorkSheet {
  // Parse month key to get year and month
  const [year, month] = monthKey.split('-').map(num => parseInt(num, 10));
  
  // Get the month name
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[month - 1];
  
  // Create data for the sheet
  const sheetData: (string | number)[][] = [];
  
  // Add title
  sheetData.push(['Tímaskýrsla']);
  sheetData.push([`${monthName}-${year}`]);
  sheetData.push([]);
  
  // Add employee name
  sheetData.push([`Starfsmaður: ${employee}`]);
  sheetData.push([]);
  
  // Add header row
  sheetData.push(['Dagsetning', 'Tímar', 'Vinnustaður', 'Vinnuliður', 'Athugasemdir']);
  
  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    if (!dateA || !dateB) return 0;
    return dateA.getTime() - dateB.getTime();
  });
  
  // Add entries
  sortedEntries.forEach(entry => {
    sheetData.push([
      entry.date,
      entry.hours,
      `${entry.location} ${entry.apartment}`.trim(),
      entry.workType,
      entry.other
    ]);
  });
  
  // Add total row
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  sheetData.push([]);
  sheetData.push(['Samtals tímar:', totalHours]);
  
  // Create the worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  
  // Set column widths
  const cols = [
    { wch: 12 }, // Column A - Date
    { wch: 8 },  // Column B - Hours
    { wch: 20 }, // Column C - Location
    { wch: 20 }, // Column D - Work Type
    { wch: 25 }  // Column E - Notes
  ];
  worksheet['!cols'] = cols;
  
  // Color cells with holidays
  const dateCol = 0; // A column (0-based)
  
  // Start from row 6 (header is at row 5)
  for (let row = 6; row < 6 + sortedEntries.length; row++) {
    const cellAddr = XLSX.utils.encode_cell({ r: row, c: dateCol });
    const dateStr = worksheet[cellAddr]?.v as string;
    const date = parseDate(dateStr);
    
    if (date && isIcelandicHoliday(date)) {
      // Set cell font color to red for holidays
      if (!worksheet[cellAddr].s) worksheet[cellAddr].s = {};
      worksheet[cellAddr].s.font = { color: { rgb: "FF0000" } };
    }
  }
  
  return worksheet;
}
