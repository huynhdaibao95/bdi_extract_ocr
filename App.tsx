import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ExtractedRecord } from './types';
import { extractDataFromImage } from './services/geminiService';
import { exportDataToExcel } from './utils/fileUtils';
import ImageUploader from './components/ImageUploader';
import DataTable from './components/DataTable';
import { LoadingSpinner } from './components/Icons';

function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedRecord[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const progressIntervalRef = useRef<number | null>(null);

  const defaultPrompt = `Phân tích hình ảnh, có thể chứa cả chữ đánh máy và chữ viết tay.
Trích xuất dữ liệu từ bảng thành một mảng JSON (array of objects) với các cột sau:
stt (Số thứ tự)
hoten (Họ và tên)
phi (Phí, chỉ lấy giá trị số)
Yêu cầu quan trọng:
Độ chính xác: Đọc thật kỹ chữ viết tay. Hãy đặc biệt cẩn thận với các chữ cái viết tay dễ nhầm lẫn như 'k' và 'th', 'u' và 'v', và các dấu thanh (sắc ´ vs. huyền \`).
Xử lý cột "hoten":
Chỉ trích xuất tên người. Loại bỏ hoàn toàn thông tin về lớp học (ví dụ: 5A, 4C).
Đối với các họ viết tắt như "Ng", diễn giải thành "Nguyễn".
Đối với tên đệm viết tắt như "T.", diễn giải thành "Thị".
Xử lý cột "phi":
Chuyển đổi giá trị sang dạng số (ví dụ: 120.000 thành 120000).
Nếu ô trống, trả về giá trị null.`;

  const [prompt, setPrompt] = useState<string>(() => localStorage.getItem('customPrompt') || defaultPrompt);
  const [apiKey, setApiKey] = useState<string>('');
  const [rememberApiKey, setRememberApiKey] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [copyButtonText, setCopyButtonText] = useState<string>('Sao chép');

  useEffect(() => {
    const savedApiKey = localStorage.getItem('userApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setRememberApiKey(true);
    }
  }, []);

  useEffect(() => {
    if (prompt !== defaultPrompt) {
      localStorage.setItem('customPrompt', prompt);
    } else {
      localStorage.removeItem('customPrompt');
    }
  }, [prompt, defaultPrompt]);

  useEffect(() => {
    if (rememberApiKey) {
      localStorage.setItem('userApiKey', apiKey);
    } else {
      localStorage.removeItem('userApiKey');
    }
  }, [apiKey, rememberApiKey]);

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);


  const handleImageUpload = (file: File) => {
    if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
    }

    setImageFile(file);
    setImageUrl(null); 
    setExtractedData([]);
    setError(null);
    setAnalysisResult(null);

    if (file.type.startsWith('image/')) {
        setImageUrl(URL.createObjectURL(file));
    } else if (file.type === 'application/pdf') {
        // PDF được chấp nhận, nhưng không tạo bản xem trước.
    } else {
        setError("Định dạng file không được hỗ trợ. Vui lòng tải lên file ảnh hoặc PDF.");
        setImageFile(null);
    }
  };

  const processImage = useCallback(async () => {
    if (!imageFile) {
      setError("Vui lòng tải lên một hình ảnh trước.");
      return;
    }
    
    const effectiveApiKey = apiKey || process.env.API_KEY;
    if (!effectiveApiKey) {
        setError("Vui lòng cung cấp API Key trong phần 'Cài đặt Nâng cao' để tiếp tục.");
        setShowSettings(true);
        return;
    }

    setIsLoading(true);
    setProgress(0);
    setError(null);
    setExtractedData([]);
    setAnalysisResult(null);

    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Start simulated progress
    progressIntervalRef.current = window.setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return 95;
        }
        return prev + 1;
      });
    }, 150); // Increment every 150ms to simulate progress

    try {
      const resultText = await extractDataFromImage(imageFile, prompt, apiKey);
      setAnalysisResult(resultText); 

      if (!resultText) {
        setError("AI không trả về kết quả nào. Vui lòng thử lại.");
        return;
      }
      
      try {
        const cleanedText = resultText.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
        const parsed = JSON.parse(cleanedText);

        if (Array.isArray(parsed) && (parsed.length === 0 || (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null))) {
          setExtractedData(parsed);
        } else {
          setExtractedData([]);
        }
      } catch (e) {
        setExtractedData([]);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.";
      setError(`Đã xảy ra lỗi trong quá trình xử lý. ${errorMessage}`);
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProgress(100);
      
      setTimeout(() => {
        setIsLoading(false);
      }, 500); // Wait 500ms to show 100% before hiding
    }
  }, [imageFile, prompt, apiKey]);

  const handleDownload = () => {
    if (extractedData.length > 0) {
      exportDataToExcel(extractedData, 'du_lieu_trich_xuat');
    }
  };

  const handleCopyResult = () => {
    if (analysisResult) {
        navigator.clipboard.writeText(analysisResult).then(() => {
            setCopyButtonText('Đã sao chép!');
            setTimeout(() => setCopyButtonText('Sao chép'), 2000);
        }).catch(err => {
            console.error('Không thể sao chép: ', err);
            setCopyButtonText('Lỗi!');
            setTimeout(() => setCopyButtonText('Sao chép'), 2000);
        });
    }
  };


  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 tracking-tight">
            Trích xuất & Phân tích Dữ liệu từ Ảnh/PDF
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-3xl mx-auto">
            Tải lên tệp, sử dụng prompt để hướng dẫn AI trích xuất dữ liệu dạng bảng hoặc phân tích nội dung văn bản.
          </p>
        </header>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 mb-8">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex justify-between items-center text-left text-xl font-semibold text-slate-700"
              aria-expanded={showSettings}
            >
              <span>Cài đặt Nâng cao</span>
              <i className={`fa-solid fa-chevron-down transition-transform duration-300 ${showSettings ? 'rotate-180' : ''}`}></i>
            </button>
            {showSettings && (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-6">
                <div>
                  <label htmlFor="api-key-input" className="block text-sm font-medium text-slate-700 mb-1">
                    Google AI API Key
                  </label>
                  <div className="relative">
                    <input
                      id="api-key-input"
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Dán API Key của bạn vào đây"
                      className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                      aria-label="Google AI API Key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
                      aria-label={showApiKey ? 'Ẩn API Key' : 'Hiện API Key'}
                    >
                      <i className={`fa-solid ${showApiKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  <div className="mt-2 flex items-center">
                    <input
                      id="remember-api-key"
                      type="checkbox"
                      checked={rememberApiKey}
                      onChange={(e) => setRememberApiKey(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="remember-api-key" className="ml-2 block text-sm text-slate-700">
                      Ghi nhớ API Key
                    </label>
                  </div>
                  <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
                      <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                      <strong>Cảnh báo:</strong> Nếu được ghi nhớ, API Key sẽ lưu trong trình duyệt. Không chia sẻ máy tính này.
                  </div>
                </div>
                <div>
                  <label htmlFor="prompt-input" className="block text-sm font-medium text-slate-700 mb-1">
                    Tùy chỉnh Prompt
                  </label>
                  <p className="text-sm text-slate-500 mb-2">
                    Hướng dẫn AI cách trích xuất hoặc phân tích dữ liệu. Đây là chìa khóa để có được kết quả bạn muốn.
                  </p>
                  <textarea
                    id="prompt-input"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                  />
                  <button
                    onClick={() => setPrompt(defaultPrompt)}
                    className="mt-2 text-sm text-indigo-600 hover:underline"
                  >
                    Khôi phục mặc định
                  </button>
                </div>
              </div>
            )}
        </div>


        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col">
            <h2 className="text-2xl font-semibold mb-4 text-slate-700">1. Tải tệp lên</h2>
            <ImageUploader onImageUpload={handleImageUpload} />
            { imageFile && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-3 text-slate-700">Tệp đã chọn:</h3>
                <div className="relative w-full min-h-[20rem] rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 p-4">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Xem trước" className="max-w-full max-h-full object-contain" />
                  ) : (
                     <div className="text-center text-slate-500">
                      <i className="fa-solid fa-file-pdf text-6xl mb-4 text-red-500"></i>
                      <p className="font-semibold text-slate-700 break-all">{imageFile.name}</p>
                      <p className="text-sm mt-2">
                        Xem trước không khả dụng cho file PDF. <br/> Nhấn "Phân tích & Trích xuất" để tiếp tục.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={processImage}
              disabled={!imageFile || isLoading}
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
                  <span>Phân tích & Trích xuất</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-slate-700">2. Kết quả</h2>
              {extractedData.length > 0 && (
                <button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-all duration-300 shadow-md disabled:cursor-not-allowed"
                >
                  <i className="fa-solid fa-file-excel"></i>
                  <span>Tải xuống Excel</span>
                </button>
              )}
            </div>

            <div className="flex-grow flex flex-col min-h-[300px] border-2 border-dashed border-slate-300 rounded-lg p-4">
              {isLoading ? (
                <div className="flex-grow flex items-center justify-center text-center text-slate-500 p-4">
                  <div className="w-full max-w-md">
                    <div className="flex justify-between mb-1">
                      <span className="text-base font-medium text-indigo-700">Đang phân tích</span>
                      <span className="text-sm font-medium text-indigo-700">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full"
                        style={{ width: `${progress}%`, transition: 'width 150ms linear' }}>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-3">Quá trình này có thể mất một chút thời gian, vui lòng đợi.</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex-grow flex items-center justify-center text-center text-red-500 bg-red-50 p-4 rounded-lg">
                  <div>
                    <i className="fa-solid fa-circle-exclamation text-2xl mb-2"></i>
                    <p className="font-semibold">Lỗi!</p>
                    <p>{error}</p>
                  </div>
                </div>
              ) : extractedData.length > 0 ? (
                <div className="w-full h-full flex flex-col overflow-auto">
                  <DataTable data={extractedData} />
                </div>
              ) : analysisResult ? (
                 <div className="w-full h-full flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-base font-semibold text-slate-700">Kết quả phân tích</h3>
                        <button
                            onClick={handleCopyResult}
                            className="flex items-center gap-1.5 bg-slate-100 text-slate-600 font-medium py-1 px-2.5 rounded-md hover:bg-slate-200 transition-colors text-xs"
                            aria-label="Sao chép kết quả"
                        >
                            <i className="fa-regular fa-copy"></i>
                            <span>{copyButtonText}</span>
                        </button>
                    </div>
                    <div className="flex-grow overflow-auto bg-slate-50 border border-slate-200 rounded-md p-3">
                        <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans">{analysisResult}</pre>
                    </div>
                </div>
              ) : (
                <div className="flex-grow flex items-center justify-center text-center text-slate-500">
                   <div>
                    <i className="fa-solid fa-table-list text-4xl mb-3"></i>
                    <p className="font-medium">Kết quả sẽ hiển thị ở đây.</p>
                    <p className="text-xs mt-2 max-w-xs mx-auto">Nếu kết quả là dữ liệu dạng bảng, bạn sẽ thấy tùy chọn để tải xuống tệp Excel.</p>
                  </div>
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