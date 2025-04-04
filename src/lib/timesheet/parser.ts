
import * as XLSX from 'xlsx';
import { TimesheetEntry } from '@/types/timesheet';

/**
 * Parses an Excel timesheet file and extracts timesheet entries
 */
export async function parseTimesheetFile(file: File): Promise<TimesheetEntry[]> {
  try {
    // Validate file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (!fileType || !['xlsx', 'xls', 'xlsm', 'xlsb', 'csv'].includes(fileType)) {
      throw new Error('Ógilt skráarsnið. Vinsamlegast notaðu Excel skrá (.xlsx, .xls, .xlsm, .xlsb) eða CSV.');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Use more robust options for reading various Excel formats with formula handling
      const workbook = XLSX.read(arrayBuffer, { 
        type: 'array',
        cellDates: true,
        cellNF: true,
        cellStyles: true,
        cellFormula: false,  // Disable formula parsing to avoid issues
        raw: true           // Use raw values instead of formatted values
      });
      
      console.log("Available sheets:", workbook.SheetNames);
      
      if (workbook.SheetNames.length === 0) {
        throw new Error('Engin blöð fundust í skránni');
      }

      // First, try to find a sheet with "kop" or "kóp" variations directly
      const kopPattern = /kop|kóp/i;
      let targetSheet = workbook.SheetNames.find(name => kopPattern.test(name.toLowerCase()));
      
      // If no "kop" sheet found, then try the month pattern with optional kop suffix
      if (!targetSheet) {
        console.log("No direct kop/kóp sheet found, looking for month sheets with kop/kóp suffix");
        
        const monthPattern = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janúar|febrúar|mars|apríl|maí|júní|júlí|ágúst|september|október|nóvember|desember).*(-kop|-kóp|kop|kóp)?$/i;
        targetSheet = workbook.SheetNames.find(name => monthPattern.test(name.toLowerCase()));
      }

      // If no month sheet found, try to find any sheet with relevant headers
      let worksheet;
      let sheetName = targetSheet;
      
      if (!targetSheet) {
        console.log("No month or kop sheet found, looking for timesheet headers in all sheets");
        
        // Try each sheet and check if it has the expected headers
        for (const name of workbook.SheetNames) {
          const sheet = workbook.Sheets[name];
          
          try {
            const sample = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, raw: true, defval: '' }).slice(0, 20) as string[][];
            
            // Check if any row contains timesheet-related headers
            const hasTimesheetHeaders = sample.some(row => {
              if (!row) return false;
              const rowStr = row.join(' ').toLowerCase();
              return rowStr.includes('dagsetning') || 
                    rowStr.includes('tímar') || 
                    rowStr.includes('vinna') || 
                    (rowStr.includes('date') && rowStr.includes('hours'));
            });
            
            if (hasTimesheetHeaders) {
              console.log(`Found sheet with timesheet headers: ${name}`);
              sheetName = name;
              worksheet = sheet;
              break;
            }
          } catch (error) {
            console.warn(`Error checking headers in sheet ${name}:`, error);
            continue; // Try next sheet if this one fails
          }
        }
        
        if (!sheetName) {
          throw new Error('Engin mánaðarleg vinnuskýrsla fannst. Vinsamlegast athugið að skráin innihaldi rétt snið.');
        }
      } else {
        console.log("Selected sheet:", targetSheet);
        worksheet = workbook.Sheets[targetSheet];
      }
      
      if (!worksheet) {
        worksheet = workbook.Sheets[sheetName];
      }
      
      if (!worksheet) {
        throw new Error(`Gat ekki lesið blað: ${sheetName}`);
      }
      
      // Try to determine the range automatically using sheet dimensions
      const range = worksheet['!ref'] || 'A1:Z200';  // Use default range if not found
      console.log("Using range:", range);
      
      // Convert sheet to raw data with more robust error handling
      let rawData: string[][] = [];
      try {
        rawData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          raw: true,
          range: range,
          defval: '',  // Use empty string for empty cells
          blankrows: false // Skip blank rows
        }) as string[][];
      } catch (error) {
        console.error('Error converting sheet to JSON:', error);
        throw new Error('Villa við vinnslu á Excel skjali. Skjalið gæti innihaldið óstudd snið eða formúlur.');
      }
      
      console.log("Raw data loaded, rows:", rawData.length);
      
      if (rawData.length === 0) {
        throw new Error('Engin gögn fundust í vinnuskýrslu');
      }
      
      const entries: TimesheetEntry[] = [];
      
      // Find the header row (scan up to row 30 for flexibility)
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(30, rawData.length); i++) {
        if (!rawData[i]) continue;
        
        const rowStr = rawData[i].join(' ').toLowerCase();
        if (rowStr.includes('dagsetning') || (rowStr.includes('date') && rowStr.includes('hours'))) {
          headerRowIndex = i;
          break;
        }
      }
      
      if (headerRowIndex === -1) {
        console.warn("Header row not found with standard patterns, trying alternative approach");
        
        // Try to find any date-like column and a numeric column as a fallback
        const potentialDateColumns = [];
        const potentialHourColumns = [];
        
        // Check first few rows for date-like and number-like patterns
        for (let colIdx = 0; colIdx < Math.min(10, rawData[0]?.length || 0); colIdx++) {
          let datePatternCount = 0;
          let numberPatternCount = 0;
          
          // Check first 10 rows for patterns
          for (let rowIdx = 0; rowIdx < Math.min(10, rawData.length); rowIdx++) {
            if (!rawData[rowIdx] || !rawData[rowIdx][colIdx]) continue;
            
            const cell = String(rawData[rowIdx][colIdx] || '');
            // Check for date-like patterns
            if (/^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}$/.test(cell)) {
              datePatternCount++;
            }
            // Check for number-like patterns
            if (/^\d+([,.]\d+)?$/.test(cell)) {
              numberPatternCount++;
            }
          }
          
          if (datePatternCount >= 3) potentialDateColumns.push(colIdx);
          if (numberPatternCount >= 3) potentialHourColumns.push(colIdx);
        }
        
        if (potentialDateColumns.length > 0 && potentialHourColumns.length > 0) {
          console.log("Using detected date column:", potentialDateColumns[0], "and hours column:", potentialHourColumns[0]);
          
          // Create entries with just dates and hours
          for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length === 0 || !row[potentialDateColumns[0]]) continue;
            
            const dateStr = String(row[potentialDateColumns[0]] || '');
            const hoursStr = String(row[potentialHourColumns[0]] || '0');
            const hours = parseFloat(String(hoursStr).replace(',', '.')) || 0;
            
            if (dateStr && hours > 0) {
              entries.push({
                date: dateStr,
                hours: hours,
                workType: '',
                location: '',
                apartment: '',
                other: '',
                employee: ''
              });
            }
          }
          
          if (entries.length > 0) {
            console.log("Created entries with detected patterns:", entries.length);
            return entries;
          }
        }
        
        throw new Error('Fyrirsögn fannst ekki í vinnuskýrslu. Vinsamlegast athugið að skráin hafi rétta uppsetningu.');
      }
      
      console.log("Header row found at index:", headerRowIndex);
      
      // Map column indices based on headers
      const headerRow = rawData[headerRowIndex];
      const getColumnIndex = (header: string, alternativeHeaders: string[] = []): number => {
        // Try primary header first
        let index = headerRow.findIndex(cell => 
          cell && String(cell).toLowerCase().includes(header.toLowerCase()));
        
        // If not found, try alternative headers
        if (index === -1 && alternativeHeaders.length > 0) {
          for (const altHeader of alternativeHeaders) {
            index = headerRow.findIndex(cell => 
              cell && String(cell).toLowerCase().includes(altHeader.toLowerCase()));
            if (index !== -1) break;
          }
        }
        
        return index;
      };
      
      const dateColIdx = getColumnIndex('dagsetning', ['date', 'dags']);
      const hoursColIdx = getColumnIndex('tímar', ['hours', 'klst', 'tími']);
      const workTypeColIdx = getColumnIndex('vinna', ['work', 'verkefni']);
      const locationColIdx = getColumnIndex('hvar', ['location', 'staður', 'staðsetning']);
      const apartmentColIdx = getColumnIndex('íbúð', ['apartment', 'flat']);
      const otherColIdx = getColumnIndex('annað', ['other', 'athugasemdir']);
      const employeeColIdx = getColumnIndex('starfsmaður', ['employee', 'nafn', 'name']);
      
      console.log("Mapped columns:", {
        date: dateColIdx,
        hours: hoursColIdx,
        workType: workTypeColIdx,
        location: locationColIdx,
        apartment: apartmentColIdx,
        other: otherColIdx,
        employee: employeeColIdx
      });
      
      // Validate essential columns
      if (dateColIdx === -1 || hoursColIdx === -1) {
        throw new Error('Nauðsynlegir dálkar (dagsetning, tímar) fundust ekki. Vinsamlegast athugið uppsetningu skjalsins.');
      }
      
      // Process data rows (starting from the next row after header)
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        
        // Skip empty rows
        if (!row || row.length === 0 || !row.some(cell => cell)) {
          continue;
        }
        
        // Skip rows with no date
        if (!row[dateColIdx]) {
          continue;
        }
        
        // Parse hours - convert comma to dot for number parsing
        const hoursStr = String(row[hoursColIdx] || '0');
        const hours = parseFloat(hoursStr.replace(',', '.')) || 0;
        
        const entry: TimesheetEntry = {
          date: String(row[dateColIdx] || ''),
          hours: hours,
          workType: workTypeColIdx !== -1 ? String(row[workTypeColIdx] || '') : '',
          location: locationColIdx !== -1 ? String(row[locationColIdx] || '') : '',
          apartment: apartmentColIdx !== -1 ? String(row[apartmentColIdx] || '') : '',
          other: otherColIdx !== -1 ? String(row[otherColIdx] || '') : '',
          employee: employeeColIdx !== -1 ? String(row[employeeColIdx] || '') : ''
        };
        
        // Only add non-empty entries with valid dates and hours
        if (entry.date && entry.hours > 0) {
          entries.push(entry);
        }
      }
      
      console.log("Extracted entries:", entries.length);
      
      if (entries.length === 0) {
        throw new Error('Engar gildar færslur fundust í vinnuskýrslu');
      }
      
      return entries;
    } catch (readError) {
      console.error('Error reading Excel file:', readError);
      if (readError.message.includes('could not be read') || 
          readError.message.includes('permission')) {
        throw new Error('Ekki var hægt að lesa skrána. Vinsamlegast athugaðu hvort skráin sé opin í öðru forriti eða hvort þú hafir réttindi til að lesa hana. Reyndu að loka skránni í Excel og vista áður en þú reynir aftur.');
      }
      throw readError; // rethrow for other errors
    }

  } catch (error) {
    console.error('Error parsing timesheet file:', error);
    throw new Error(`Villa við lestur á vinnuskýrslu: ${error.message || 'Óþekkt villa'}`);
  }
}
