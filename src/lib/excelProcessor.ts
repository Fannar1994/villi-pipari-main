
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
    
    console.log("Parsed timesheet data:", jsonData);
    
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
    throw new Error('Villa við lestur á vinnuskýrslu');
  }
}

export async function generateInvoices(
  timesheetEntries: TimesheetEntry[],
  outputFile: File,
  outputDirectory: string
): Promise<number> {
  try {
    console.log("Starting invoice generation with entries:", timesheetEntries);
    
    // Group entries by street and apartment
    const groupedEntries = groupEntriesByLocation(timesheetEntries);
    console.log("Grouped entries:", groupedEntries);
    
    // Read output file
    const outputArrayBuffer = await outputFile.arrayBuffer();
    const outputWorkbook = XLSX.read(outputArrayBuffer, { type: 'array' });

    let invoiceCount = 0;
    
    for (const [location, entries] of Object.entries(groupedEntries)) {
      console.log(`Processing location: ${location} with ${entries.length} entries`);
      
      // Create a new sheet name for this location
      const [street, apartment] = location.split('-');
      const safeSheetName = `${street}_${apartment}`.substring(0, 31).replace(/[\[\]\*\?\/\\]/g, '_');
      
      // Create invoice data for this location
      const invoiceData = createInvoiceData(entries);
      
      // Create a worksheet from the invoice data
      const invoiceSheet = XLSX.utils.aoa_to_sheet(invoiceData);
      
      // Set column widths
      const wscols = [
        {wch: 15}, // Date
        {wch: 30}, // Description
        {wch: 15}, // Employee
        {wch: 10}, // Hours
        {wch: 15}  // Rate/Amount
      ];
      invoiceSheet['!cols'] = wscols;
      
      // Add or replace the sheet in the output workbook
      if (outputWorkbook.SheetNames.includes(safeSheetName)) {
        // Replace existing sheet
        outputWorkbook.Sheets[safeSheetName] = invoiceSheet;
      } else {
        // Add new sheet
        XLSX.utils.book_append_sheet(outputWorkbook, invoiceSheet, safeSheetName);
      }
      
      invoiceCount++;
    }
    
    // Save the modified workbook
    const filename = `Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const filepath = path.join(outputDirectory, filename);
    
    console.log(`Writing invoices to: ${filepath}`);
    
    // Write to file using electron's fs
    const buffer = XLSX.write(outputWorkbook, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(filepath, buffer);
    
    console.log(`Successfully generated ${invoiceCount} invoices`);
    return invoiceCount;
  } catch (error) {
    console.error('Error generating invoices:', error);
    throw error;
  }
}

function createInvoiceData(entries: TimesheetEntry[]): any[][] {
  // Create a worksheet for invoice details
  const invoiceData = [
    ['Invoice', '', '', '', ''],
    ['Villi Pípari', '', '', '', ''],
    ['Date:', new Date().toLocaleDateString(), '', '', ''],
    ['', '', '', '', ''],
    ['Location:', `${entries[0].street} ${entries[0].apartment}`, '', '', ''],
    ['', '', '', '', ''],
    ['Work Details:', '', '', '', ''],
    ['Date', 'Description', 'Employee', 'Hours', 'Rate'],
  ];
  
  // Add entry rows
  let totalHours = 0;
  const hourlyRate = 3500; // Default hourly rate in ISK
  
  entries.forEach(entry => {
    const dateFormatted = entry.date.toLocaleDateString();
    invoiceData.push([
      dateFormatted, 
      entry.description, 
      entry.employee, 
      entry.hours.toString(), // Convert number to string 
      hourlyRate.toString()   // Convert number to string
    ]);
    totalHours += entry.hours;
  });
  
  // Add totals
  const totalAmount = totalHours * hourlyRate;
  invoiceData.push(['', '', '', '', '']);
  invoiceData.push(['Total Hours:', '', '', totalHours.toString(), '']); // Convert number to string
  invoiceData.push(['Total Amount:', '', '', '', `${totalAmount} ISK`]);
  invoiceData.push(['', '', '', '', '']);
  invoiceData.push(['Payment Terms:', 'Net 30', '', '', '']);
  invoiceData.push(['Bank Account:', '0123-26-012345', '', '', '']);
  
  return invoiceData;
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
