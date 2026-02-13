
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { TennisAnalysis, LivePerformanceAnalysis } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export const analyzeTennisImage = async (base64Image: string): Promise<TennisAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: "قم بتحليل أداء لاعب التنس في هذه الصورة. حدد نوع الضربة، وقيم وضعية الجسم، وقيم مستوى التوازن، وحدد التمركز في الملعب. قدم نصائح محددة للتحسين. يجب أن تكون جميع النصوص باللغة العربية الفصحى. أرجع البيانات بتنسيق JSON صالح."
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          shotType: { type: Type.STRING, description: "نوع الضربة (مثلاً: ضربة أمامية، ضربة خلفية، إرسال، ضربة طائرة)" },
          postureAnalysis: { type: Type.STRING, description: "تحليل مفصل لمحاذاة الأطراف واشتباك الجذع باللغة العربية." },
          balanceLevel: { type: Type.STRING, description: "تقييم مركز الثقل باللغة العربية." },
          courtPositioning: { type: Type.STRING, description: "تحديد الموقع بالنسبة لخطوط الملعب باللغة العربية." },
          improvementTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "نصائح تقنية قابلة للتنفيذ باللغة العربية."
          }
        },
        required: ["shotType", "postureAnalysis", "balanceLevel", "courtPositioning", "improvementTips"]
      }
    }
  });

  if (!response.text) {
    throw new Error("لم يتم استلام أي تحليل من الذكاء الاصطناعي.");
  }

  return JSON.parse(response.text.trim()) as TennisAnalysis;
};

export const refineLiveAnalysis = async (data: LivePerformanceAnalysis): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const prompt = `بصفتك مدرب تنس محترف، قم بتحويل بيانات التتبع المباشر هذه إلى ملخص موجز واحترافي باللغة العربية فقط:
  نوع الضربة: ${data.shotType}
  دقة الأداء: ${data.accuracyScore}%
  درجة الثبات: ${data.stabilityScore}%
  الأخطاء المكتشفة: ${data.mistakes.join(', ')}
  التوصيات: ${data.recommendations.join(', ')}
  
  ركز على الدقة التقنية. اجعل النص أقل من 60 كلمة وباللغة العربية الفصحى حصراً.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt
  });

  return response.text || "استمر في تحسين أدائك!";
};

export const chatWithGemini = async (prompt: string, history: {role: string, parts: {text: string}[]}[] = []): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const chat = ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: "أنت مدرب تنس عالمي خبير بخبرة 30 عاماً. تقدم ملاحظات تقنية، نصائح تكتيكية، ودعماً تحفيزياً. يجب أن تكون جميع إجاباتك باللغة العربية الفصحى حصراً، وبأسلوب احترافي وموجز وتقني عالي المستوى."
    }
  });

  const response = await chat.sendMessage({ message: prompt });
  return response.text || "عذراً، لم أتمكن من معالجة هذا الطلب حالياً.";
};
