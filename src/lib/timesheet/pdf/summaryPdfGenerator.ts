
import { TimesheetEntry } from '@/types/timesheet';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatNumber } from '../../utils/formatters';
import { groupEntriesByLocation } from '../groupUtils';

// Define TableOutput interface since it's not exported from jspdf-autotable
interface TableOutput {
  finalY?: number;
  startY?: number;
}

/**
 * Generates a summary PDF from timesheet entries
 */
export async function generateSummaryPdf(
  timesheetEntries: TimesheetEntry[],
  outputDirectory: string,
  currentDate: string
): Promise<boolean> {
  try {
    // Group entries by location and apartment
    const groupedEntries = groupEntriesByLocation(timesheetEntries);
    
    // Create a summary PDF
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
    
    // Create a variable to store table output data
    let summaryTable: TableOutput = { finalY: 40 }; // Default fallback value
    
    // Generate summary table
    autoTable(summaryPdf, {
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
      didDrawPage: function(data) {
        // Store the final Y position
        summaryTable.finalY = data.cursor.y;
      }
    });
    
    // Add total row - use the finalY from TableOutput
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
        
        console.log("Summary PDF saved successfully");
        return true;
      } catch (error) {
        console.error("Error saving summary PDF:", error);
        return false;
      }
    } else {
      console.warn("Electron API not available for summary PDF");
      return false;
    }
  } catch (error) {
    console.error('Error generating summary PDF:', error);
    return false;
  }
}
