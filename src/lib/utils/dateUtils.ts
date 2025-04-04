
/**
 * Checks if a given date is an Icelandic holiday
 * This is a simplified version that includes major holidays
 */
export function isIcelandicHoliday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-based
  const day = date.getDate();
  
  // Format as MM-DD for easier comparison
  const mmdd = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  
  // Fixed holidays (same date every year)
  const fixedHolidays = [
    '01-01', // New Year's Day
    '05-01', // Labor Day
    '06-17', // Icelandic National Day
    '12-24', // Christmas Eve
    '12-25', // Christmas Day
    '12-26', // Boxing Day
    '12-31', // New Year's Eve
  ];
  
  if (fixedHolidays.includes(mmdd)) {
    return true;
  }
  
  // Easter calculation would be complex, so this is simplified
  // For a full implementation, you would need to calculate Easter Sunday
  // and then derive Good Friday, Easter Monday, etc.
  
  // Simplified check for Maundy Thursday and Good Friday (estimate)
  // This is very approximate and would need a proper Easter algorithm
  if (month === 3 || month === 4) {
    // Rough approximation for Holy Week/Easter period
    // A proper implementation would calculate Easter properly
    // This is just a placeholder
  }
  
  return false;
}

/**
 * Formats a date string into Icelandic format (DD.MM.YYYY)
 */
export function formatDateIcelandic(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // Return original if invalid
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch (error) {
    return dateStr; // Return original on error
  }
}
