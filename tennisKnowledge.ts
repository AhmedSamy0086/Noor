
import { TennisKnowledgeBase } from "../types";

export const tennisKnowledgeBase: TennisKnowledgeBase = {
  forehand: {
    ideal_elbow_angle: [150, 180],
    ideal_back_angle: [0, 15],
    ideal_knee_bend: [130, 160],
    common_mistakes: ["ثني الكوع بشكل مفرط عند التلامس", "ميل الجذع للخلف بشكل كبير", "فرد الساقين مما يؤدي لفقدان القوة"],
    correction_tips: ["قم بمد ذراعك الضاربة بالكامل", "حافظ على وزنك متجهاً للأمام قليلاً", "اخفض مركز ثقلك للحصول على ثبات أكبر"]
  },
  backhand: {
    ideal_elbow_angle: [140, 175],
    ideal_back_angle: [0, 10],
    ideal_knee_bend: [120, 150],
    common_mistakes: ["إنهاء الضربة غير مكتمل", "فقدان التوازن أثناء الحركة الجانبية", "مركز الثقل مرتفع أكثر من اللازم"],
    correction_tips: ["قم بتدوير الكتفين بالكامل", "تقدم خطوة نحو الكرة أثناء الضربة", "حافظ على انثناء الركبتين طوال الحركة"]
  },
  serve: {
    ideal_elbow_angle: [160, 180],
    ideal_back_angle: [5, 20],
    ideal_knee_bend: [110, 140],
    common_mistakes: ["سقوط الكوع مبكراً جداً", "دفع غير كافٍ من الركبتين", "سقوط ذراع الرمي بسرعة كبيرة"],
    correction_tips: ["مد ذراعك للأعلى لأقصى حد عند التلامس", "انطلق للأعلى بقوة باستخدام ساقيك", "حافظ على ذراع الرمي مرتفعة لفترة أطول"]
  },
  ready_position: {
    ideal_elbow_angle: [100, 130],
    ideal_back_angle: [10, 25],
    ideal_knee_bend: [120, 150],
    common_mistakes: ["الوقوف بشكل مستقيم جداً", "الكعبان ملتصقان بالأرض", "اليدان قريبتان جداً من الجسم"],
    correction_tips: ["ابقَ مستعداً على أطراف أصابعك", "فعل خطوة الانقسام (Split-step)", "اجعل المضرب أمام جسمك دائماً"]
  },
  volley: {
    ideal_elbow_angle: [110, 140],
    ideal_back_angle: [0, 10],
    ideal_knee_bend: [110, 140],
    common_mistakes: ["مرجحة خلفية كبيرة جداً", "سقوط رأس المضرب لأسفل", "الوقوف بوضعية مرتفعة"],
    correction_tips: ["استخدم حركة دفع قصيرة وقوية", "حافظ على ثبات المعصم", "انزل بمستوى جسمك للكرة"]
  }
};
