
/**
 * Converts a number to Icelandic format (using comma as decimal separator)
 */
export function formatNumber(num: number): string {
  return num.toString().replace('.', ',');
}

/**
 * Creates a safe Excel sheet name from location and apartment
 */
export function createSafeSheetName(location: string, apartment: string): string {
  // Clean and normalize the location and apartment strings
  const cleanLocation = location
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-zA-Z0-9\s]/g, "");

  const cleanApartment = apartment
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "");

  // Combine location and apartment with comma
  return `${cleanLocation}, ${cleanApartment}`.substring(0, 31);
}
