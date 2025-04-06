
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
  location?: string; // Added location field
}

// Added interface for font style to fix TypeScript errors
export interface FontStyle {
  color: string;
  bold?: boolean;
}
