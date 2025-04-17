
import { isElectronAvailable, writePdfToDisk, validateOutputDirectory } from "../electron/electronUtils";
import { readExcelFile, worksheetToJson, sheetHasData } from "./excelProcessor";
import { createPdfFromSheetData, createSafeFilename } from "./pdfCreator";

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
    validateOutputDirectory(outputDirectory);
    
    // Read the Excel file
    const workbook = await readExcelFile(excelFile);
    
    let pdfCount = 0;
    const currentDate = new Date().toISOString().split("T")[0];
    const normalizedDir = outputDirectory.replace(/[\/\\]+$/, "");
    
    // Process each sheet in the workbook
    for (const sheetName of workbook.SheetNames) {
      try {
        console.log(`Processing sheet: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert sheet to JSON
        const sheetData = worksheetToJson(worksheet);
        
        // Skip empty sheets
        if (!sheetHasData(sheetData)) {
          console.warn(`Skipping empty sheet: ${sheetName}`);
          continue;
        }
        
        // Create PDF for this sheet
        const pdfBlob = createPdfFromSheetData(sheetName, sheetData);
        
        // Create safe filename and path
        const pdfFilename = createSafeFilename(sheetName, currentDate);
        const pdfPath = `${normalizedDir}/${pdfFilename}`;
        
        // Write PDF to disk
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
