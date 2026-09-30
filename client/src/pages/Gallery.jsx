import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAssets } from '../api/client';
import { useProject } from '../context/ProjectContext';
import AssetCard from '../components/AssetCard';
import VerificationStamp from '../components/VerificationStamp';
import SkeletonGrid from '../components/SkeletonGrid';
import EmptyState from '../components/EmptyState';
import Ledger from '../components/Ledger';
import { LayoutGrid, Table as TableIcon, Filter, X, ArrowUpDown } from 'lucide-react';

export default function Gallery() {
  const { projects, selectedProjectId, setSelectedProjectId } = useProject();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [counts, setCounts] = useState({ verified: 0, needs_review: 0, flagged: 0, total: 0 });

  const fetchGalleryAssets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedProjectId !== 'all') params.projectId = selectedProjectId;
      if (statusFilter) params.status = statusFilter;
      if (locationQuery) params.locationName = locationQuery;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const data = await getAssets(params);
      setAssets(data.assets || []);
      if (data.counts) setCounts(data.counts);
    } catch (err) {
      console.error('[Gallery Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryAssets();
  }, [selectedProjectId, statusFilter, locationQuery, fromDate, toDate]);

  const clearFilters = () => {
    setStatusFilter('');
    setLocationQuery('');
    setFromDate('');
    setToDate('');
  };

  const hasActiveFilters = statusFilter || locationQuery || fromDate || toDate;

  // Columns for Table mode
  const tableColumns = [
    {
      header: 'FRAME ID',
      accessor: (row) => (
        <Link
          to={`/app/assets/${row._id}`}
          className="font-bold text-[#1B221D] hover:text-[#2F5D46] underline"
        >
          PP-{row._id.slice(-4).toUpperCase()}
        </Link>
      ),
    },
    {
      header: 'IMAGE',
      accessor: (row) => (
        <img
          src={row.transformations?.thumb || row.cloudinary?.secureUrl}
          alt={row.locationName}
          className="w-14 h-10 object-cover border border-[#D8D2C4] rounded-[1px]"
        />
      ),
    },
    {
      header: 'LOCATION & PROJECT',
      accessor: (row) => (
        <div>
          <div className="font-sans font-medium text-[#1B221D]">{row.locationName}</div>
          <div className="text-[10px] text-[#5F6A61]">{row.projectName}</div>
        </div>
      ),
    },
    {
      header: 'CAPTURED DATE',
      accessor: (row) => (
        <span>{new Date(row.capturedDate).toISOString().split('T')[0]}</span>
      ),
    },
    {
      header: 'CAPTION / AI ESTIMATE',
      accessor: (row) => (
        <p className="font-sans text-[11px] text-[#1B221D] line-clamp-2 max-w-sm">
          {row.ai?.caption || 'Field observation record.'}
        </p>
      ),
    },
    {
      header: 'INTEGRITY STATUS',
      accessor: (row) => (
        <VerificationStamp
          status={row.verification?.status}
          score={row.verification?.score}
          size="sm"
        />
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#D8D2C4] pb-6 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#2F5D46] block mb-1">
            EVIDENCE CONTACT SHEET
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1B221D] font-normal tracking-tight">
            Field Specimen Archive
          </h1>
          {/* Status Counts text */}
          <div className="text-xs font-mono text-[#5F6A61] mt-2 flex flex-wrap items-center gap-3">
            <span className="text-[#2F6B4A] font-semibold">{counts.verified} VERIFIED</span>
            <span>•</span>
            <span className="text-[#9A6B12] font-semibold">{counts.needs_review} NEEDS REVIEW</span>
            <span>•</span>
            <span className="text-[#A63A2B] font-semibold">{counts.flagged} FLAGGED</span>
            <span>•</span>
            <span>{counts.total} TOTAL FRAMES</span>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 border border-[#D8D2C4] bg-[#FBF9F4] p-1 rounded-[2px]">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-[2px] transition-colors ${
              viewMode === 'grid'
                ? 'bg-[#1B221D] text-[#F5F2EB]'
                : 'text-[#5F6A61] hover:text-[#1B221D]'
            }`}
            title="Contact Sheet Grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-[2px] transition-colors ${
              viewMode === 'table'
                ? 'bg-[#1B221D] text-[#F5F2EB]'
                : 'text-[#5F6A61] hover:text-[#1B221D]'
            }`}
            title="Ledger Table"
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-4 border border-[#D8D2C4] bg-[#FBF9F4] flex flex-wrap items-center gap-4 text-xs font-mono">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[#5F6A61] uppercase">STATUS:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F5F2EB] border border-[#D8D2C4] p-1.5 rounded-[2px] text-[#1B221D]"
          >
            <option value="">ALL STATUSES</option>
            <option value="verified">VERIFIED ONLY</option>
            <option value="needs_review">NEEDS REVIEW</option>
            <option value="flagged">FLAGGED / DUPLICATES</option>
          </select>
        </div>

        {/* Location Search */}
        <div className="flex items-center gap-2">
          <span className="text-[#5F6A61] uppercase">SECTOR:</span>
          <input
            type="text"
            placeholder="Filter location name..."
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="bg-[#F5F2EB] border border-[#D8D2C4] p-1.5 rounded-[2px] text-[#1B221D] w-40"
          >
          </input>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <span className="text-[#5F6A61] uppercase">FROM:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-[#F5F2EB] border border-[#D8D2C4] p-1.5 rounded-[2px] text-[#1B221D]"
          />
          <span className="text-[#5F6A61] uppercase">TO:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-[#F5F2EB] border border-[#D8D2C4] p-1.5 rounded-[2px] text-[#1B221D]"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-[#A63A2B] hover:underline uppercase flex items-center gap-1 ml-auto"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <SkeletonGrid count={8} columns={4} />
      ) : assets.length === 0 ? (
        <EmptyState
          title="No evidence records matched"
          description="Try adjusting your filter constraints or intake a new set of field photographs."
          actionLabel="Intake Evidence"
          actionTo="/app/upload"
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {assets.map((asset) => (
            <AssetCard key={asset._id} asset={asset} />
          ))}
        </div>
      ) : (
        <Ledger
          title="Field Evidence Audit Ledger"
          columns={tableColumns}
          rows={assets}
        />
      )}
    </div>
  );
}
