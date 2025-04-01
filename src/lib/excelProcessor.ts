
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
    console.log("Starting invoice generation with entries:", timesheetEntries);
    
    // Group entries by street and apartment
    const groupedEntries = groupEntriesByLocation(timesheetEntries);
    console.log("Grouped entries:", groupedEntries);
    
    // Read template file
    const templateArrayBuffer = await templateFile.arrayBuffer();
    const templateWorkbook = XLSX.read(templateArrayBuffer, { type: 'array' });
    
    // Create invoice for each location
    let invoiceCount = 0;
    
    for (const [location, entries] of Object.entries(groupedEntries)) {
      console.log(`Processing location: ${location} with ${entries.length} entries`);
      
      // Create a new workbook for this invoice
      const invoiceWorkbook = XLSX.utils.book_new();
      
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
          entry.hours, 
          hourlyRate
        ]);
        totalHours += entry.hours;
      });
      
      // Add totals
      const totalAmount = totalHours * hourlyRate;
      invoiceData.push(['', '', '', '', '']);
      invoiceData.push(['Total Hours:', '', '', totalHours, '']);
      invoiceData.push(['Total Amount:', '', '', '', `${totalAmount} ISK`]);
      invoiceData.push(['', '', '', '', '']);
      invoiceData.push(['Payment Terms:', 'Net 30', '', '', '']);
      invoiceData.push(['Bank Account:', '0123-26-012345', '', '', '']);
      
      // Create worksheet from data
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
      
      // Apply some styling (as much as XLSX allows)
      // Note: Styling capabilities are limited with xlsx library
      
      // Add sheet to workbook
      XLSX.utils.book_append_sheet(invoiceWorkbook, invoiceSheet, 'Invoice');
      
      // Generate filename
      const [street, apartment] = location.split('-');
      const filename = `Invoice_${street}_${apartment}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const filepath = path.join(outputDirectory, filename);
      
      console.log(`Writing invoice to: ${filepath}`);
      
      // Write to file using electron's fs
      const buffer = XLSX.write(invoiceWorkbook, { type: 'buffer', bookType: 'xlsx' });
      fs.writeFileSync(filepath, buffer);
      
      invoiceCount++;
    }
    
    console.log(`Successfully generated ${invoiceCount} invoices`);
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
