import React, { useState, useCallback } from 'react';
import { ExtractedRecord } from './types';
import { extractDataFromImage } from './services/geminiService';
import { exportDataToExcel } from './utils/fileUtils';
import ImageUploader from './components/ImageUploader';
import DataTable from './components/DataTable';
import { LoadingSpinner } from './components/Icons';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setExtractedData([]);
    setError(null);
  };

  const processImage = useCallback(async () => {
    if (!imageFile) {
      setError("Vui lòng tải lên một hình ảnh trước.");
      return;
    }
    if (!apiKey) {
      setError("Vui lòng nhập Google AI API Key của bạn.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedData([]);

    try {
      const data = await extractDataFromImage(imageFile, apiKey);
      if (data && data.length > 0) {
        setExtractedData(data);
      } else {
        setError("Không thể trích xuất dữ liệu từ hình ảnh. Vui lòng thử lại với hình ảnh rõ nét hơn.");
      }
    } catch (err) {
      console.error(err);
      setError("Đã xảy ra lỗi trong quá trình xử lý. Vui lòng kiểm tra lại API Key và hình ảnh của bạn.");
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, apiKey]);

  const handleDownload = () => {
    if (extractedData.length > 0) {
      exportDataToExcel(extractedData, 'du_lieu_trich_xuat');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 tracking-tight">
            Trích xuất Dữ liệu Tiếng Việt từ Ảnh
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
            Tải lên hình ảnh chứa bảng dữ liệu (chữ đánh máy hoặc viết tay) để tự động nhận diện và trích xuất thông tin.
          </p>
        </header>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-slate-700">Cấu hình API Key</h2>
            <label htmlFor="api-key" className="block text-sm font-medium text-slate-600 mb-2">
              Google AI API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Nhập API Key của bạn vào đây"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-slate-500 mt-2">
              API key của bạn chỉ được lưu trong trình duyệt và không được gửi đi bất cứ đâu.
              Bạn có thể lấy key tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google AI Studio</a>.
            </p>
        </div>


        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col">
            <h2 className="text-2xl font-semibold mb-4 text-slate-700">1. Tải ảnh lên</h2>
            <ImageUploader onImageUpload={handleImageUpload} />
            {imageUrl && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-3 text-slate-700">Xem trước ảnh:</h3>
                <div className="relative w-full h-80 rounded-lg overflow-hidden border-2 border-dashed border-slate-300">
                  <img src={imageUrl} alt="Xem trước" className="w-full h-full object-contain" />
                </div>
              </div>
            )}
            <button
              onClick={processImage}
              disabled={!imageFile || isLoading || !apiKey}
              className="mt-6 w-full flex justify-center items-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-all duration-300 shadow-md disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  <span>Trích xuất dữ liệu</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-slate-700">2. Kết quả</h2>
              <button
                onClick={handleDownload}
                disabled={extractedData.length === 0 || isLoading}
                className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-all duration-300 shadow-md disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-file-excel"></i>
                <span>Tải xuống Excel</span>
              </button>
            </div>

            <div className="flex-grow min-h-[300px] border-2 border-dashed border-slate-300 rounded-lg p-4 flex items-center justify-center">
              {isLoading ? (
                <div className="text-center text-slate-500">
                  <LoadingSpinner className="w-10 h-10 mb-4" />
                  <p>AI đang phân tích hình ảnh...</p>
                  <p className="text-sm">Quá trình này có thể mất một chút thời gian.</p>
                </div>
              ) : error ? (
                <div className="text-center text-red-500 bg-red-50 p-4 rounded-lg">
                  <i className="fa-solid fa-circle-exclamation text-2xl mb-2"></i>
                  <p className="font-semibold">Lỗi!</p>
                  <p>{error}</p>
                </div>
              ) : extractedData.length > 0 ? (
                <DataTable data={extractedData} />
              ) : (
                <div className="text-center text-slate-500">
                  <i className="fa-solid fa-table-list text-4xl mb-3"></i>
                  <p>Dữ liệu được trích xuất sẽ hiển thị ở đây.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;