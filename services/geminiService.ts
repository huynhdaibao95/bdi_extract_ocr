import { GoogleGenAI } from "@google/genai";

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

export const extractDataFromImage = async (imageFile: File, prompt: string, apiKey: string): Promise<string> => {
  const effectiveApiKey = apiKey || process.env.API_KEY;

  if (!effectiveApiKey) {
    throw new Error("Không tìm thấy API Key. Vui lòng cung cấp key trong Cài đặt Nâng cao hoặc cấu hình biến môi trường.");
  }

  const ai = new GoogleGenAI({ apiKey: effectiveApiKey });

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
      // Bằng cách loại bỏ responseMimeType, chúng ta cho phép AI linh hoạt hơn
      // trong việc trả về văn bản thuần túy hoặc JSON dựa trên prompt.
    });

    return response.text;

  } catch (error) {
    console.error("Lỗi khi gọi Gemini API:", error);
    
    if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID'))) {
        throw new Error("API Key không hợp lệ. Vui lòng kiểm tra lại trong Cài đặt Nâng cao.");
    }
    throw new Error("Không thể trích xuất dữ liệu từ API. Hãy kiểm tra kết nối mạng và API Key.");
  }
};