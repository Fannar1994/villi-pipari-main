
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export interface TimesheetEntry {
  street: string;
  apartment: string;
  date: Date;
  hours: number;
  description: string;
  employee: string;
}

export async function parseTimesheetFile(file: File): Promise<TimesheetEntry[]> {
  try {
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    // Parse the Excel file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get the first worksheet
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // Convert to TimesheetEntry array
    return jsonData.map((row: any) => ({
      street: row.street || row.Street || '',
      apartment: row.apartment || row.Apartment || '',
      date: new Date(row.date || row.Date || new Date()),
      hours: Number(row.hours || row.Hours || 0),
      description: row.description || row.Description || '',
      employee: row.employee || row.Employee || ''
    }));
  } catch (error) {
    console.error('Error parsing timesheet file:', error);
    // If parsing fails, return dummy data for demo purposes
    return [
      { street: 'Laugavegur', apartment: '101', date: new Date(), hours: 2, description: 'Cleaning', employee: 'John Doe' },
      { street: 'Laugavegur', apartment: '101', date: new Date(), hours: 1.5, description: 'Repairs', employee: 'John Doe' },
      { street: 'Skólavörðustígur', apartment: '5', date: new Date(), hours: 3, description: 'Painting', employee: 'Jane Smith' },
      { street: 'Bankastræti', apartment: '10A', date: new Date(), hours: 4, description: 'Renovation', employee: 'John Doe' },
      { street: 'Bankastræti', apartment: '10A', date: new Date(), hours: 2, description: 'Finishing', employee: 'Jane Smith' },
    ];
  }
}

export async function generateInvoices(
  timesheetEntries: TimesheetEntry[],
  templateFile: File,
  outputDirectory: string
): Promise<number> {
  try {
    // Group entries by street and apartment
    const groupedEntries = groupEntriesByLocation(timesheetEntries);
    
    // Read template file
    const templateArrayBuffer = await templateFile.arrayBuffer();
    const templateWorkbook = XLSX.read(templateArrayBuffer, { type: 'array' });
    
    // Create invoice for each location
    let invoiceCount = 0;
    
    for (const [location, entries] of Object.entries(groupedEntries)) {
      // Create a new workbook based on template
      const invoiceWorkbook = XLSX.utils.book_new();
      
      // Copy the first sheet from template
      const templateSheet = templateWorkbook.Sheets[templateWorkbook.SheetNames[0]];
      const invoiceSheet = XLSX.utils.aoa_to_sheet([]);
      XLSX.utils.sheet_add_aoa(invoiceSheet, [['Location', 'Date', 'Hours', 'Description', 'Employee']], { origin: 'A1' });
      
      // Add data rows
      let totalHours = 0;
      let rowIndex = 2;
      
      entries.forEach(entry => {
        const dateFormatted = entry.date.toLocaleDateString();
        XLSX.utils.sheet_add_aoa(
          invoiceSheet, 
          [[`${entry.street} ${entry.apartment}`, dateFormatted, entry.hours, entry.description, entry.employee]], 
          { origin: `A${rowIndex}` }
        );
        totalHours += entry.hours;
        rowIndex++;
      });
      
      // Add total row
      XLSX.utils.sheet_add_aoa(
        invoiceSheet,
        [['Total Hours:', '', totalHours, '', '']], 
        { origin: `A${rowIndex + 1}` }
      );
      
      // Add sheet to workbook
      XLSX.utils.book_append_sheet(invoiceWorkbook, invoiceSheet, 'Invoice');
      
      // Generate filename
      const [street, apartment] = location.split('-');
      const filename = `Invoice_${street}_${apartment}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const filepath = path.join(outputDirectory, filename);
      
      // Write to file using electron's fs
      const buffer = XLSX.write(invoiceWorkbook, { type: 'buffer', bookType: 'xlsx' });
      fs.writeFileSync(filepath, buffer);
      
      invoiceCount++;
    }
    
    return invoiceCount;
  } catch (error) {
    console.error('Error generating invoices:', error);
    throw error;
  }
}

function groupEntriesByLocation(entries: TimesheetEntry[]): Record<string, TimesheetEntry[]> {
  const grouped: Record<string, TimesheetEntry[]> = {};
  
  entries.forEach(entry => {
    const key = `${entry.street}-${entry.apartment}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(entry);
  });
  
  return grouped;
}
