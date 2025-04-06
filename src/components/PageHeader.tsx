
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const PageHeader: React.FC = () => {
  return (
    <CardHeader className="border-b border-primary bg-card">
      <CardTitle className="text-2xl text-foreground">Villi Pípari</CardTitle>
      <CardDescription className="text-muted-foreground">
        Búðu til reikninga út frá Excel vinnuskýrslum
      </CardDescription>
    </CardHeader>
  );
};
