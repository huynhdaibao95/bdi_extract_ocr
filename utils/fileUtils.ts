import { ExtractedRecord } from '../types';

declare var XLSX: any;

export const exportDataToExcel = (data: ExtractedRecord[], filename: string): void => {
  if (!data || data.length === 0) {
    console.warn("Không có dữ liệu để xuất.");
    return;
  }
  
  // Dữ liệu đã được xử lý với các tên cột thân thiện, vì vậy chúng ta có thể sử dụng chúng trực tiếp.
  const headers = Object.keys(data[0]);
  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
  
  // Tự động tính toán độ rộng cột dựa trên header và nội dung
  const colWidths = headers.map((key) => {
    const columnData = data.map(row => String(row[key] ?? ''));
    
    // Tìm độ dài của dòng dài nhất trong một ô có nhiều dòng (ví dụ: cột 'Thông tin khác')
    const maxLineLength = columnData.reduce((max, cell) => {
        const lines = cell.split('\n');
        const currentMax = Math.max(...lines.map(line => line.length));
        return Math.max(max, currentMax);
    }, 0);

    const maxLength = Math.max(
      key.length,
      maxLineLength,
    );
    // Đặt chiều rộng tối thiểu là 10, tối đa là 60 cho dễ đọc
    return { wch: Math.min(Math.max(maxLength, 10), 60) }; 
  });
  
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DuLieuTrichXuat');

  XLSX.writeFile(workbook, `${filename}.xlsx`, { bookType: 'xlsx', type: 'binary' });
};