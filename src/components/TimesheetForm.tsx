
import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DirectorySelect } from '@/components/DirectorySelect';
import { FileSpreadsheet, FileText, FolderOutput } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TimesheetEntry } from '@/types/timesheet';

interface TimesheetFormProps {
  timesheetFile: File | null;
  setTimesheetFile: (file: File | null) => void;
  templateFile: File | null;
  setTemplateFile: (file: File | null) => void;
  outputDir: string;
  setOutputDir: (dir: string) => void;
  isProcessing: boolean;
}

export const TimesheetForm: React.FC<TimesheetFormProps> = ({
  timesheetFile,
  setTimesheetFile,
  templateFile,
  setTemplateFile,
  outputDir,
  setOutputDir,
  isProcessing
}) => {
  return (
    <CardContent className="space-y-6 pt-6 bg-card text-foreground">
      <FileUpload
        value={timesheetFile}
        onChange={setTimesheetFile}
        label="Vinnuskýrsla skrá"
        accept=".xlsx,.xls"
        icon={<FileSpreadsheet className="mr-2 h-4 w-4 text-primary" />}
        disabled={isProcessing}
      />
      
      <FileUpload
        value={templateFile}
        onChange={setTemplateFile}
        label="Sniðmát skrá (valfrjálst)"
        accept=".xlsx,.xls"
        icon={<FileText className="mr-2 h-4 w-4 text-primary" />}
        disabled={isProcessing}
      />
      
      <DirectorySelect
        value={outputDir}
        onChange={setOutputDir}
        label="Úttak mappa"
        icon={<FolderOutput className="mr-2 h-4 w-4 text-primary" />}
        disabled={isProcessing}
      />
      
      <Separator className="bg-primary/30" />
    </CardContent>
  );
};
