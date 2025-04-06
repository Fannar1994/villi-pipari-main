
import { TimesheetEntry } from '@/types/timesheet';

/**
 * Groups timesheet entries by location and apartment
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
 * Groups entries by both employee and location for individual PDFs
 */
export function groupEntriesByEmployeeAndLocation(entries: TimesheetEntry[]): Map<string, TimesheetEntry[]> {
  const employeeLocationGroups = new Map<string, TimesheetEntry[]>();
  
  entries.forEach(entry => {
    const key = `${entry.employee}-${entry.location}`;
    if (!employeeLocationGroups.has(key)) {
      employeeLocationGroups.set(key, []);
    }
    employeeLocationGroups.get(key)!.push(entry);
  });
  
  return employeeLocationGroups;
}
