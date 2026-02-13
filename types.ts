
export interface TennisAnalysis {
  shotType: string;
  postureAnalysis: string;
  balanceLevel: string;
  courtPositioning: string;
  improvementTips: string[];
}

export interface ShotIdealMetrics {
  ideal_elbow_angle: [number, number];
  ideal_back_angle: [number, number];
  ideal_knee_bend: [number, number];
  common_mistakes: string[];
  correction_tips: string[];
}

export interface TennisKnowledgeBase {
  [key: string]: ShotIdealMetrics;
}

export interface LivePerformanceAnalysis {
  shotType: string;
  postureStatus: 'Correct' | 'Needs Adjustment';
  gripStatus: string;
  accuracyScore: number;
  stabilityScore: number;
  mistakes: string[];
  recommendations: string[];
  elbowAngle: number;
  backAngle: number;
  kneeAngle: number;
}

export interface LiveMetrics extends LivePerformanceAnalysis {
  shoulderBalance: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  isAnalysis?: boolean;
  analysisData?: TennisAnalysis;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type AppMode = 'UPLOAD' | 'LIVE';
