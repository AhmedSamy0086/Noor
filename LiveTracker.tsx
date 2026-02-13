
import React, { useRef, useEffect, useState } from 'react';
import { calculateAngle, calculateVerticalAngle } from '../../utils/poseMath';
import { LiveMetrics, LivePerformanceAnalysis } from '../../types';
import { tennisKnowledgeBase } from '../../constants/tennisKnowledge';
import { voiceService } from '../../services/voiceService';

interface Props {
  onMetricsUpdate: (metrics: LiveMetrics) => void;
  autoCoaching?: boolean;
}

const LiveTracker: React.FC<Props> = ({ onMetricsUpdate, autoCoaching }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<LiveMetrics | null>(null);

  // Auto-coaching refs
  const coachingState = useRef({
    errorStartTime: 0,
    lastVoiceTime: 0,
    lastAccuracy: 0,
    lastMistake: ''
  });

  const translateShot = (shot: string) => {
    const dict: any = {
      'forehand': 'ضربة أمامية',
      'backhand': 'ضربة خلفية',
      'serve': 'إرسال محترف',
      'volley': 'ضربة طائرة',
      'ready_position': 'وضعية الاستعداد'
    };
    return dict[shot.toLowerCase()] || shot;
  };

  const processAutoCoaching = (analysis: LivePerformanceAnalysis) => {
    if (!autoCoaching) return;

    const now = Date.now();
    const { errorStartTime, lastVoiceTime, lastAccuracy, lastMistake } = coachingState.current;

    // 1. Detect significant improvement
    if (analysis.accuracyScore >= 85 && lastAccuracy < 65) {
      if (now - lastVoiceTime > 8000) {
        voiceService.speak("ممتاز، كده أفضل");
        coachingState.current.lastVoiceTime = now;
        coachingState.current.lastAccuracy = analysis.accuracyScore;
        return;
      }
    }
    coachingState.current.lastAccuracy = analysis.accuracyScore;

    // 2. Handle persistent errors
    if (analysis.accuracyScore < 75 && analysis.mistakes.length > 0) {
      if (errorStartTime === 0) {
        coachingState.current.errorStartTime = now;
      } else if (now - errorStartTime > 2000) {
        // Persistent error detected (> 2s)
        if (now - lastVoiceTime > 5000) {
          const currentMistake = analysis.mistakes[0];
          // Determine Arabic advice
          let advice = "عدل وضعيتك";
          if (currentMistake.toLowerCase().includes('elbow')) advice = "عدل وضعية الكوع";
          if (currentMistake.toLowerCase().includes('back') || currentMistake.toLowerCase().includes('leaning')) advice = "افرد ظهرك";
          if (currentMistake.toLowerCase().includes('knee') || currentMistake.toLowerCase().includes('legs')) advice = "اثنِ ركبتيك";
          if (currentMistake.toLowerCase().includes('power')) advice = "تحرك بقوة أكبر";

          voiceService.speak(advice);
          coachingState.current.lastVoiceTime = now;
          coachingState.current.lastMistake = currentMistake;
        }
      }
    } else {
      coachingState.current.errorStartTime = 0;
    }
  };

  const analyzePerformance = (
    elbow: number, 
    back: number, 
    knee: number, 
    shoulderBal: number,
    shotType: string
  ): LivePerformanceAnalysis => {
    const ideal = tennisKnowledgeBase[shotType] || tennisKnowledgeBase['ready_position'];
    const mistakes: string[] = [];
    const recommendations: string[] = [];
    
    let accuracySubscores = 0;

    if (elbow < ideal.ideal_elbow_angle[0]) {
      mistakes.push(ideal.common_mistakes[0]);
      recommendations.push(ideal.correction_tips[0]);
      accuracySubscores += (elbow / ideal.ideal_elbow_angle[0]) * 33;
    } else { accuracySubscores += 33; }

    if (back > ideal.ideal_back_angle[1]) {
      mistakes.push(ideal.common_mistakes[1]);
      recommendations.push(ideal.correction_tips[1]);
      accuracySubscores += (1 - ((back - ideal.ideal_back_angle[1]) / 45)) * 33;
    } else { accuracySubscores += 33; }

    if (knee > ideal.ideal_knee_bend[1]) {
      mistakes.push(ideal.common_mistakes[2]);
      recommendations.push(ideal.correction_tips[2]);
      accuracySubscores += (1 - ((knee - ideal.ideal_knee_bend[1]) / 60)) * 34;
    } else { accuracySubscores += 34; }

    const accuracyScore = Math.max(0, Math.min(100, Math.round(accuracySubscores)));
    const stabilityScore = Math.max(0, 100 - Math.round(shoulderBal * 4) - Math.round(back * 0.5));

    return {
      shotType,
      postureStatus: accuracyScore > 80 ? 'Correct' : 'Needs Adjustment',
      gripStatus: 'Good',
      accuracyScore,
      stabilityScore,
      mistakes: Array.from(new Set(mistakes)),
      recommendations: Array.from(new Set(recommendations)),
      elbowAngle: Math.round(elbow),
      backAngle: Math.round(back),
      kneeAngle: Math.round(knee)
    };
  };

  const detectShotType = (landmarks: any): string => {
    const shoulderR = landmarks[12];
    const wristR = landmarks[16];
    const wristL = landmarks[15];
    const kneeR = landmarks[26];
    if (wristR.y < shoulderR.y && wristL.y < shoulderR.y) return 'serve';
    if (wristR.x < landmarks[11].x) return 'backhand';
    if (wristR.y < landmarks[24].y && Math.abs(wristR.x - shoulderR.x) < 0.1) return 'volley';
    if (kneeR.y - wristR.y < 0.2) return 'ready_position';
    return 'forehand';
  };

  useEffect(() => {
    let pose: any;
    let stream: MediaStream | null = null;
    let animationId: number;

    const startTracking = async () => {
      if (!isActive) return;
      const Pose = (window as any).Pose;
      pose = new Pose({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
      pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });

      pose.onResults((results: any) => {
        if (!canvasRef.current || !results.poseLandmarks) return;
        const ctx = canvasRef.current.getContext('2d')!;
        const drawingUtils = (window as any);
        ctx.save();
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        drawingUtils.drawConnectors(ctx, results.poseLandmarks, (window as any).POSE_CONNECTIONS, { color: '#00ff88', lineWidth: 5 });
        drawingUtils.drawLandmarks(ctx, results.poseLandmarks, { color: '#ffffff', lineWidth: 1, radius: 4 });

        const lm = results.poseLandmarks;
        const eAngle = calculateAngle(lm[12], lm[14], lm[16]);
        const bAngle = calculateVerticalAngle(lm[12], lm[24]);
        const kAngle = calculateAngle(lm[24], lm[26], lm[28]);
        const sBal = Math.abs(lm[12].y - lm[11].y) * 100;

        const detectedShot = detectShotType(lm);
        const analysis = analyzePerformance(eAngle, bAngle, kAngle, sBal, detectedShot);
        
        // Smart Auto Coaching Logic
        processAutoCoaching(analysis);

        const metrics = { ...analysis, shoulderBalance: Math.round(sBal) };
        setCurrentMetrics(metrics);
        onMetricsUpdate(metrics);
        ctx.restore();
      });

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: isMobile ? { exact: "environment" } : "user", width: 640, height: 480 }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current!.play();
        const process = async () => {
          if (pose && videoRef.current && isActive) {
            await pose.send({ image: videoRef.current });
            animationId = requestAnimationFrame(process);
          }
        };
        process();
      }
    };
    startTracking();
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (pose) pose.close();
    };
  }, [isActive, autoCoaching]);

  return (
    <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl neon-border">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale-[50%]" playsInline muted />
      <canvas ref={canvasRef} width="640" height="480" className="absolute inset-0 w-full h-full object-cover" />
      
      {!isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
          <button 
            onClick={() => setIsActive(true)}
            className="neon-bg text-slate-950 font-black py-4 px-10 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
          >
            بدء التتبع الذكي
          </button>
          <p className="mt-4 text-slate-400 text-sm font-bold">يتم اكتشاف نوع الضربة تلقائياً</p>
        </div>
      )}

      {isActive && currentMetrics && (
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none gap-4">
          <div className="flex flex-col gap-2">
            <div className="glass-card p-3 shadow-xl border-r-4 border-[#00ff88]">
              <p className="text-[10px] font-black text-[#00ff88] uppercase tracking-widest mb-1">الضربة الحالية</p>
              <p className="text-xl font-black text-white uppercase italic">{translateShot(currentMetrics.shotType)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-1 rounded-full border border-red-500/30">
             <div className="live-dot"></div>
             <span className="text-[10px] font-black text-red-500">مباشر</span>
          </div>
        </div>
      )}

      {isActive && (
        <button 
          onClick={() => setIsActive(false)}
          className="absolute bottom-4 right-4 bg-slate-900/80 hover:bg-red-500 text-slate-400 hover:text-white border border-slate-700 px-4 py-2 rounded-xl text-xs font-black transition-all"
        >
          إنهاء الجلسة
        </button>
      )}
    </div>
  );
};

export default LiveTracker;
