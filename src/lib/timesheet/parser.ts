
import * as XLSX from 'xlsx';
import { TimesheetEntry } from '@/types/timesheet';

export function parseTimesheetFile(file: File): Promise<TimesheetEntry[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellFormula: false, // Disable formula parsing
          raw: true // Use raw values
        });

        // Find the correct sheet (looking for 'kop' or 'kóp' variations)
        const sheetName = Object.keys(workbook.Sheets).find(name => 
          name.toLowerCase().includes('kop') || 
          name.toLowerCase().includes('kóp')
        ) || Object.keys(workbook.Sheets)[0];

        if (!sheetName) {
          throw new Error('Engin viðeigandi vinnuskýrsla fannst');
        }

        const worksheet = workbook.Sheets[sheetName];
        // Remove cellFormula from sheet_to_json options since it's not a valid option
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { 
          header: 1, 
          defval: '',
          raw: true // Use raw values
        });

        const entries: TimesheetEntry[] = [];

        // Find header row
        const headerRow = (rows as any[][]).findIndex(row => 
          Array.isArray(row) && row.some((cell: any) => 
            typeof cell === 'string' && ['dagsetning', 'date', 'dags'].some(header => 
              cell.toLowerCase().includes(header)
            )
          )
        );

        if (headerRow === -1) {
          throw new Error('Ekki tókst að finna hausar í vinnuskýrslu');
        }

        // Capitalization utility function
        function capitalize(str: string): string {
          if (!str || typeof str !== 'string') return '';
          // Trim and remove any extra whitespace
          str = str.trim().replace(/\s+/g, ' ');
          // Capitalize first letter
          return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        }

        // Function to parse and standardize date format
        function parseDate(dateValue: any): string {
          if (!dateValue) return '';
          
          try {
            // If it's already a date object from Excel
            if (dateValue instanceof Date) {
              return dateValue.toISOString().split('T')[0]; // YYYY-MM-DD format
            }
            
            // If it's a number (Excel serial date)
            if (typeof dateValue === 'number') {
              // Excel dates are number of days since 1900-01-01 (or 1904-01-01)
              const excelDate = XLSX.SSF.parse_date_code(dateValue);
              const year = excelDate.y;
              const month = excelDate.m.toString().padStart(2, '0');
              const day = excelDate.d.toString().padStart(2, '0');
              return `${year}-${month}-${day}`;
            }
            
            // If it's a string, try to parse it
            if (typeof dateValue === 'string') {
              const dateStr = dateValue.trim();
              
              // Try to parse various date formats
              // Icelandic format: DD.MM.YYYY
              if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) {
                const [day, month, year] = dateStr.split('.').map(Number);
                return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              }
              
              // Format: DD/MM/YYYY
              if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
                const [day, month, year] = dateStr.split('/').map(Number);
                return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              }
              
              // Format: YYYY-MM-DD
              if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
                return dateStr;
              }
              
              // If none of the above patterns match, try JavaScript Date parsing as fallback
              const parsed = new Date(dateStr);
              if (!isNaN(parsed.getTime())) {
                return parsed.toISOString().split('T')[0];
              }
            }
            
            // If we can't parse the date, return it as is
            return String(dateValue);
          } catch (error) {
            console.warn('Error parsing date:', error, dateValue);
            return String(dateValue);
          }
        }

        // Process rows starting from the next row after headers
        for (let i = headerRow + 1; i < rows.length; i++) {
          const row = rows[i] as any[];
          
          // Skip empty rows
          if (!row || (Array.isArray(row) && row.every((cell: any) => cell === ''))) continue;

          // Map columns (adjust these based on your specific Excel sheet structure)
          const entry: TimesheetEntry = {
            date: parseDate(row[0]),
            hours: row[1] ? Number(row[1]) : 0,
            workType: row[2] ? capitalize(String(row[2])) : '',
            location: row[3] ? capitalize(String(row[3])) : '',
            apartment: row[4] ? capitalize(String(row[4])) : '',
            other: row[5] ? capitalize(String(row[5])) : '',
            employee: row[6] ? capitalize(String(row[6])) : ''
          };

          entries.push(entry);
        }

        resolve(entries);
      } catch (error) {
        console.error('Villa við lestur á vinnuskýrslu:', error);
        let errorMessage = `Villa við lestur á vinnuskýrslu: ${error instanceof Error ? error.message : 'Óþekkt villa'}`;
        
        // Add a helpful message for permission errors
        if (errorMessage.includes('permission')) {
          errorMessage += '. Athugaðu hvort skráin sé opin í Excel eða öðru forriti og lokaðu henni áður en þú reynir aftur.';
        }
        
        reject(new Error(errorMessage));
      }
    };

    reader.onerror = (error) => {
      console.error('Villa við lestur skráar:', error);
      reject(new Error('Ekki tókst að lesa skrá'));
    };

    reader.readAsArrayBuffer(file);
  });
}
