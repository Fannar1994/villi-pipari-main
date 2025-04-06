
import { TimesheetEntry } from '@/types/timesheet';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateIcelandic } from '../../utils/dateUtils';
import { formatNumber } from '../../utils/formatters';

// Define TableOutput interface since it's not exported from jspdf-autotable
interface TableOutput {
  finalY?: number;
  startY?: number;
}

/**
 * Generates a PDF document for a specific location
 */
export async function generateLocationPdf(
  entries: TimesheetEntry[],
  outputDirectory: string,
  currentDate: string,
  usedFilenames: Map<string, number>
): Promise<boolean> {
  try {
    if (entries.length === 0) {
      console.log("Skipping empty location group");
      return false;
    }
    
    const firstEntry = entries[0];
    const locationName = firstEntry.location || '';
    const apartmentName = firstEntry.apartment || '';
    
    // Skip if location is empty
    if (!locationName.trim()) {
      console.log("Skipping entry with empty location");
      return false;
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
    
    // Create a variable to store table output data
    let table: TableOutput = { finalY: 80 }; // Default fallback value
    
    // Generate the table
    autoTable(pdf, {
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
      didDrawPage: function(data) {
        // Store the final Y position
        table.finalY = data.cursor.y;
      }
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
        
        console.log(`PDF saved successfully: ${pdfPath}`);
        return true;
      } catch (error) {
        console.error("Error saving location PDF:", error);
        return false;
      }
    } else {
      console.warn("Electron API not available for location PDF");
      return false;
    }
  } catch (error) {
    console.error('Error generating location PDF:', error);
    return false;
  }
}
