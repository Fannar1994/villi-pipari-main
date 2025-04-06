
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/FileUpload";
import { DirectorySelect } from "@/components/DirectorySelect";
import { FileSpreadsheet, InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { parseTimesheetFile } from "@/lib/timesheet/parser";
import { generatePdfFiles } from "@/lib/timesheet/pdfGenerator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export const ExcelTab = () => {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [outputDir, setOutputDir] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState("");
  const [isElectronApp, setIsElectronApp] = useState(false);

  // Check if we're running in Electron on component mount
  useEffect(() => {
    // More thorough check for Electron environment
    const isElectron = 
      window.isElectron === true || 
      (typeof window !== 'undefined' && 
       typeof window.electron !== 'undefined' && 
       typeof window.electron.writeFile === 'function');
    
    setIsElectronApp(isElectron);
    console.log("Running in Electron environment:", isElectron);
    console.log("Window electron object:", window.electron ? "Available" : "Not available");
  }, []);

  const handleExport = async () => {
    if (!excelFile) {
      toast({
        title: "Villa",
        description: "Vinsamlegast veldu Excel skrá.",
        variant: "destructive",
      });
      return;
    }

    if (!outputDir) {
      toast({
        title: "Villa",
        description: "Vinsamlegast veldu úttak möppu.",
        variant: "destructive",
      });
      return;
    }

    if (!isElectronApp) {
      toast({
        title: "Ekki stutt",
        description: "PDF útflutningur er aðeins í boði í Electron útgáfunni.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProcessStatus("Vinnur að PDF skjölum...");

      // Generate PDF files directly from Excel file without parsing
      const pdfCount = await generatePdfFiles(excelFile, outputDir);

      toast({
        title: "Árangur!",
        description: `${pdfCount} PDF skjöl hafa verið búin til.`,
      });

      setProcessStatus(
        `${pdfCount} PDF skjöl hafa verið búin til í ${outputDir}`
      );
    } catch (error: any) {
      console.error("Error generating PDFs:", error);
      setProcessStatus("Villa kom upp við að búa til PDF skjöl.");
      toast({
        title: "Villa",
        description:
          error instanceof Error
            ? error.message
            : "Villa við að búa til PDF skjöl.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <CardContent className="space-y-6 pt-6 bg-card text-foreground">
        {!isElectronApp && (
          <Alert variant="destructive" className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>ATH: PDF útflutningur er aðeins í boði í Electron útgáfunni</AlertTitle>
            <AlertDescription>
              Þú ert að keyra forritið í vafra. Fyrir PDF útflutning þarftu að nota skjáborðsútgáfuna.
            </AlertDescription>
          </Alert>
        )}

        <FileUpload
          value={excelFile}
          onChange={setExcelFile}
          label="Excel skrá"
          accept=".xlsx,.xls"
          icon={<FileSpreadsheet className="mr-2 h-4 w-4 text-primary" />}
          disabled={isProcessing || !isElectronApp}
        />

        <DirectorySelect
          value={outputDir}
          onChange={setOutputDir}
          label="Úttak mappa"
          disabled={isProcessing || !isElectronApp}
        />

        <Separator className="bg-primary/30" />
      </CardContent>

      <div className="px-6 py-3">
        {processStatus && (
          <p className="text-sm text-muted-foreground">{processStatus}</p>
        )}
      </div>

      <div className="border-t border-primary bg-card p-4">
        <Button
          onClick={handleExport}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isProcessing || !isElectronApp}
        >
          {isProcessing ? "Vinnur..." : "Búa til PDF skjöl"}
        </Button>
      </div>
    </>
  );
};
