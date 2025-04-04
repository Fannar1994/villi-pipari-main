
/**
 * Returns true if the given date is an Icelandic public holiday
 */
export function isIcelandicHoliday(date: Date): boolean {
  const holidays = getIcelandicHolidays(date.getFullYear());
  const dateString = formatDate(date);
  return holidays.includes(dateString);
}

/**
 * Returns an array of Icelandic holidays for a given year in DD/MM/YYYY format
 */
export function getIcelandicHolidays(year: number): string[] {
  const holidays: string[] = [];
  
  // Fixed holidays
  holidays.push(formatDate(new Date(year, 0, 1)));   // New Year's Day - 1 January
  holidays.push(formatDate(new Date(year, 11, 25))); // Christmas Day - 25 December
  holidays.push(formatDate(new Date(year, 11, 26))); // Boxing Day - 26 December
  
  // First Day of Summer (First Thursday after 18 April)
  const summerDay = new Date(year, 3, 19); // 19 April
  while (summerDay.getDay() !== 4) { // Find the next Thursday
    summerDay.setDate(summerDay.getDate() + 1);
  }
  holidays.push(formatDate(summerDay));
  
  // National Day
  holidays.push(formatDate(new Date(year, 5, 17))); // 17 June
  
  // Labor Day (First Monday in May)
  const laborDay = new Date(year, 4, 1); // 1 May
  while (laborDay.getDay() !== 1) { // Find the first Monday
    laborDay.setDate(laborDay.getDate() + 1);
  }
  holidays.push(formatDate(laborDay));
  
  // Commerce Day (First Monday in August)
  const commerceDay = new Date(year, 7, 1); // 1 August
  while (commerceDay.getDay() !== 1) { // Find the first Monday
    commerceDay.setDate(commerceDay.getDate() + 1);
  }
  holidays.push(formatDate(commerceDay));
  
  // Easter calculations - Easter Sunday changes each year
  const easterDate = getEasterSunday(year);
  
  // Maundy Thursday (Easter Sunday - 3 days)
  const maundyThursday = new Date(easterDate);
  maundyThursday.setDate(easterDate.getDate() - 3);
  holidays.push(formatDate(maundyThursday));
  
  // Good Friday (Easter Sunday - 2 days)
  const goodFriday = new Date(easterDate);
  goodFriday.setDate(easterDate.getDate() - 2);
  holidays.push(formatDate(goodFriday));
  
  // Easter Sunday
  holidays.push(formatDate(easterDate));
  
  // Easter Monday (Easter Sunday + 1 day)
  const easterMonday = new Date(easterDate);
  easterMonday.setDate(easterDate.getDate() + 1);
  holidays.push(formatDate(easterMonday));
  
  // Ascension Day (Easter Sunday + 39 days)
  const ascensionDay = new Date(easterDate);
  ascensionDay.setDate(easterDate.getDate() + 39);
  holidays.push(formatDate(ascensionDay));
  
  // Whit Sunday (Easter Sunday + 49 days)
  const whitSunday = new Date(easterDate);
  whitSunday.setDate(easterDate.getDate() + 49);
  holidays.push(formatDate(whitSunday));
  
  // Whit Monday (Easter Sunday + 50 days)
  const whitMonday = new Date(easterDate);
  whitMonday.setDate(easterDate.getDate() + 50);
  holidays.push(formatDate(whitMonday));
  
  return holidays;
}

/**
 * Calculate Easter Sunday date using the Meeus/Jones/Butcher algorithm
 */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month, day);
}

/**
 * Format a date as DD/MM/YYYY
 */
export function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Parse a DD/MM/YYYY date string into a Date object
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try to parse DD/MM/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-based in JavaScript
    const year = parseInt(parts[2], 10);
    
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  
  return null;
}
