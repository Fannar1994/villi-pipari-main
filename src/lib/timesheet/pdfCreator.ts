
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
  
  // Add fovea logo on top right if available
  try {
    // Position for top right - adjust as needed
    const logoX = pdf.internal.pageSize.width - 50;
    const logoY = 10;
    
    // Add logo image - using base64 format for the logo
    // This would typically come from an asset in your project
    const logoWidth = 35;
    
    // Try to add logo from an imported image
    // Note: In a real implementation, you would need to import an actual image
    pdf.addImage(
      "/src/assets/fovea_logo.png", // Path should point to your logo file
      "PNG",
      logoX,
      logoY - 9,
      logoWidth,
      logoWidth * 0.4
    );
  } catch (logoError) {
    console.warn("Could not add logo to PDF:", logoError);
    // Continue without logo if there's an error
  }

  // Add sheet name as title
  pdf.setFontSize(14);
  pdf.text(`${sheetName}`, 14, 25);
  
  // Generate the table - use all data from the sheet
  autoTable(pdf, {
    head: [sheetData[0]],
    body: sheetData.slice(1),
    startY: 30, // Increased startY to accommodate the header
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
