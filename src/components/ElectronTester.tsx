
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiStatusDisplay } from './electron/ApiStatusDisplay';
import { ApiActions } from './electron/ApiActions';
import { DebugInfo } from './electron/DebugInfo';
import { useElectronAPI } from '@/hooks/useElectronAPI';

/**
 * A component that tests if the Electron API is correctly available
 * Refactored version with functionality split into smaller, focused components
 */
export function ElectronTester() {
  const [testOutputPath, setTestOutputPath] = useState<string | null>(null);
  const { apiStatus, isChecking, checkApi } = useElectronAPI();

  return (
    <Card className="w-full max-w-md mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Electron API Tester
          {apiStatus.available ? (
            <CheckCircle className="text-green-500" size={20} />
          ) : (
            <XCircle className="text-red-500" size={20} />
          )}
        </CardTitle>
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
            If API is unavailable, try restarting the application
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
