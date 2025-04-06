
import { TimesheetEntry } from '@/types/timesheet';

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
