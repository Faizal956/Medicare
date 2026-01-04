
import React from 'react';
import { InteractionResult } from '../types';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';

interface InteractionAlertProps {
  result: InteractionResult;
  t: any;
}

const InteractionAlert: React.FC<InteractionAlertProps> = ({ result, t }) => {
  if (!result.hasConflict || result.severity === 'none') return null;

  const isHigh = result.severity === 'high';

  return (
    <div className={`rounded-2xl border-l-8 p-5 mb-6 animate-in slide-in-from-top-4 duration-500 ${
      isHigh ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500'
    }`}>
      <div className="flex gap-4">
        <div className={`p-2 rounded-full h-fit ${isHigh ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
          <AlertTriangle size={24} />
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg mb-1 ${isHigh ? 'text-red-900' : 'text-orange-900'}`}>
            {t.conflictDetected}
          </h3>
          <p className="text-sm font-medium text-slate-700 mb-3 leading-relaxed">
            {result.explanation}
          </p>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold ${
            isHigh ? 'bg-red-200/50 text-red-800' : 'bg-orange-200/50 text-orange-800'
          }`}>
            <ShieldAlert size={16} />
            {result.recommendation}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractionAlert;
