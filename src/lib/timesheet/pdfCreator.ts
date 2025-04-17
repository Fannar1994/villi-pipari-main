
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Creates a PDF document from sheet data
 */
export function createPdfFromSheetData(sheetName: string, sheetData: any[][]): ArrayBuffer {
  // Create PDF for this sheet
  const pdf = new jsPDF();
  
  // Add company name in top left
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Villi Pípari ehf.", 14, 10);
  
  // Add apartment details
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("Arnasmári 30, 102", 14, 16);
  
  // Add fovea logo on top right
  try {
    // Get the base URL for assets - this helps resolve the correct path
    const baseUrl = window.location.origin;
    
    // Position for top right
    const logoX = pdf.internal.pageSize.width - 51; // Reduced X position
    const logoY = 10;
    
    // Reduce logo size by 15%
    const logoWidth = 51; // Reduced from 60
    const logoHeight = 21.25; // Proportionally reduced
    
    // Use an absolute path to the image
    // In Electron, we need to use an absolute file path
    if (window.isElectron) {
      // For Electron - log the attempt to help with debugging
      console.log("Attempting to add logo in Electron environment");
      pdf.addImage(
        "fovea_logo.png", // Using just the filename may work better in Electron
        "PNG",
        logoX,
        logoY - 5,
        logoWidth,
        logoHeight
      );
    } else {
      // For browser environment
      pdf.addImage(
        `/assets/fovea_logo.png`,
        "PNG",
        logoX,
        logoY - 5,
        logoWidth,
        logoHeight
      );
    }
    console.log("Logo added successfully to PDF");
  } catch (logoError) {
    console.error("Could not add logo to PDF:", logoError);
    // Continue without logo if there's an error
  }

  // Add sheet name as title
  pdf.setFontSize(14);
  pdf.text(`${sheetName}`, 14, 30); // Moved down to accommodate apartment details
  
  // Generate the table - use all data from the sheet
  autoTable(pdf, {
    head: [sheetData[0]],
    body: sheetData.slice(1),
    startY: 35, // Increased startY to accommodate the header
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
  });
  
  // Return the PDF as an ArrayBuffer
  return pdf.output("arraybuffer");
}

/**
 * Creates a safe filename from a sheet name
 */
export function createSafeFilename(sheetName: string, dateString: string): string {
  // Create safe filename from sheet name
  const safeFileName = sheetName.replace(/[^a-z0-9áðéíóúýþæöÁÐÉÍÓÚÝÞÆÖ]/gi, "_");
  return `${safeFileName}_${dateString}.pdf`;
}

