
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { TennisAnalysis, LivePerformanceAnalysis } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("مفتاح API غير موجود. تأكد من إضافته في إعدادات البيئة (Environment Variables).");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeTennisImage = async (base64Image: string): Promise<TennisAnalysis> => {
  try {
    const ai = getAIClient();
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
            shotType: { type: Type.STRING, description: "نوع الضربة (ضربة أمامية، ضربة خلفية، إرسال، ضربة طائرة)" },
            postureAnalysis: { type: Type.STRING, description: "تحليل مفصل لمحاذاة الأطراف باللغة العربية." },
            balanceLevel: { type: Type.STRING, description: "تقييم مركز الثقل باللغة العربية." },
            courtPositioning: { type: Type.STRING, description: "تحديد الموقع بالنسبة للملعب باللغة العربية." },
            improvementTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "نصائح تقنية باللغة العربية."
            }
          },
          required: ["shotType", "postureAnalysis", "balanceLevel", "courtPositioning", "improvementTips"]
        }
      }
    });

    if (!response.text) throw new Error("استجابة فارغة من الذكاء الاصطناعي.");
    return JSON.parse(response.text.trim()) as TennisAnalysis;
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    throw new Error(error.message || "فشل تحليل الصورة.");
  }
};

export const refineLiveAnalysis = async (data: LivePerformanceAnalysis): Promise<string> => {
  try {
    const ai = getAIClient();
    const prompt = `بصفتك مدرب تنس محترف، قم بتحويل بيانات التتبع المباشر هذه إلى ملخص موجز واحترافي باللغة العربية فقط:
    نوع الضربة: ${data.shotType}
    دقة الأداء: ${data.accuracyScore}%
    درجة الثبات: ${data.stabilityScore}%
    الأخطاء: ${data.mistakes.join(', ')}
    التوصيات: ${data.recommendations.join(', ')}
    اجعل النص أقل من 60 كلمة وباللغة العربية الفصحى حصراً.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt
    });

    return response.text || "استمر في تحسين أدائك!";
  } catch (error) {
    console.error("AI Refine Error:", error);
    return "تعذر الحصول على تحليل مفصل حالياً، استمر في التدريب!";
  }
};

export const chatWithGemini = async (prompt: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: "أنت مدرب تنس عالمي خبير (نظام نور). يجب أن تكون جميع إجاباتك باللغة العربية الفصحى حصراً، وبأسلوب احترافي وموجز."
      }
    });

    const response = await chat.sendMessage({ message: prompt });
    return response.text || "عذراً، لم أتمكن من المعالجة.";
  } catch (error: any) {
    console.error("Chat AI Error:", error);
    return `خطأ: ${error.message || "تعذر الاتصال بالمدرب الذكي."}`;
  }
};
