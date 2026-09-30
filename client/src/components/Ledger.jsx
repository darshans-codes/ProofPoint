import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

export default function Ledger({ title, columns = [], rows = [], emptyText = 'No ledger records.' }) {
  return (
    <div className="w-full bg-[#FBF9F4] border border-[#D8D2C4]">
      {title && (
        <div className="px-4 py-3 border-b border-[#D8D2C4] flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-[#1B221D] font-semibold">
            {title}
          </span>
          <span className="font-mono text-[10px] text-[#5F6A61]">
            {rows.length} {rows.length === 1 ? 'RECORD' : 'RECORDS'}
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-[#D8D2C4] bg-[#F5F2EB]/60 text-[#5F6A61] uppercase tracking-wider text-[10px]">
              {columns.map((col, idx) => (
                <th key={idx} className={`p-3 font-medium ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8D2C4]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center text-[#5F6A61] font-sans">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-[#F5F2EB]/50 transition-colors"
                >
                  {columns.map((col, cIdx) => {
                    const value = col.accessor ? col.accessor(row) : row[col.key];
                    return (
                      <td key={cIdx} className={`p-3 align-top ${col.cellClassName || ''}`}>
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
