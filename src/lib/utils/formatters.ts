
/**
 * Converts a number to Icelandic format (using comma as decimal separator)
 */
export function formatNumber(num: number): string {
  return num.toString().replace('.', ',');
}

/**
 * Creates a safe Excel sheet name from location and apartment
 * Preserves Icelandic characters while ensuring the name is valid for Excel
 * Excel limits sheet names to 31 characters and certain characters are forbidden
 */
export function createSafeSheetName(location: string, apartment: string): string {
  // Clean up the location and apartment strings but preserve Icelandic characters
  // Remove characters that are invalid in Excel sheet names
  const cleanLocation = location
    .trim()
    .replace(/[\[\]\*\?\/\\:]/g, "") // Remove characters not allowed in Excel sheet names
    .replace(/^'|'$/g, "")           // Remove leading/trailing single quotes
    .replace(/^-|^'|-$|'$/g, "");    // Remove leading/trailing hyphens

  const cleanApartment = apartment
    .trim()
    .replace(/[\[\]\*\?\/\\:]/g, "") // Remove characters not allowed in Excel sheet names
    .replace(/^'|'$/g, "")           // Remove leading/trailing single quotes
    .replace(/^-|^'|-$|'$/g, "");    // Remove leading/trailing hyphens

  // Combine location and apartment with comma
  const combinedName = cleanLocation + (cleanApartment ? `, ${cleanApartment}` : '');
  
  // Excel sheet names are limited to 31 characters
  return combinedName.substring(0, 31);
}
