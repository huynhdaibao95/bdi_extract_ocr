
import { ExtractedRecord } from '../types';

declare var XLSX: any;

export const exportDataToExcel = (data: ExtractedRecord[], filename: string): void => {
  if (!data || data.length === 0) {
    console.warn("No data to export.");
    return;
  }
  
  const keys = Object.keys(data[0]);
  const header = keys.map(key => 
    key.replace(/_/g, ' ')
       .replace(/([A-Z])/g, ' $1')
       .replace(/^./, (str) => str.toUpperCase())
       .trim()
  );
  
  const body = data.map(row => keys.map(key => row[key]));
  
  const worksheetData = [header, ...body];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Auto-calculate column widths based on header and content length
  const colWidths = keys.map((key, i) => {
    const maxLength = Math.max(
      header[i].length, 
      ...data.map(row => String(row[key] ?? '').length)
    );
    // Set a min width of 10, max of 50 for readability
    return { wch: Math.min(Math.max(maxLength, 10), 50) }; 
  });
  
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DuLieuTrichXuat');

  XLSX.writeFile(workbook, `${filename}.xlsx`, { bookType: 'xlsx', type: 'binary' });
};
