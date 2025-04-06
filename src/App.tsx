
import React, { useEffect } from 'react';
import './App.css'; // Import the CSS file
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { toast } from "./hooks/use-toast";
import { isElectronAPIAvailable, getElectronAPI } from './lib/electron/api';

const queryClient = new QueryClient();

const App = () => {
  // Run API checks on mount
  useEffect(() => {
    const checkElectronAPI = async () => {
      console.log('Electron API check (in React):', isElectronAPIAvailable() ? 'Available' : 'Not available');
      
      // Force refresh the API access
      const api = getElectronAPI();
      if (api && typeof api._testConnection === 'function') {
        try {
          const result = api._testConnection();
          console.log('API test result:', result);
          
          toast({
            title: 'Electron tenging virkar',
            description: 'Samband við skráakerfi er komið á',
          });
        } catch (e) {
          console.error('API test failed:', e);
          toast({
            title: 'Electron tenging ekki virk',
            description: 'Endurræstu forritið til að nota PDF virkni',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Electron tenging ekki virk',
          description: 'Endurræstu forritið til að nota PDF virkni',
          variant: 'destructive',
        });
      }
    };
    
    // Run the check after a short delay to let components mount
    setTimeout(checkElectronAPI, 1000);
  }, []);

  return (
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
};

export default App;
