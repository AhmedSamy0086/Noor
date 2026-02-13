
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 py-4 px-6 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-[#00ff88] rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(0,255,136,0.6)] rotate-6 transition-transform hover:rotate-0">
               <span className="text-slate-950 font-black text-2xl">N</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-slate-950 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-[#00ff88] rounded-full"></div>
            </div>
          </div>
          
          <div className="flex flex-col items-start leading-none">
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <span className="text-3xl noor-glow">نور</span> 
              <span className="text-slate-100">للتدريب الذكي</span>
            </h1>
            <span className="text-[9px] font-black text-[#00ff88]/70 tracking-[0.2em] uppercase mt-1">Noor Smart Coaching</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-[#00ff88] bg-[#00ff88]/10 px-3 py-1 rounded-full border border-[#00ff88]/30">النسخة الاحترافية v2.5</span>
            <span className="text-[8px] text-slate-500 font-bold mt-1 uppercase">Powered by ACE Engine</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
