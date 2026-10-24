import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 8,
  onPageChange,
  onLimitChange
}) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  // Generate page numbers
  const pages = [];
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-5 sm:px-6 bg-white border-t border-slate-100">
      {/* Left: Previous / Next & Page buttons (matching Image 3) */}
      <div className="flex items-center gap-1.5 order-2 sm:order-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200/80 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="w-8 h-8 flex items-center justify-center text-xs rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-50 transition"
            >
              1
            </button>
            {startPage > 2 && <span className="px-1 text-slate-400 text-xs">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 flex items-center justify-center text-xs font-semibold rounded-xl transition ${
              p === currentPage
                ? 'bg-brand-600 text-white shadow-xs'
                : 'border border-slate-200/80 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-1 text-slate-400 text-xs">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="w-8 h-8 flex items-center justify-center text-xs rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-50 transition"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200/80 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Showing X to Y of Z entries & Rows per page (matching Image 3) */}
      <div className="flex items-center gap-3 text-xs text-slate-400 order-1 sm:order-2">
        <span>
          Show <span className="font-semibold text-slate-700">{startItem}</span> to{' '}
          <span className="font-semibold text-slate-700">{endItem}</span> of{' '}
          <span className="font-semibold text-slate-700">{totalItems}</span> entries
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200/60">
            <span className="text-[11px] text-slate-400">Show</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="text-xs bg-slate-50 border border-slate-200/80 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
