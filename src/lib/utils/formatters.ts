
/**
 * Converts a number to Icelandic format (using comma as decimal separator)
 */
export function formatNumber(num: number): string {
  return num.toString().replace('.', ',');
}

/**
 * Creates a safe Excel sheet name from location and apartment
 * Preserves Icelandic characters while ensuring the name is valid for Excel
 */
export function createSafeSheetName(location: string, apartment: string): string {
  // Clean up the location and apartment strings but preserve Icelandic characters
  // Only remove characters that are invalid in Excel sheet names
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
  // Excel sheet names are limited to 31 characters
  return `${cleanLocation}, ${cleanApartment}`.substring(0, 31);
}
