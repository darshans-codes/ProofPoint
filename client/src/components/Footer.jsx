import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#F5F2EB] border-t border-[#D8D2C4] py-8 mt-16 text-xs text-[#5F6A61] font-mono">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-base text-[#1B221D]">ProofPoint</span>
            <span>—</span>
            <span>FIELD EVIDENCE & IMPACT RECORDS</span>
          </div>
          <p className="text-[11px] text-[#5F6A61] font-sans">
            Built for Code Cubicle 6.0 (PS02: Sustainability Media Platform using Cloudinary).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-[11px]">
          <div className="flex items-center gap-1.5 text-[#2F6B4A]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>EXIF + DHASH INTEGRITY ENGINE ACTIVE</span>
          </div>
          <span>|</span>
          <span>ESTIMATES CLEARLY LABELED</span>
          <span>|</span>
          <span className="text-[#1B221D]">CONFIDENTIAL FIELD SPECIMEN DATA</span>
        </div>
      </div>
    </footer>
  );
}
