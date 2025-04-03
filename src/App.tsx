import React from 'react';
import './App.css'; // Import the CSS file
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import * as XLSX from 'xlsx';

const queryClient = new QueryClient();
console.log("ElectronAPI test:", window.electronAPI);
console.log("ElectronAPI writeFile test:", window.electronAPI?.writeFile);

const outputArrayBuffer = new ArrayBuffer(0); // Replace with actual data
const workbook = XLSX.read(outputArrayBuffer, { type: 'array' });
console.log('Workbook sheets:', workbook.SheetNames);
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
console.log('Extracted data:', jsonData);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;