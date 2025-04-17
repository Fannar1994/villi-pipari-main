
import * as XLSX from "xlsx";

/**
 * Reads an Excel file and returns the workbook
 */
export function readExcelFile(excelFile: File): Promise<XLSX.WorkBook> {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      
      // Validate the workbook
      if (!workbook || workbook.SheetNames.length === 0) {
        reject(new Error("Engin vinnublöð fundust í Excel skránni."));
        return;
      }
      
      resolve(workbook);
    } catch (error) {
      console.error("Error reading Excel file:", error);
      reject(new Error("Villa við að lesa Excel skrá"));
    }
  });
}

/**
 * Converts a worksheet to JSON data
 */
export function worksheetToJson(worksheet: XLSX.WorkSheet): any[][] {
  // Convert sheet to JSON
  return XLSX.utils.sheet_to_json<any[]>(worksheet, {
    header: 1,
    defval: "",
  });
}

/**
 * Checks if a sheet has data
 */
export function sheetHasData(sheetData: any[][]): boolean {
  return !!(sheetData && sheetData.length > 0);
}
