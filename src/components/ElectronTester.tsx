
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, Terminal, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiStatusDisplay } from './electron/ApiStatusDisplay';
import { ApiActions } from './electron/ApiActions';
import { DebugInfo } from './electron/DebugInfo';
import { useElectronAPI } from '@/hooks/useElectronAPI';
import { Button } from './ui/button';
import { enableEmergencyMode } from '@/lib/electron/emergency-mode';
import { startApiMonitor } from '@/lib/electron/api-listener';
import { toast } from '@/hooks/use-toast';

/**
 * A component that tests if the Electron API is correctly available
 * Hidden by default, can be shown with a special button
 */
export function ElectronTester() {
  const [testOutputPath, setTestOutputPath] = useState<string | null>(null);
  const { apiStatus, isChecking, checkApi } = useElectronAPI();
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isEnablingEmergency, setIsEnablingEmergency] = useState<boolean>(false);

  // Auto-start API monitor
  useEffect(() => {
    startApiMonitor();
  }, []);
  
  // Handle emergency mode
  const handleEmergencyMode = () => {
    setIsEnablingEmergency(true);
    
    try {
      console.log('🛡️ Activating emergency mode manually...');
      const success = enableEmergencyMode();
      
      if (success) {
        toast({
          title: "Neyðarhamur virkjaður",
          description: "API hefur verið endurheimt í neyðarham",
        });
        // Refresh API status
        checkApi();
      } else {
        toast({
          title: "Villa við virkjun neyðarhams",
          description: "Ekki tókst að endurvirkja API. Prófaðu að endurræsa forritið.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error enabling emergency mode:', error);
    } finally {
      setIsEnablingEmergency(false);
    }
  };

  if (!isVisible) {
    return (
      <div className="text-xs text-right mb-2">
        <Button 
          variant="ghost" 
          size="sm"
          className="opacity-50 hover:opacity-100"
          onClick={() => setIsVisible(true)}
        >
          <Terminal size={14} className="mr-1" />
          Show API Tester
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mb-4">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="flex items-center gap-2">
          Electron API Tester
          {apiStatus.available ? (
            <CheckCircle className="text-green-500" size={20} />
          ) : (
            <XCircle className="text-red-500" size={20} />
          )}
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsVisible(false)}
          className="h-8 w-8 p-0 rounded-full"
        >
          ×
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <Tabs defaultValue="status">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-3">
            <ApiStatusDisplay 
              apiStatus={apiStatus}
              isChecking={isChecking}
              onRefresh={checkApi}
            />
            
            <Button
              variant="default"
              size="sm"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleEmergencyMode}
              disabled={isEnablingEmergency}
            >
              {isEnablingEmergency ? (
                <>
                  <Shield className="mr-1 h-4 w-4 animate-pulse" />
                  Virkja...
                </>
              ) : (
                <>
                  <Shield className="mr-1 h-4 w-4" />
                  Virkja neyðarham
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="actions" className="space-y-3">
            <ApiActions 
              apiStatus={apiStatus}
              testOutputPath={testOutputPath}
              setTestOutputPath={setTestOutputPath}
            />
          </TabsContent>
          
          <TabsContent value="debug" className="space-y-3">
            <DebugInfo />
          </TabsContent>
        </Tabs>
        
        <div className="text-sm text-amber-600 flex items-center gap-1 mt-2">
          <AlertTriangle size={16} />
          <span>
            If API is unavailable, try activating emergency mode or restarting the application
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
