
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateIcelandic } from "../utils/dateUtils";

/**
 * Checks if the Electron APIs are available and working
 */
function isElectronAvailable(): boolean {
  try {
    // More robust check for Electron environment
    if (typeof window === 'undefined') return false;
    if (typeof window.electron === 'undefined') return false;
    if (typeof window.electron.writeFile !== 'function') return false;

    // Check if the isElectron flag is set
    const hasElectronFlag = window.isElectron === true;

    console.log("Electron API check:", {
      hasWindowObject: typeof window !== 'undefined',
      hasElectronObject: typeof window.electron !== 'undefined',
      hasWriteFileFunction: typeof window.electron?.writeFile === 'function',
      hasElectronFlag: hasElectronFlag
    });

    // Return true only if all conditions are met
    return hasElectronFlag && typeof window.electron.writeFile === 'function';
  } catch (err) {
    console.error("Error checking for Electron:", err);
    return false;
  }
}

/**
 * Writes a PDF file to disk using the Electron API
 * @returns Promise with success/failure info
 */
async function writePdfToDisk(
  filePath: string,
  pdfBlob: ArrayBuffer
): Promise<boolean> {
  // First verify Electron is available
  if (!isElectronAvailable()) {
    console.error("Electron API not available for file writing");
    throw new Error(
      "PDF útflutningur er aðeins í boði í Electron útgáfunni."
    );
  }

  try {
    console.log(`Attempting to save PDF to: ${filePath}`);
    console.log("Electron API status:", {
      electronObject: typeof window.electron,
      writeFileFunction: typeof window.electron.writeFile
    });

    // Call Electron's writeFile API and wait for the result
    const result = await window.electron.writeFile({
      filePath: filePath,
      data: new Uint8Array(pdfBlob),
    });

    // Validate the result
    if (!result || result.error) {
      console.error(`Error writing file: ${result?.error || "Unknown error"}`);
      throw new Error(result?.error || "Villa við skráarskrifun");
    }

    // Verify the file exists after writing
    try {
      const fileExists = await window.electron.fileExists(filePath);
      if (!fileExists) {
        console.error(`File was not found after writing: ${filePath}`);
        throw new Error(`Skrá fannst ekki eftir vistun: ${filePath}`);
      }
    } catch (verifyError) {
      console.error("Error verifying file exists:", verifyError);
      // Continue even if verification fails - the write might have succeeded
    }

    console.log(`PDF successfully saved to: ${filePath}`);
    return true;
  } catch (error: any) {
    console.error("Failed to write PDF file:", error);
    throw new Error(
      `Villa við að vista skrá: ${
        error instanceof Error ? error.message : "Óþekkt villa"
      }`
    );
  }
}

/**
 * Generates PDF files directly from an Excel file
 */
export async function generatePdfFiles(
  excelFile: File,
  outputDirectory: string
): Promise<number> {
  try {
    console.log("Starting PDF generation process...");

    // Check if we can access the Electron API for file writing
    if (!isElectronAvailable()) {
      console.error("Electron API not available for file writing");
      throw new Error(
        "PDF útflutningur er aðeins í boði í Electron útgáfunni."
      );
    }

    // Verify the output directory exists
    if (!outputDirectory || outputDirectory.trim() === "") {
      throw new Error("Úttak mappa verður að vera valin.");
    }

    console.log(`Using output directory: ${outputDirectory}`);

    // Read the Excel file
    const data = await excelFile.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    
    // If no sheets, throw an error
    if (workbook.SheetNames.length === 0) {
      throw new Error("Engin vinnublöð fundust í Excel skránni.");
    }
    
    let pdfCount = 0;
    const currentDate = new Date().toISOString().split("T")[0];
    const normalizedDir = outputDirectory.replace(/[\/\\]+$/, "");
    
    // Process each sheet in the workbook
    for (const sheetName of workbook.SheetNames) {
      try {
        console.log(`Processing sheet: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert sheet to JSON
        const sheetData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
          header: 1,
          defval: "",
        });
        
        // Skip empty sheets
        if (!sheetData || sheetData.length === 0) {
          console.warn(`Skipping empty sheet: ${sheetName}`);
          continue;
        }
        
        // Create PDF for this sheet
        const pdf = new jsPDF();
        
        // Add header
        pdf.setFont("helvetica", "bold");
        pdf.text(`${sheetName}`, 14, 15);
        
        // Generate the table - use all data from the sheet
        autoTable(pdf, {
          head: [sheetData[0]],
          body: sheetData.slice(1),
          startY: 20,
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
        
        // Create safe filename from sheet name
        const safeFileName = sheetName.replace(/[^a-z0-9áðéíóúýþæöÁÐÉÍÓÚÝÞÆÖ]/gi, "_");
        const pdfPath = `${normalizedDir}/${safeFileName}_${currentDate}.pdf`;
        
        // Write PDF to disk
        const pdfBlob = pdf.output("arraybuffer");
        const success = await writePdfToDisk(pdfPath, pdfBlob);
        
        if (success) {
          pdfCount++;
          console.log(`PDF created for sheet: ${sheetName}`);
        }
      } catch (sheetError) {
        console.error(`Error processing sheet ${sheetName}:`, sheetError);
        // Continue with other sheets instead of failing completely
      }
    }
    
    console.log(`PDF generation finished. Successfully generated: ${pdfCount} PDFs`);
    
    if (pdfCount === 0) {
      throw new Error(
        "Engar skrár voru vistaðar. Athugaðu hvort úttak mappa sé rétt valin og skráarheimild sé til staðar."
      );
    }
    
    return pdfCount;
  } catch (error: any) {
    console.error("Error generating PDFs:", error);
    throw new Error(
      error instanceof Error ? error.message : "Villa við að búa til PDF skjöl"
    );
  }
}
