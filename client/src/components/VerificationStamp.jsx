import React from 'react';

export default function VerificationStamp({ status = 'needs_review', score, showScore = true, size = 'md' }) {
  const normStatus = (status || 'needs_review').toLowerCase();

  let label = 'NEEDS REVIEW';
  let colorClasses = 'border-[#9A6B12] text-[#9A6B12] bg-[#F4E9CF]';

  if (normStatus === 'verified') {
    label = 'VERIFIED';
    colorClasses = 'border-[#2F6B4A] text-[#2F6B4A] bg-[#E4EEE7]';
  } else if (normStatus === 'flagged') {
    label = 'FLAGGED';
    colorClasses = 'border-[#A63A2B] text-[#A63A2B] bg-[#F3DAD5]';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 tracking-wider',
    md: 'text-[11px] px-2 py-0.5 tracking-wider',
    lg: 'text-[12px] px-3 py-1 tracking-widest font-semibold',
  }[size] || 'text-[11px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase border rounded-[2px] font-medium leading-none select-none transition-colors ${colorClasses} ${sizeClasses}`}
      title={score !== undefined ? `Verification Score: ${score}/100` : label}
    >
      <span>{label}</span>
      {showScore && score !== undefined && (
        <span className="opacity-90 pl-0.5 border-l border-current/30">
          {score}/100
        </span>
      )}
    </span>
  );
}
