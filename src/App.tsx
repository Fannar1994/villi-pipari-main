
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

// Direct API initialization script
// This runs BEFORE React mounts to ensure API is ready when components render
const initializeElectronAPI = () => {
  console.log('🚀 Pre-mount Electron API initialization');
  
  // Check if API is available via window
  if (typeof window !== 'undefined') {
    console.log('Window object available, checking for Electron API');
    
    // Check primary location
    if (window.electron) {
      console.log('window.electron exists:', typeof window.electron);
      if (typeof window.electron.writeFile === 'function') {
        console.log('✅ Electron API is properly initialized');
        return true;
      } else {
        console.log('⚠️ window.electron exists but methods are missing');
      }
    } else {
      console.log('❌ window.electron does not exist');
    }
    
    // Check backup location
    if ((window as any).electronBackupAPI) {
      console.log('Backup API found, copying to window.electron');
      window.electron = (window as any).electronBackupAPI;
      return typeof window.electron.writeFile === 'function';
    }
    
    // Last resort: Setup emergency mode API
    // This creates a minimal but functional API that uses web APIs
    try {
      console.log('Setting up emergency API mode');
      
      // Force API initialization through our helper function
      const api = getElectronAPI();
      
      if (api && typeof api.selectDirectory === 'function') {
        console.log('✓ Emergency API initialized successfully');
        return true;
      }
    } catch (e) {
      console.error('Failed to initialize emergency API:', e);
    }
    
    // Last resort: Check if we're in Electron context by checking for process
    if (typeof process !== 'undefined' && process && (process as any).versions && (process as any).versions.electron) {
      console.log('Running in Electron:', (process as any).versions.electron);
      console.log('But API is not properly initialized');
    }
  }
  
  return false;
};

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
          
          // Check if we're in emergency mode
          if (result.preloadVersion && result.preloadVersion.includes('emergency')) {
            toast({
              title: 'Electron tenging í neyðarham',
              description: 'Forritið keyrir með takmarkaða virkni. Sumir eiginleikar virka ekki að fullu.',
              variant: 'destructive', // Changed from 'warning' to 'destructive'
            });
          } else {
            toast({
              title: 'Electron tenging virkar',
              description: 'Samband við skráakerfi er komið á',
            });
          }
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

  // Run initialization before rendering
  initializeElectronAPI();

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
