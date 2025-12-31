
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionType } from "./types";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const parseFinancialText = async (text: string): Promise<Transaction[]> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("مفتاح الـ API غير متوفر. يرجى إعداد المتغيرات البيئية بشكل صحيح.");
  }

  let lastError: any;
  const maxRetries = 2; // إجمالي المحاولات = 3

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // إنشاء نسخة جديدة في كل محاولة لضمان نظافة الطلب
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `تحليل النص المالي التالي المستخرج من محادثة واتساب واستخراج الحسابات بوضوح:
        
        النص: "${text}"`,
        config: {
          systemInstruction: `أنت محاسب خبير. مهمتك هي استخراج المعاملات المالية من نصوص واتساب غير المنظمة.
          - حدد العملة (مثل: USD للدوﻻر، TRY لليرة التركية، SYP لليرة السورية).
          - حدد المبلغ كرقم.
          - النوع: INCOMING (له)، OUTGOING (عليه)، UNKNOWN.
          - ارجع النتيجة كقائمة JSON حصراً.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                currency: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                type: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["currency", "amount", "type", "description"]
            }
          }
        }
      });

      if (!response || !response.text) {
        throw new Error("استجابة فارغة من الخادم.");
      }

      const parsed = JSON.parse(response.text.trim());
      return parsed.map((item: any, index: number) => ({
        ...item,
        id: `${Date.now()}-${index}`
      }));

    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed:`, error);

      // إذا كان الخطأ متعلقاً بالشبكة (Failed to fetch) نقوم بإعادة المحاولة
      const isNetworkError = error.message?.includes('fetch') || error.name === 'TypeError';
      
      if (isNetworkError && attempt < maxRetries) {
        // تأخير زمني متزايد: 1 ثانية ثم 2 ثانية
        await delay(1000 * (attempt + 1));
        continue;
      }
      
      // إذا لم يكن خطأ شبكة أو استنفدنا المحاولات، نكسر الحلقة ونرمي الخطأ
      break;
    }
  }

  // إذا وصلنا لهنا، فهذا يعني فشل جميع المحاولات
  if (lastError?.message?.includes('fetch')) {
    throw new Error("فشل الاتصال بالخادم الذكي. قد يكون السبب ضعف الإنترنت أو حجب الخدمة في منطقتك. يرجى تجربة الاتصال بشبكة أخرى أو استخدام VPN.");
  }
  
  throw lastError || new Error("حدث خطأ غير متوقع أثناء معالجة البيانات.");
};
