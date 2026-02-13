
import React from 'react';
import { TennisAnalysis } from '../types';

interface Props {
  analysis: TennisAnalysis;
}

const AnalysisCard: React.FC<Props> = ({ analysis }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="text-lg font-black text-[#00ff88] flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00ff88] shadow-[0_0_10px_#00ff88]"></div>
          تقرير جيمناي الاحترافي: {translateShot(analysis.shotType).toUpperCase()}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnalysisItem label="تحليل الوضعية" text={analysis.postureAnalysis} />
        <AnalysisItem label="تقييم التوازن" text={analysis.balanceLevel} />
        <div className="md:col-span-2">
           <AnalysisItem label="التمركز في الملعب" text={analysis.courtPositioning} />
        </div>
      </div>

      <div className="bg-[#00ff88]/5 border border-[#00ff88]/20 p-4 rounded-xl">
        <h4 className="text-xs font-black text-[#00ff88] mb-3 flex items-center gap-2 uppercase tracking-widest">
          تمارين مقترحة للتحسين
        </h4>
        <ul className="space-y-3">
          {analysis.improvementTips.map((tip, idx) => (
            <li key={idx} className="text-sm text-slate-300 flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-[#00ff88]/20 text-[#00ff88] flex items-center justify-center shrink-0 font-black text-xs">{idx + 1}</div>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const translateShot = (shot: string) => {
    const dict: any = {
      'forehand': 'ضربة أمامية',
      'backhand': 'ضربة خلفية',
      'serve': 'إرسال',
      'volley': 'ضربة طائرة'
    };
    return dict[shot.toLowerCase()] || shot;
};

const AnalysisItem = ({ label, text }: { label: string, text: string }) => (
  <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</h4>
    <p className="text-sm text-slate-300 leading-relaxed font-bold">{text}</p>
  </div>
);

export default AnalysisCard;
