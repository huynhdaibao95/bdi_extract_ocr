
import { ExtractedRecord } from '../types';

declare var XLSX: any;

export const exportDataToExcel = (data: ExtractedRecord[], filename: string): void => {
  if (!data || data.length === 0) {
    console.warn("No data to export.");
    return;
  }

  const header = ["STT", "Tên", "Số phí"];
  const body = data.map(row => [row.stt, row.ten, row.soPhi]);
  const worksheetData = [header, ...body];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  const colWidths = [
      { wch: 8 }, 
      { wch: 40 },
      { wch: 20 }
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DuLieuTrichXuat');

  XLSX.writeFile(workbook, `${filename}.xlsx`, { bookType: 'xlsx', type: 'binary' });
};