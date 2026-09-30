import React from 'react';

export default function AiEstimateTag({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center text-[10px] font-mono tracking-wider uppercase text-[#5F6A61] bg-[#FBF9F4] border border-[#D8D2C4] px-1.5 py-0.5 rounded-[2px] ${className}`}
      title="Estimates derived by AI vision models. Not ground truth."
    >
      AI ESTIMATE
    </span>
  );
}
