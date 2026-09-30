import React, { useEffect, useState } from 'react';
import { searchAssets } from '../api/client';
import AssetCard from '../components/AssetCard';
import SkeletonGrid from '../components/SkeletonGrid';
import EmptyState from '../components/EmptyState';
import { Search as SearchIcon, ArrowRight, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'riverbank after cleanup',
  'newly planted trees and saplings',
  'flooded road near school',
  'cleared plastic debris in riparian zone',
  'native mangrove canopy foliage',
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSuggestionIndex((index) => (index + 1) % 3);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setErrorMessage('');
    try {
      const data = await searchAssets(query.trim());
      setResults(data.results || []);
    } catch (err) {
      console.error('[Search Error]', err);
      setErrorMessage(err.response?.data?.error || 'Search could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (term) => {
    setQuery(term);
    setLoading(true);
    setSearched(true);
    setErrorMessage('');
    searchAssets(term)
      .then((data) => setResults(data.results || []))
      .catch((err) => {
        console.error(err);
        setErrorMessage(err.response?.data?.error || 'Search could not be completed.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-12 max-w-[1360px] mx-auto">
      {/* Header */}
      <div className="border-b border-[#D8D2C4] pb-6">
        <span className="text-xs font-mono uppercase tracking-widest text-[#2F5D46] block mb-1">
          SEMANTIC ARCHIVAL RESEARCH
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1B221D] font-normal tracking-tight">
          Search the evidence archive
        </h1>
        <p className="text-sm font-sans text-[#5F6A61] mt-1 max-w-2xl">
          Search captions, tags, activities, and locations using the words you would use in the field.
        </p>
      </div>

      {/* Large Input with Bottom Rule */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative border-b-2 border-[#1B221D] pb-2 flex items-center gap-3">
          <SearchIcon className="w-6 h-6 text-[#5F6A61] flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Try “${SUGGESTIONS[suggestionIndex]}”`}
            className="w-full bg-transparent text-xl sm:text-2xl font-serif text-[#1B221D] placeholder:text-[#8E9890] focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="inline-flex items-center gap-1.5 bg-[#2F5D46] hover:bg-[#244A38] disabled:opacity-50 text-[#FBF9F4] text-xs font-mono uppercase px-4 py-2 rounded-[2px] transition-colors cursor-pointer flex-shrink-0"
          >
            <span>Execute Search</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick query suggestion chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-[#5F6A61] uppercase tracking-wider">SAMPLE QUERIES:</span>
          {SUGGESTIONS.map((term, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestionClick(term)}
              className="text-[#2F5D46] hover:text-[#1B221D] underline hover:no-underline bg-[#FBF9F4] border border-[#D8D2C4] px-2 py-0.5 rounded-[2px] transition-colors"
            >
              "{term}"
            </button>
          ))}
        </div>
      </form>

      {/* Results Section */}
      <div className="space-y-6">
        {errorMessage && (
          <div className="border border-[#A63A2B] bg-[#F3DAD5] p-3 text-xs font-mono text-[#A63A2B]">
            {errorMessage}
          </div>
        )}
        {searched && !loading && (
          <div className="flex items-center justify-between border-b border-[#D8D2C4] pb-2 text-xs font-mono text-[#5F6A61]">
            <span>
              QUERY DISPATCH: "{query}" • {results.length} EVIDENCE RECORDS IDENTIFIED
            </span>
            <span>RANKED BY VECTOR SIMILARITY</span>
          </div>
        )}

        {loading ? (
          <SkeletonGrid count={6} columns={3} />
        ) : !searched ? (
          <div className="p-12 border border-[#D8D2C4] bg-[#FBF9F4] text-center space-y-2">
            <div className="font-serif text-lg text-[#1B221D]">
              Query the complete multi-project photographic archive
            </div>
            <p className="text-xs font-mono text-[#5F6A61] max-w-md mx-auto">
              Type natural terms or click a sample query above to search through Gemini-extracted visual activities, tags, and observed landscape features.
            </p>
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            title="No matching evidence frames found"
            description={`No stored assets matched the conceptual parameters of "${query}". Try broader environmental terms like "vegetation", "canopy", or "water".`}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((asset) => (
              <div key={asset._id} className="space-y-2">
                <AssetCard asset={asset} />
                <div className="p-2 border border-[#D8D2C4] bg-[#FBF9F4] rounded-[2px] text-[11px] font-mono flex items-center justify-between">
                  <span className="text-[#2F6B4A] font-semibold">
                    {asset.searchScore}% MATCH
                  </span>
                  <span className="text-[#5F6A61] truncate max-w-[200px]" title={asset.matchReason}>
                    {asset.matchReason}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
