
import { TimesheetEntry } from '@/types/timesheet';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateIcelandic } from '../utils/dateUtils';
import { formatNumber } from '../utils/formatters';
import { groupEntriesByLocation } from './groupUtils';

/**
 * Generates PDF files from timesheet entries
 */
export async function generatePdfFiles(
  timesheetEntries: TimesheetEntry[],
  outputDirectory: string
): Promise<number> {
  try {
    console.log("Starting PDF generation with", timesheetEntries.length, "entries");
    
    // Group entries by location and apartment
    const groupedEntries = groupEntriesByLocation(timesheetEntries);
    console.log("Grouped entries into", Object.keys(groupedEntries).length, "location groups");
    
    let pdfCount = 0;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Create a summary PDF first
    const summaryPdf = new jsPDF();
    summaryPdf.setFont('helvetica', 'bold');
    summaryPdf.text('Samantekt', 14, 15);
    
    // Prepare summary table data
    const summaryTableRows: string[][] = [];
    let totalHoursAllLocations = 0;
    
    Object.entries(groupedEntries).forEach(([key, entries]) => {
      if (entries.length > 0) {
        const firstEntry = entries[0];
        const locationName = firstEntry.location || '';
        const apartmentName = firstEntry.apartment || '';
        
        // Calculate total hours for this location
        const locationHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
        totalHoursAllLocations += locationHours;
        
        // Format location display
        const locationDisplay = apartmentName 
          ? `${locationName}, ${apartmentName}`
          : locationName;
        
        summaryTableRows.push([
          locationDisplay,
          formatNumber(locationHours)
        ]);
      }
    });
    
    // Generate summary table
    const summaryTable = autoTable(summaryPdf, {
      head: [['Staðsetning', 'Tímar']],
      body: summaryTableRows,
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
    
    // Add total row
    summaryPdf.setFont('helvetica', 'bold');
    const finalY = summaryTable.finalY || 40;
    summaryPdf.text('Samtals tímar:', 14, finalY + 10);
    summaryPdf.text(formatNumber(totalHoursAllLocations), 50, finalY + 10);
    
    // Save summary PDF
    if (typeof window !== 'undefined' && window.electron && window.electron.writeFile) {
      try {
        const normalizedDir = outputDirectory.replace(/[\/\\]+$/, '');
        const summaryPath = `${normalizedDir}/Samantekt_${currentDate}.pdf`;
        
        console.log("Trying to save summary PDF to:", summaryPath);
        
        const summaryPdfBlob = summaryPdf.output('arraybuffer');
        await window.electron.writeFile({
          filePath: summaryPath,
          data: new Uint8Array(summaryPdfBlob)
        });
        
        pdfCount++;
        console.log("Summary PDF saved successfully");
      } catch (error) {
        console.error("Error saving summary PDF:", error);
      }
    } else {
      console.warn("Electron API not available for summary PDF");
    }
    
    // Create individual invoice-style PDFs for each location
    const usedFilenames = new Map<string, number>();
    
    for (const [key, entries] of Object.entries(groupedEntries)) {
      if (entries.length === 0) {
        console.log("Skipping empty location group:", key);
        continue;
      }
      
      console.log(`Creating PDF for location group: ${key} with ${entries.length} entries`);
      const firstEntry = entries[0];
      const locationName = firstEntry.location || '';
      const apartmentName = firstEntry.apartment || '';
      
      // Skip if location is empty
      if (!locationName.trim()) {
        console.log("Skipping entry with empty location");
        continue;
      }
      
      // Sort entries by date
      const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
      
      // Calculate total hours
      const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
      
      // Create new PDF document - invoice style
      const pdf = new jsPDF();
      
      // Add header
      pdf.setFont('helvetica', 'bold');
      pdf.text('Fylgiskjal reiknings', 14, 15);
      
      // Format data for the table
      const rows = sortedEntries.slice(0, 7).map(entry => [
        formatDateIcelandic(entry.date),
        formatNumber(entry.hours),
        entry.workType || '',
        entry.employee || ''
      ]);
      
      // Generate the table - EXACTLY like the invoice format
      const table = autoTable(pdf, {
        head: [['Dagsetning:', 'Tímar:', 'Vinnuliður:', 'Starfsmaður:']],
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
      const locationY = table.finalY ? table.finalY + 15 : 80;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text('Vinnustaður:', 14, locationY);
      pdf.text(locationName, 50, locationY);
      
      pdf.text('Íbúð:', 14, locationY + 5);
      pdf.text(apartmentName || '', 50, locationY + 5);
      
      if (firstEntry.other) {
        pdf.text('Annað:', 14, locationY + 10);
        pdf.text(firstEntry.other || '', 50, locationY + 10);
      }
      
      // Add total hours
      pdf.setFont('helvetica', 'bold');
      pdf.text('Samtals tímar:', 14, locationY + 20);
      pdf.text(formatNumber(totalHours), 50, locationY + 20);
      
      // Save the PDF
      if (typeof window !== 'undefined' && window.electron && window.electron.writeFile) {
        try {
          // Create a safer filename
          const baseName = `${locationName}_${apartmentName}`.replace(/[^a-z0-9áðéíóúýþæöÁÐÉÍÓÚÝÞÆÖ]/gi, '_');
          
          // Add counter for uniqueness
          let uniqueSuffix = 1;
          if (usedFilenames.has(baseName)) {
            uniqueSuffix = usedFilenames.get(baseName)! + 1;
          }
          usedFilenames.set(baseName, uniqueSuffix);
          
          const safeFileName = uniqueSuffix > 1 ? `${baseName}_${uniqueSuffix}` : baseName;
          
          const normalizedDir = outputDirectory.replace(/[\/\\]+$/, '');
          const pdfPath = `${normalizedDir}/${safeFileName}_${currentDate}.pdf`;
          
          console.log("Trying to save location PDF to:", pdfPath);
          
          const pdfBlob = pdf.output('arraybuffer');
          await window.electron.writeFile({
            filePath: pdfPath,
            data: new Uint8Array(pdfBlob)
          });
          
          pdfCount++;
          console.log(`PDF saved successfully: ${pdfPath}`);
        } catch (error) {
          console.error("Error saving location PDF:", error);
        }
      } else {
        console.warn("Electron API not available for location PDF");
      }
    }
    
    console.log(`Total PDFs created: ${pdfCount}`);
    return pdfCount;
    
  } catch (error) {
    console.error('Error generating PDFs:', error);
    throw new Error(error instanceof Error ? error.message : 'Villa við að búa til PDF skjöl');
  }
}
