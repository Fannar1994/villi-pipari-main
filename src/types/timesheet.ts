
export interface TimesheetEntry {
  date: string;      // Dagsetning
  hours: number;     // Tímar
  workType: string;  // Vinna
  location: string;  // Hvar
  apartment: string; // íbúð
  other: string;     // Annað
  employee: string;  // Starfsmaður
}

export interface SummaryEntry {
  date: string;
  employee: string;
  totalHours: number;
  isHoliday: boolean;
}

// New interface to track hours by location
export interface LocationHours {
  location: string;
  apartment: string;
  hours: number;
}

// Enhanced employee summary with location breakdown
export interface EmployeeSummary {
  employee: string;
  totalHours: number;
  locationBreakdown: LocationHours[];
}
