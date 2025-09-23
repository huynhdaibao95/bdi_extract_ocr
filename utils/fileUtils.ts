
import { ExtractedRecord } from '../types';

declare var XLSX: any;
declare var docx: any;

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

export const exportDataToWord = (data: ExtractedRecord[], filename: string): void => {
  if (!data || data.length === 0) {
    console.warn("No data to export.");
    return;
  }

  const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, ShadingType, HeadingLevel } = docx;

  const keys = Object.keys(data[0]);
  const headerLabels = keys.map(key =>
    key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim()
  );

  const header = new TableRow({
    children: headerLabels.map(label =>
      new TableCell({
        children: [new Paragraph({ text: label, style: "strong" })],
        shading: {
          type: ShadingType.CLEAR,
          fill: "F2F2F2",
        },
      })
    ),
    tableHeader: true,
  });

  const dataRows = data.map(row =>
    new TableRow({
      children: keys.map(key =>
        new TableCell({
          children: [new Paragraph(String(row[key] ?? ''))],
        })
      ),
    })
  );

  const table = new Table({
    rows: [header, ...dataRows],
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });

  const doc = new Document({
    creator: "Data Extractor App",
    title: "Extracted Data",
    description: "Data extracted from a file.",
    styles: {
        paragraphStyles: [
            {
                id: "strong",
                name: "Strong",
                basedOn: "Normal",
                next: "Normal",
                run: {
                    bold: true,
                },
            },
        ],
    },
    sections: [{
      children: [
        new Paragraph({ text: "Dữ liệu được trích xuất", heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }),
        table
      ],
    }],
  });

  Packer.toBlob(doc).then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  });
};
