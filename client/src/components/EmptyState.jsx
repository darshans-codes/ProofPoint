import React from 'react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  title = 'No records found',
  description = 'No evidence assets match the selected criteria.',
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <div className="w-full py-16 px-4 border border-[#D8D2C4] bg-[#FBF9F4] text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 mb-3 border border-[#D8D2C4] bg-[#F5F2EB] flex items-center justify-center text-[#5F6A61] font-mono text-sm">
        00
      </div>
      <h3 className="font-serif text-xl font-semibold text-[#1B221D] mb-1">
        {title}
      </h3>
      <p className="text-sm font-sans text-[#5F6A61] max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center text-xs font-mono uppercase tracking-wider bg-[#2F5D46] hover:bg-[#244A38] text-[#FBF9F4] px-4 py-2 rounded-[2px] transition-colors"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          onClick={onAction}
          className="inline-flex items-center text-xs font-mono uppercase tracking-wider bg-[#2F5D46] hover:bg-[#244A38] text-[#FBF9F4] px-4 py-2 rounded-[2px] transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
