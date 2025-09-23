
import React from 'react';
import { ExtractedRecord } from '../types';

interface DataTableProps {
  data: ExtractedRecord[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const headers = Object.keys(data[0]);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-600">
        <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
          <tr>
            {headers.map((header, idx) => (
              <th key={header} scope="col" className={`px-6 py-3 ${idx === 0 ? 'w-16 text-center' : ''}`}>
                {header.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="bg-white border-b hover:bg-slate-50">
              {headers.map((header, idx) => (
                <td key={`${header}-${index}`} className={`px-6 py-4 ${idx === 0 ? 'text-center font-medium text-slate-900' : ''}`}>
                  {String(row[header] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
