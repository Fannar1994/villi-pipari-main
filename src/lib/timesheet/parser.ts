
import * as XLSX from 'xlsx';
import { TimesheetEntry } from '@/types/timesheet';

export function parseTimesheetFile(file: File): Promise<TimesheetEntry[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Find the correct sheet (looking for 'kop' or 'kóp' variations)
        const sheetName = Object.keys(workbook.Sheets).find(name => 
          name.toLowerCase().includes('kop') || 
          name.toLowerCase().includes('kóp')
        ) || Object.keys(workbook.Sheets)[0];

        if (!sheetName) {
          throw new Error('Engin viðeigandi vinnuskýrsla fannst');
        }

        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: '',
          raw: false 
        });

        const entries: TimesheetEntry[] = [];

        // Find header row
        const headerRow = rows.findIndex(row => 
          row.some((cell: string) => 
            ['dagsetning', 'date', 'dags'].some(header => 
              String(cell).toLowerCase().includes(header)
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

        // Process rows starting from the next row after headers
        for (let i = headerRow + 1; i < rows.length; i++) {
          const row = rows[i];
          
          // Skip empty rows
          if (!row || row.every(cell => cell === '')) continue;

          // Map columns (adjust these based on your specific Excel sheet structure)
          const entry: TimesheetEntry = {
            date: row[0] ? String(row[0]) : '',
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
        reject(new Error(`Villa við lestur á vinnuskýrslu: ${error instanceof Error ? error.message : 'Óþekkt villa'}`));
      }
    };

    reader.onerror = (error) => {
      console.error('Villa við lestur skráar:', error);
      reject(new Error('Ekki tókst að lesa skrá'));
    };

    reader.readAsArrayBuffer(file);
  });
}

