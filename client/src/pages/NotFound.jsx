import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 px-4">
      <div className="font-mono text-sm text-[#5F6A61] border border-[#D8D2C4] px-3 py-1 bg-[#FBF9F4]">
        ERROR 404 • SPECIMEN NOT FOUND
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl text-[#1B221D]">
        Requested Dossier Does Not Exist
      </h1>
      <p className="text-sm font-sans text-[#5F6A61] max-w-md">
        The record, route, or observation point you requested is not present in the ProofPoint registry.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-[#2F5D46] hover:bg-[#244A38] text-[#FBF9F4] text-xs font-mono uppercase px-4 py-2.5 rounded-[2px] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Platform</span>
      </Link>
    </div>
  );
}
