
import React from 'react';
import { Check, X } from 'lucide-react';

interface ApiInformationProps {
  apiAvailable: boolean;
  apiObject: string;
  apiMethods: {[key: string]: boolean};
}

export function ApiInformation({ apiAvailable, apiObject, apiMethods }: ApiInformationProps) {
  return (
    <div className="space-y-1 text-xs">
      <p className="font-semibold">API Status:</p>
      <div className="flex items-center gap-1">
        <span>API Available:</span>
        {apiAvailable ? 
          <Check size={14} className="text-green-500" /> : 
          <X size={14} className="text-red-500" />}
        <span className="text-xs text-gray-500 ml-1">({apiObject})</span>
      </div>
      {Object.entries(apiMethods).map(([method, available]) => (
        <div key={method} className="flex items-center gap-1 pl-2">
          <span>{method}:</span>
          {available ? 
            <Check size={14} className="text-green-500" /> : 
            <X size={14} className="text-red-500" />}
        </div>
      ))}
    </div>
  );
}
