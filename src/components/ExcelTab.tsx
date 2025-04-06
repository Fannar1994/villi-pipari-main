
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileUpload } from '@/components/FileUpload';
import { DirectorySelect } from '@/components/DirectorySelect';
import { FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

export const ExcelTab = () => {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [outputDir, setOutputDir] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = async () => {
    if (!excelFile) {
      toast({
        title: 'Villa',
        description: 'Vinsamlegast veldu Excel skrá.',
        variant: 'destructive',
      });
      return;
    }

    if (!outputDir) {
      toast({
        title: 'Villa',
        description: 'Vinsamlegast veldu úttak möppu.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Just a placeholder for now - can be expanded with actual Excel processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Árangur!',
        description: 'Excel vinnuskýrsla hefur verið unnin.',
      });
      
    } catch (error) {
      console.error('Error processing Excel:', error);
      toast({
        title: 'Villa',
        description: 'Ekki tókst að vinna Excel skrá.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <CardContent className="space-y-6 pt-6 bg-card text-foreground">
        <FileUpload
          value={excelFile}
          onChange={setExcelFile}
          label="Excel skrá"
          accept=".xlsx,.xls"
          icon={<FileSpreadsheet className="mr-2 h-4 w-4 text-primary" />}
          disabled={isProcessing}
        />
        
        <DirectorySelect
          value={outputDir}
          onChange={setOutputDir}
          label="Úttak mappa"
          disabled={isProcessing}
        />
        
        <Separator className="bg-primary/30" />
      </CardContent>
      
      <div className="px-6 py-3">
        {isProcessing && <p className="text-sm text-muted-foreground">Vinnsla í gangi...</p>}
      </div>
      
      <div className="border-t border-primary bg-card p-4">
        <Button
          onClick={handleExport}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isProcessing}
        >
          {isProcessing ? 'Vinnur...' : 'Vinna Excel skrá'}
        </Button>
      </div>
    </>
  );
};
