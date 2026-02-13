
import React, { useState, useRef, useEffect } from 'react';
import { analyzeTennisImage, chatWithGemini, refineLiveAnalysis } from './services/geminiService';
import { TennisAnalysis, ChatMessage, AnalysisStatus, AppMode, LiveMetrics } from './types';
import { voiceService } from './services/voiceService';

// Components
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import AnalysisCard from './components/AnalysisCard';
import ChatBox from './components/ChatBox';
import LiveTracker from './components/LiveAnalysis/LiveTracker';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('LIVE');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [aiCooldown, setAiCooldown] = useState(0);
  const [isAutoCoaching, setIsAutoCoaching] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status, liveMetrics]);

  useEffect(() => {
    let timer: number;
    if (aiCooldown > 0) {
      timer = window.setInterval(() => {
        setAiCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [aiCooldown]);

  const handleImageUpload = async (base64: string) => {
    if (aiCooldown > 0) {
      setError(`يرجى الانتظار ${aiCooldown} ثانية.`);
      return;
    }

    setStatus(AnalysisStatus.LOADING);
    setError(null);

    try {
      const result = await analyzeTennisImage(base64);
      setMessages(prev => [...prev, 
        { role: 'user', content: 'تم رفع صورة للتحليل.' },
        { role: 'model', content: `اكتمل التحليل: ${result.shotType}`, isAnalysis: true, analysisData: result }
      ]);
      setStatus(AnalysisStatus.SUCCESS);
      setAiCooldown(10);
      voiceService.speak("اكتمل التحليل بنجاح.");
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || status === AnalysisStatus.LOADING) return;
    
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setStatus(AnalysisStatus.LOADING);
    setError(null);

    try {
      const responseText = await chatWithGemini(text);
      setMessages(prev => [...prev, { role: 'model', content: responseText }]);
      setStatus(AnalysisStatus.SUCCESS);
      voiceService.speak(responseText.substring(0, 100));
    } catch (err: any) {
      setError("تعذر الحصول على رد. تأكد من اتصال الإنترنت وإعدادات الموقع.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      voiceService.listen(
        (text) => { handleSendMessage(text); setIsListening(false); },
        () => setIsListening(false)
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      
      <div className="max-w-5xl mx-auto w-full px-4 pt-4 flex flex-col gap-4">
        <div className="flex gap-3">
          <button 
            onClick={() => setMode('LIVE')}
            className={`flex-1 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 border-2 ${mode === 'LIVE' ? 'bg-[#00ff88] text-slate-950 border-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.3)]' : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'}`}
          >
            التحليل المباشر
          </button>
          <button 
            onClick={() => setMode('UPLOAD')}
            className={`flex-1 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 border-2 ${mode === 'UPLOAD' ? 'bg-[#00ff88] text-slate-950 border-[#00ff88]' : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'}`}
          >
            رفع صورة
          </button>
        </div>

        {mode === 'LIVE' && (
          <div className="flex items-center justify-between glass-card p-3 border-[#00ff88]/20 border">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isAutoCoaching ? 'bg-[#00ff88] shadow-[0_0_8px_#00ff88]' : 'bg-slate-700'}`}></div>
              <span className="text-xs font-black text-slate-300">التدريب الصوتي التلقائي</span>
            </div>
            <button 
              onClick={() => setIsAutoCoaching(!isAutoCoaching)}
              className={`w-12 h-6 rounded-full transition-all relative ${isAutoCoaching ? 'bg-[#00ff88]' : 'bg-slate-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAutoCoaching ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
        )}
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 flex flex-col gap-6 overflow-hidden">
        {mode === 'UPLOAD' ? (
          <div className="shrink-0">
            <ImageUploader onUpload={handleImageUpload} disabled={status === AnalysisStatus.LOADING} />
          </div>
        ) : (
          <div className="shrink-0 space-y-4">
            <LiveTracker onMetricsUpdate={setLiveMetrics} autoCoaching={isAutoCoaching} />
            {liveMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ScoreCard label="الدقة" score={liveMetrics.accuracyScore} color="#00ff88" />
                <ScoreCard label="الثبات" score={liveMetrics.stabilityScore} color="#00e5ff" />
                <MetricBox label="زاوية الكوع" value={`${liveMetrics.elbowAngle}°`} />
                <MetricBox label="ميلان الظهر" value={`${liveMetrics.backAngle}°`} />
              </div>
            )}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-12 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-3xl p-5 shadow-2xl ${msg.role === 'user' ? 'bg-[#00ff88] text-slate-950 font-black' : 'bg-slate-900 border border-slate-800'}`}>
                {msg.isAnalysis && msg.analysisData ? <AnalysisCard analysis={msg.analysisData} /> : <p className="font-bold">{msg.content}</p>}
              </div>
            </div>
          ))}

          {status === AnalysisStatus.LOADING && (
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 w-fit">جارٍ التحليل...</div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl text-red-200 text-sm font-bold">
              {error}
            </div>
          )}
        </div>
      </main>

      <footer className="sticky bottom-0 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-900 p-5">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={toggleMic} className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-900 text-[#00ff88] border border-slate-800'}`}>
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z" /><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" /></svg>
          </button>
          <div className="flex-1">
            <ChatBox onSend={handleSendMessage} disabled={status === AnalysisStatus.LOADING} />
          </div>
        </div>
      </footer>
    </div>
  );
};

const ScoreCard = ({ label, score, color }: { label: string, score: number, color: string }) => {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
      <div className="relative w-12 h-12 mb-2">
        <svg className="score-circle w-full h-full" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          <circle cx="25" cy="25" r={radius} fill="transparent" stroke={color} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{score}%</span>
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase">{label}</p>
    </div>
  );
};

const MetricBox = ({ label, value }: { label: string, value: string }) => (
  <div className="glass-card p-4 text-center">
    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{label}</p>
    <p className="text-xl font-black text-white italic">{value}</p>
  </div>
);

export default App;
