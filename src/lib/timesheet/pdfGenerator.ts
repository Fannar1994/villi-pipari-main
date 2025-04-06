
import { TimesheetEntry } from '@/types/timesheet';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateIcelandic } from '../utils/dateUtils';
import { createInvoiceData } from './invoiceUtils';
import { createSummarySheetData } from './summaryUtils';
import { groupEntriesByLocation } from './groupUtils';

/**
 * Generates PDF files from timesheet entries
 */
export async function generatePdfFiles(
  timesheetEntries: TimesheetEntry[],
  outputDirectory: string
): Promise<number> {
  try {
    // Create summary data
    const { data: summaryData } = createSummarySheetData(timesheetEntries);
    
    // Group entries by location and apartment
    const groupedEntries = groupEntriesByLocation(timesheetEntries);
    console.log("Generating PDFs for groups:", Object.keys(groupedEntries).length);
    
    let pdfCount = 0;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Create summary PDF
    const summaryPdf = new jsPDF();
    summaryPdf.setFont('helvetica', 'bold');
    summaryPdf.text('Samantekt', 14, 15);
    
    // Format summary data for the PDF table
    const tableData = summaryData.slice(2).map(row => 
      row.map(cell => {
        // Convert formula objects to strings
        if (cell && typeof cell === 'object' && 'f' in cell) {
          return '';  // Formula cells don't have meaningful values in PDF
        }
        return cell ? cell.toString() : '';
      })
    );
    
    // Generate the table
    autoTable(summaryPdf, {
      head: [['Dagsetning', 'Starfsmaður', 'Staðsetning', 'Tímar']],
      body: tableData,
      startY: 20,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
    });
    
    // Save the summary PDF
    if (typeof window !== 'undefined' && window.electron && window.electron.writeFile) {
      const normalizedDir = outputDirectory.replace(/[\/\\]+$/, '');
      const summaryPath = `${normalizedDir}/Samantekt_${currentDate}.pdf`;
      
      const summaryPdfBlob = summaryPdf.output('arraybuffer');
      await window.electron.writeFile({
        filePath: summaryPath,
        data: new Uint8Array(summaryPdfBlob)
      });
      
      pdfCount++;
      console.log("Summary PDF saved:", summaryPath);
    } else {
      console.warn("Electron API not available, couldn't save summary PDF");
    }
    
    // Create individual invoice PDFs
    // Use a Map to track used filenames to avoid duplicates
    const usedFilenames = new Map<string, number>();
    
    console.log(`Processing ${Object.keys(groupedEntries).length} location groups for PDFs`);
    
    for (const [key, entries] of Object.entries(groupedEntries)) {
      if (entries.length > 0) {
        console.log(`Creating PDF for location: ${key} with ${entries.length} entries`);
        const firstEntry = entries[0];
        const locationName = firstEntry.location || '';
        const apartmentName = firstEntry.apartment || '';
        
        // Skip if location is empty
        if (!locationName.trim()) {
          console.log("Skipping entry with empty location");
          continue;
        }
        
        // Create new PDF document
        const pdf = new jsPDF();
        
        // Add header - match Excel layout
        pdf.setFont('helvetica', 'bold');
        pdf.text('Fylgiskjal reiknings', 14, 15);
        
        // Format data for the table - sort entries by date first
        const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
        const headers = ['Dagsetning:', 'Tímar:', 'Vinnuliður:', 'Starfsmaður:'];
        const rows = sortedEntries.slice(0, 7).map(entry => [
          formatDateIcelandic(entry.date),
          entry.hours.toString().replace('.', ','),  // Format with comma decimal separator
          entry.workType || '',
          entry.employee || ''
        ]);
        
        // Calculate total hours
        const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
        
        // Generate the table
        autoTable(pdf, {
          head: [headers],
          body: rows,
          startY: 30,
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
          },
        });
        
        // Add location information section - match Excel layout
        pdf.setFontSize(10);
        pdf.text('Vinnustaður:', 14, 80);
        pdf.text(locationName, 50, 80);
        
        pdf.text('Íbúð:', 14, 85);
        pdf.text(apartmentName, 50, 85);
        
        if (firstEntry.other) {
          pdf.text('Annað:', 14, 90);
          pdf.text(firstEntry.other || '', 50, 90);
        }
        
        // Add total hours
        pdf.setFont('helvetica', 'bold');
        pdf.text('Samtals tímar:', 14, 100);
        pdf.text(totalHours.toString().replace('.', ','), 50, 100);
        
        // Save the PDF
        if (typeof window !== 'undefined' && window.electron && window.electron.writeFile) {
          // Create a safer filename base by replacing invalid characters with underscores
          const baseName = `${locationName}_${apartmentName}`.replace(/[^a-z0-9áðéíóúýþæöÁÐÉÍÓÚÝÞÆÖ]/gi, '_');
          
          // Always add a counter suffix for consistency and uniqueness
          let uniqueSuffix = 1;
          if (usedFilenames.has(baseName)) {
            uniqueSuffix = usedFilenames.get(baseName)! + 1;
          }
          usedFilenames.set(baseName, uniqueSuffix);
          
          const safeFileName = uniqueSuffix > 1 ? `${baseName}_${uniqueSuffix}` : baseName;
          
          const normalizedDir = outputDirectory.replace(/[\/\\]+$/, '');
          const pdfPath = `${normalizedDir}/${safeFileName}_${currentDate}.pdf`;
          
          console.log("Trying to save PDF to:", pdfPath);
          
          const pdfBlob = pdf.output('arraybuffer');
          await window.electron.writeFile({
            filePath: pdfPath,
            data: new Uint8Array(pdfBlob)
          });
          
          pdfCount++;
          console.log("Invoice PDF saved:", pdfPath);
        } else {
          console.warn("Electron API not available, couldn't save invoice PDF");
        }
      }
    }
    
    console.log(`Total PDFs created: ${pdfCount}`);
    return pdfCount;
    
  } catch (error) {
    console.error('Error generating PDFs:', error);
    throw new Error(error instanceof Error ? error.message : 'Villa við að búa til PDF skjöl');
  }
}
