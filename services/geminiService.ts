import { GoogleGenAI } from "@google/genai";
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

export const extractDataFromImage = async (
  imageFile: File, 
  apiKey: string, 
  prompt: string
): Promise<{ parsedData: ExtractedRecord[], rawText: string }> => {
  if (!apiKey) {
    throw new Error("API key is not provided.");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey });

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
      },
    });

    let jsonText = response.text.trim();

    // Handle cases where the JSON is wrapped in a code block
    const codeBlockMatch = jsonText.match(/```json\n([\s\S]*)\n```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      jsonText = codeBlockMatch[1];
    } else {
        // Fallback to finding the first valid array structure
        const arrayMatch = jsonText.match(/(\[[\s\S]*\])/);
        if (arrayMatch && arrayMatch[0]) {
            jsonText = arrayMatch[0];
        }
    }

    const parsedData = JSON.parse(jsonText) as ExtractedRecord[];
    return { parsedData, rawText: jsonText };

  } catch (error) {
    console.error("Lỗi khi gọi Gemini API hoặc phân tích JSON:", error);
     if (error instanceof SyntaxError) {
        throw new Error("Không thể phân tích dữ liệu JSON từ API. Phản hồi có thể không đúng định dạng.");
    }
    throw new Error("Không thể trích xuất dữ liệu từ API.");
  }
};