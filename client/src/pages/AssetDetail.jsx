import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAssetById, reanalyzeAsset, deleteAsset } from '../api/client';
import VerificationStamp from '../components/VerificationStamp';
import AiEstimateTag from '../components/AiEstimateTag';
import Ledger from '../components/Ledger';
import {
  ArrowLeft,
  RotateCw,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  MapPin,
  Camera,
  Calendar,
  Layers,
} from 'lucide-react';

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('medium'); // 'medium' | 'watermarked' | 'original'
  const [reanalyzing, setReanalyzing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const fetchAsset = async () => {
    setLoading(true);
    try {
      const data = await getAssetById(id);
      setAsset(data);
    } catch (err) {
      console.error('[AssetDetail] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const updated = await reanalyzeAsset(id);
      setAsset(updated);
    } catch (err) {
      alert(err.response?.data?.error || 'Re-analysis failed');
    } finally {
      setReanalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to permanently delete this evidence frame?')) {
      try {
        await deleteAsset(id);
        navigate('/app/gallery');
      } catch (err) {
        alert('Failed to delete asset');
      }
    }
  };

  const copyPublicId = () => {
    if (asset?.cloudinary?.publicId) {
      navigator.clipboard.writeText(asset.cloudinary.publicId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-[#5F6A61] animate-pulse">
        RETRIEVING SPECIMEN DOSSIER...
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="py-20 text-center font-mono text-xs text-[#A63A2B]">
        SPECIMEN RECORD NOT FOUND.
      </div>
    );
  }

  const frameId = `PP-${asset._id.slice(-4).toUpperCase()}`;

  // Image source based on active tab
  let displayUrl = asset.transformations?.medium || asset.cloudinary?.secureUrl;
  if (activeTab === 'watermarked') {
    displayUrl = asset.transformations?.watermarked || displayUrl;
  } else if (activeTab === 'original') {
    displayUrl = asset.cloudinary?.secureUrl || displayUrl;
  }

  // Verification checks table definition
  const checkColumns = [
    {
      header: 'INTEGRITY CHECK',
      accessor: (c) => <span className="font-semibold text-[#1B221D]">{c.name}</span>,
    },
    {
      header: 'RESULT',
      accessor: (c) => (
        <span
          className={`font-mono text-[10px] px-1.5 py-0.5 rounded-[1px] uppercase ${
            c.passed
              ? 'bg-[#E4EEE7] text-[#2F6B4A] border border-[#2F6B4A]/30'
              : 'bg-[#F3DAD5] text-[#A63A2B] border border-[#A63A2B]/30'
          }`}
        >
          {c.passed ? 'PASSED' : 'FAILED'}
        </span>
      ),
    },
    {
      header: 'AUDIT DETAIL',
      accessor: (c) => <span className="font-sans text-xs text-[#5F6A61]">{c.detail}</span>,
    },
  ];

  // Provenance ledger definition
  const provenanceColumns = [
    {
      header: 'TIMESTAMP',
      accessor: (p) => (
        <span className="text-[#5F6A61]">{new Date(p.at).toISOString().replace('T', ' ').slice(0, 19)}</span>
      ),
    },
    {
      header: 'EVENT TYPE',
      accessor: (p) => (
        <span className="font-semibold text-[#1B221D] uppercase tracking-wider">{p.event}</span>
      ),
    },
    {
      header: 'CUSTODY DETAIL',
      accessor: (p) => <span className="font-sans text-xs text-[#1B221D]">{p.detail}</span>,
    },
  ];

  return (
    <div className="space-y-10 max-w-[1360px] mx-auto">
      {/* Top back navigation and primary actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D8D2C4] pb-4 gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/app/gallery"
            className="p-1.5 border border-[#D8D2C4] bg-[#FBF9F4] text-[#1B221D] hover:bg-[#F5F2EB] rounded-[2px]"
            title="Back to gallery"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#1B221D]">{frameId}</span>
              <span>•</span>
              <span className="font-sans text-sm text-[#5F6A61]">{asset.locationName}</span>
            </div>
            <div className="text-[10px] font-mono text-[#5F6A61] mt-0.5">
              CONCESSION: {asset.projectName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-[#D8D2C4] bg-[#FBF9F4] hover:bg-[#F5F2EB] text-[#1B221D] rounded-[2px] transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
            <span>{reanalyzing ? 'Re-analyzing...' : 'Re-run Analysis'}</span>
          </button>

          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-[#A63A2B]/40 bg-[#F3DAD5]/40 hover:bg-[#F3DAD5] text-[#A63A2B] rounded-[2px] transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* 8/4 Asymmetric Specimen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Large Photo & Transformations Tab */}
        <div className="lg:col-span-8 space-y-4">
          {/* Transformation Tab Strip */}
          <div className="flex items-center justify-between border-b border-[#D8D2C4] pb-2 text-xs font-mono">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('medium')}
                className={`pb-1 transition-colors ${
                  activeTab === 'medium'
                    ? 'font-bold text-[#1B221D] border-b-2 border-[#1B221D]'
                    : 'text-[#5F6A61] hover:text-[#1B221D]'
                }`}
              >
                MEDIUM RES (OPTIMIZED)
              </button>
              <button
                onClick={() => setActiveTab('watermarked')}
                className={`pb-1 transition-colors ${
                  activeTab === 'watermarked'
                    ? 'font-bold text-[#1B221D] border-b-2 border-[#1B221D]'
                    : 'text-[#5F6A61] hover:text-[#1B221D]'
                }`}
              >
                WATERMARKED DERIVATIVE
              </button>
              <button
                onClick={() => setActiveTab('original')}
                className={`pb-1 transition-colors ${
                  activeTab === 'original'
                    ? 'font-bold text-[#1B221D] border-b-2 border-[#1B221D]'
                    : 'text-[#5F6A61] hover:text-[#1B221D]'
                }`}
              >
                RAW SOURCE
              </button>
            </div>

            <span className="text-[#5F6A61] text-[10px]">
              {asset.cloudinary?.width} × {asset.cloudinary?.height} PX •{' '}
              {asset.cloudinary?.bytes ? `${(asset.cloudinary.bytes / 1024).toFixed(0)} KB` : 'IMAGE'}
            </span>
          </div>

          {/* Media Container */}
          <div className="border border-[#D8D2C4] bg-[#1B221D] rounded-[2px] overflow-hidden flex items-center justify-center min-h-[460px]">
            {asset.kind === 'video' ? (
              <video
                src={asset.cloudinary?.secureUrl}
                controls
                className="max-h-[640px] w-full"
              />
            ) : (
              <img
                src={displayUrl}
                alt={asset.ai?.caption || 'Evidence specimen'}
                className="max-h-[640px] w-full object-contain"
              />
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Specimen Dossier & AI Estimates */}
        <div className="lg:col-span-4 space-y-6">
          {/* Specimen Sheet Definition List */}
          <div className="border border-[#D8D2C4] bg-[#FBF9F4] p-5 space-y-4 rounded-[2px]">
            <div className="flex items-center justify-between border-b border-[#D8D2C4] pb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F6A61]">
                SPECIMEN RECORD SHEET
              </span>
              <VerificationStamp
                status={asset.verification?.status}
                score={asset.verification?.score}
                size="md"
              />
            </div>

            <dl className="divide-y divide-[#D8D2C4] text-xs font-mono">
              <div className="py-2 flex justify-between">
                <dt className="text-[#5F6A61]">FRAME IDENTIFIER</dt>
                <dd className="font-bold text-[#1B221D]">{frameId}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-[#5F6A61]">PROJECT</dt>
                <dd className="text-[#1B221D] text-right truncate max-w-[180px]">{asset.projectName}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-[#5F6A61]">LOCATION</dt>
                <dd className="text-[#1B221D] text-right truncate max-w-[180px]">{asset.locationName}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-[#5F6A61]">CLAIMED DATE</dt>
                <dd className="text-[#1B221D]">
                  {new Date(asset.capturedDate).toISOString().split('T')[0]}
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-[#5F6A61]">EXIF TIMESTAMP</dt>
                <dd className={asset.exif?.takenAt ? 'text-[#1B221D]' : 'text-[#A63A2B]'}>
                  {asset.exif?.takenAt
                    ? new Date(asset.exif.takenAt).toISOString().replace('T', ' ').slice(0, 19)
                    : 'NOT IN FILE HEADER'}
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-[#5F6A61]">GPS COORDINATES</dt>
                <dd className={asset.exif?.hasGps ? 'text-[#2F6B4A]' : 'text-[#A63A2B]'}>
                  {asset.exif?.hasGps
                    ? `${asset.exif.lat.toFixed(4)}, ${asset.exif.lng.toFixed(4)}`
                    : 'NO GPS IN FILE'}
                </dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-[#5F6A61]">CAMERA HARDWARE</dt>
                <dd className="text-[#1B221D] truncate max-w-[180px]">
                  {asset.exif?.camera || 'Unknown Sensor'}
                </dd>
              </div>
            </dl>
          </div>

          {/* AI Observation Section */}
          <div className="border border-[#D8D2C4] bg-[#FBF9F4] p-5 space-y-4 rounded-[2px]">
            <div className="flex items-center justify-between border-b border-[#D8D2C4] pb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F6A61]">
                VISUAL OBSERVATIONS
              </span>
              <AiEstimateTag />
            </div>

            <div>
              <span className="text-[10px] font-mono text-[#5F6A61] uppercase block mb-1">
                FACTUAL CAPTION
              </span>
              <p className="text-xs font-sans text-[#1B221D] leading-relaxed">
                {asset.ai?.caption || 'No automated caption generated.'}
              </p>
            </div>

            {asset.ai?.tags && asset.ai.tags.length > 0 && (
              <div>
                <span className="text-[10px] font-mono text-[#5F6A61] uppercase block mb-1">
                  CONTEXTUAL TAGS
                </span>
                <p className="text-xs font-mono text-[#5F6A61]">
                  {asset.ai.tags.join(', ')}
                </p>
              </div>
            )}

            {/* AI Metrics Table */}
            {asset.ai?.metrics && (
              <div className="pt-2 border-t border-[#D8D2C4]">
                <span className="text-[10px] font-mono text-[#5F6A61] uppercase block mb-2">
                  STRUCTURED METRICS
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 border border-[#D8D2C4] bg-[#F5F2EB]">
                    <span className="text-[10px] text-[#5F6A61] block">TREES COUNT</span>
                    <span className="font-semibold text-[#1B221D]">{asset.ai.metrics.trees ?? '0'}</span>
                  </div>
                  <div className="p-2 border border-[#D8D2C4] bg-[#F5F2EB]">
                    <span className="text-[10px] text-[#5F6A61] block">WASTE LEVEL</span>
                    <span className="font-semibold text-[#1B221D] uppercase">{asset.ai.metrics.waste || 'n/a'}</span>
                  </div>
                  <div className="p-2 border border-[#D8D2C4] bg-[#F5F2EB]">
                    <span className="text-[10px] text-[#5F6A61] block">WATER CLARITY</span>
                    <span className="font-semibold text-[#1B221D] uppercase">{asset.ai.metrics.waterClarity || 'n/a'}</span>
                  </div>
                  <div className="p-2 border border-[#D8D2C4] bg-[#F5F2EB]">
                    <span className="text-[10px] text-[#5F6A61] block">VEGETATION</span>
                    <span className="font-semibold text-[#1B221D] uppercase">{asset.ai.metrics.vegetationLevel || 'n/a'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Width Ledgers */}
      <div className="space-y-8 pt-6 border-t border-[#D8D2C4]">
        {/* Verification Checks Ledger */}
        <Ledger
          title="Hardware & Integrity Verification Audit Checks"
          columns={checkColumns}
          rows={asset.verification?.checks || []}
          emptyText="No check records available."
        />

        {/* Chain of Custody Ledger */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#F5F2EB] border border-[#D8D2C4] text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#5F6A61] uppercase">CLOUDINARY STORAGE ID:</span>
              <span className="font-semibold text-[#1B221D]">{asset.cloudinary?.publicId}</span>
            </div>
            <button
              onClick={copyPublicId}
              className="inline-flex items-center gap-1 text-[#2F5D46] hover:underline"
            >
              {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId ? 'COPIED TO CLIPBOARD' : 'COPY STORAGE ID'}</span>
            </button>
          </div>

          <Ledger
            title="Cryptographic Chain of Custody & Provenance History"
            columns={provenanceColumns}
            rows={asset.provenance || []}
            emptyText="No provenance entries logged."
          />
        </div>
      </div>
    </div>
  );
}
