import { ExtractedRecord } from '../types';

declare var XLSX: any;
declare var htmlDocx: any;

export const exportDataToExcel = (data: ExtractedRecord[], filename: string): void => {
  if (!data || data.length === 0) {
    console.warn("Không có dữ liệu để xuất.");
    return;
  }
  
  const headers = Object.keys(data[0]);
  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
  
  const colWidths = headers.map((key) => {
    const columnData = data.map(row => String(row[key] ?? ''));
    
    const maxLineLength = columnData.reduce((max, cell) => {
        const lines = cell.split('\n');
        const currentMax = Math.max(...lines.map(line => line.length));
        return Math.max(max, currentMax);
    }, 0);

    const maxLength = Math.max(
      key.length,
      maxLineLength,
    );
    return { wch: Math.min(Math.max(maxLength, 10), 60) }; 
  });
  
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DuLieuTrichXuat');

  XLSX.writeFile(workbook, `${filename}.xlsx`, { bookType: 'xlsx', type: 'binary' });
};

const wordStyles = `
<style>
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.5;
  }
  p, li, div {
    margin-bottom: 12pt;
  }
  h1, h2, h3, h4, h5, h6 {
    font-weight: bold;
    margin-top: 18pt;
    margin-bottom: 12pt;
    line-height: 1.2;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 12pt;
    font-size: 10pt;
  }
  th, td {
    border: 1px solid #cccccc;
    text-align: left;
    padding: 8px;
    vertical-align: top;
  }
  th {
    background-color: #f2f2f2;
    font-weight: bold;
  }
</style>
`;

export const exportDataToWord = (data: ExtractedRecord[] | string, filename: string): void => {
  if (!data) {
    console.warn("Không có dữ liệu để xuất Word.");
    return;
  }

  let contentAsHtml: string;

  if (Array.isArray(data)) {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const headerRow = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    
    const bodyRows = data.map(row => {
        const cells = headers.map(header => `<td>${String(row[header] ?? '').replace(/\n/g, '<br />')}</td>`).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    contentAsHtml = `<table>${headerRow}<tbody>${bodyRows}</tbody></table>`;
  } else {
    contentAsHtml = data;
  }

  const fullHtml = `<!DOCTYPE html><html><head><meta charset='UTF-T-8'>${wordStyles}</head><body>${contentAsHtml}</body></html>`;

  try {
    const fileBlob = htmlDocx.asBlob(fullHtml);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(fileBlob);
    link.download = `${filename}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (e) {
    console.error("Lỗi khi tạo tệp Word:", e);
  }
};