import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedRecord } from '../types';

async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

export const extractDataFromImage = async (imageFile: File, prompt: string): Promise<ExtractedRecord[]> => {
  console.log("Sử dụng Gemini API mặc định qua Vercel Environment Variables.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = await fileToGenerativePart(imageFile);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          imagePart,
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              stt: {
                type: Type.STRING,
                description: "Số thứ tự"
              },
              ten: {
                type: Type.STRING,
                description: "Họ và tên đầy đủ"
              },
              soPhi: {
                type: Type.STRING,
                description: "Số tiền phí, có thể bao gồm ký hiệu tiền tệ và dấu phân cách"
              },
            },
          }
        }
      },
    });

    const jsonText = response.text;
    const parsedData = JSON.parse(jsonText) as ExtractedRecord[];
    return parsedData;

  } catch (error) {
    console.error("Lỗi khi gọi Gemini API hoặc phân tích JSON:", error);
      if (error instanceof SyntaxError) {
        throw new Error("Không thể phân tích dữ liệu JSON từ API. Phản hồi có thể không đúng định dạng.");
    }
    // Cung cấp thông báo lỗi rõ ràng hơn cho người dùng
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error("API Key không hợp lệ. Vui lòng kiểm tra lại trong cài đặt Vercel.");
    }
    throw new Error("Không thể trích xuất dữ liệu từ API. Hãy kiểm tra lại API Key và cấu hình.");
  }
};