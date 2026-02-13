
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
  const [cameraError, setCameraError] = useState<string | null>(null);

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
    const { errorStartTime, lastVoiceTime, lastAccuracy } = coachingState.current;

    if (analysis.accuracyScore >= 85 && lastAccuracy < 65) {
      if (now - lastVoiceTime > 8000) {
        voiceService.speak("ممتاز، كده أفضل");
        coachingState.current.lastVoiceTime = now;
      }
    }
    coachingState.current.lastAccuracy = analysis.accuracyScore;

    if (analysis.accuracyScore < 75 && analysis.mistakes.length > 0) {
      if (errorStartTime === 0) {
        coachingState.current.errorStartTime = now;
      } else if (now - errorStartTime > 2000) {
        if (now - lastVoiceTime > 5000) {
          const currentMistake = analysis.mistakes[0];
          let advice = "عدل وضعيتك";
          if (currentMistake.includes('الكوع')) advice = "عدل وضعية الكوع";
          if (currentMistake.includes('الجذع') || currentMistake.includes('للخلف')) advice = "افرد ظهرك";
          if (currentMistake.includes('الركبتين') || currentMistake.includes('الساقين')) advice = "اثنِ ركبتيك قليلاً";

          voiceService.speak(advice);
          coachingState.current.lastVoiceTime = now;
        }
      }
    } else {
      coachingState.current.errorStartTime = 0;
    }
  };

  useEffect(() => {
    let pose: any;
    let stream: MediaStream | null = null;
    let animationId: number;

    const startTracking = async () => {
      if (!isActive) return;
      setCameraError(null);

      try {
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

          const detectedShot = (lm: any) => {
            if (lm[16].y < lm[12].y && lm[15].y < lm[11].y) return 'serve';
            if (lm[16].x < lm[11].x) return 'backhand';
            if (lm[26].y - lm[16].y < 0.2) return 'ready_position';
            return 'forehand';
          };

          const shot = detectedShot(lm);
          const ideal = tennisKnowledgeBase[shot] || tennisKnowledgeBase['ready_position'];
          const mistakes: string[] = [];
          if (eAngle < ideal.ideal_elbow_angle[0]) mistakes.push(ideal.common_mistakes[0]);
          if (bAngle > ideal.ideal_back_angle[1]) mistakes.push(ideal.common_mistakes[1]);
          
          const acc = Math.max(0, Math.min(100, 100 - (mistakes.length * 20)));
          const analysis: LivePerformanceAnalysis = {
            shotType: shot,
            postureStatus: acc > 80 ? 'Correct' : 'Needs Adjustment',
            gripStatus: 'Good',
            accuracyScore: acc,
            stabilityScore: Math.max(0, 100 - Math.round(sBal * 5)),
            mistakes,
            recommendations: mistakes.length > 0 ? [ideal.correction_tips[0]] : [],
            elbowAngle: Math.round(eAngle),
            backAngle: Math.round(bAngle),
            kneeAngle: Math.round(kAngle)
          };

          processAutoCoaching(analysis);
          const metrics = { ...analysis, shoulderBalance: Math.round(sBal) };
          setCurrentMetrics(metrics);
          onMetricsUpdate(metrics);
          ctx.restore();
        });

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // محاولة تشغيل الكاميرا بمرونة
        const constraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: isMobile ? "environment" : "user"
          }
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
          console.warn("Retrying with simple constraints...");
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
      } catch (err: any) {
        console.error("Camera access failed:", err);
        setCameraError(err.name === 'NotAllowedError' ? "تم رفض الإذن بالكاميرا." : "تعذر الوصول للكاميرا. تأكد من استخدام HTTPS.");
        setIsActive(false);
      }
    };

    startTracking();
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (pose) pose.close();
    };
  }, [isActive]);

  return (
    <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl neon-border">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale-[50%]" playsInline muted />
      <canvas ref={canvasRef} width="640" height="480" className="absolute inset-0 w-full h-full object-cover" />
      
      {!isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md px-6 text-center">
          {cameraError ? (
            <div className="text-red-400 font-bold mb-4">{cameraError}</div>
          ) : (
            <p className="mb-6 text-slate-300 font-bold">يرجى السماح بالوصول للكاميرا للبدء</p>
          )}
          <button 
            onClick={() => setIsActive(true)}
            className="neon-bg text-slate-950 font-black py-4 px-10 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
          >
            بدء التتبع المباشر
          </button>
        </div>
      )}

      {isActive && currentMetrics && (
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none gap-4">
          <div className="glass-card p-3 shadow-xl border-r-4 border-[#00ff88]">
            <p className="text-[10px] font-black text-[#00ff88] uppercase tracking-widest mb-1">الضربة</p>
            <p className="text-xl font-black text-white">{translateShot(currentMetrics.shotType)}</p>
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
          إيقاف
        </button>
      )}
    </div>
  );
};

export default LiveTracker;
