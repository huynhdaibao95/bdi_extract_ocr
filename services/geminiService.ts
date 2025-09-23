
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

export const extractDataFromImage = async (imageFile: File, apiKey: string, prompt: string): Promise<ExtractedRecord[]> => {
  if (!apiKey) {
    throw new Error("API key is not provided.");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey });

  const imagePart = await fileToGenerativePart(imageFile);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            imagePart,
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              stt: {
                type: Type.STRING,
                description: 'Số thứ tự của hàng.',
              },
              ten: {
                type: Type.STRING,
                description: 'Họ và tên đầy đủ.',
              },
              soPhi: {
                type: Type.STRING,
                description: 'Số tiền phí, có thể bao gồm ký hiệu tiền tệ.',
              },
            },
            required: ['stt', 'ten', 'soPhi'],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText) as ExtractedRecord[];
    return parsedData;

  } catch (error) {
    console.error("Lỗi khi gọi Gemini API:", error);
    throw new Error("Không thể trích xuất dữ liệu từ API.");
  }
};