
import React from 'react';
import { ExtractedRecord } from '../types';

interface DataTableProps {
  data: ExtractedRecord[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-600">
        <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
          <tr>
            <th scope="col" className="px-4 py-3 w-16 text-center">
              STT
            </th>
            <th scope="col" className="px-6 py-3">
              Tên
            </th>
            <th scope="col" className="px-6 py-3">
              Số phí
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="bg-white border-b hover:bg-slate-50">
              <td className="px-4 py-4 text-center font-medium text-slate-900">
                {row.stt}
              </td>
              <td className="px-6 py-4">
                {row.ten}
              </td>
              <td className="px-6 py-4">
                {row.soPhi}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
