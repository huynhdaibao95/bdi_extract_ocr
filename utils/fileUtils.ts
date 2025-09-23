
import { ExtractedRecord } from '../types';

const convertToCSV = (data: ExtractedRecord[]): string => {
  if (data.length === 0) {
    return "";
  }
  
  const headers = "STT,Tên,Số phí";
  const rows = data.map(row => 
    `"${String(row.stt || '').replace(/"/g, '""')}","${String(row.ten || '').replace(/"/g, '""')}","${String(row.soPhi || '').replace(/"/g, '""')}"`
  );
  
  // BOM for UTF-8 to support Vietnamese characters in Excel
  const BOM = "\uFEFF";
  return [BOM + headers, ...rows].join('\n');
};

export const exportDataToExcel = (data: ExtractedRecord[], filename: string): void => {
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
