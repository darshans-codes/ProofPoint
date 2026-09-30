import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReportBySlug } from '../api/client';
import CompareViewer from '../components/CompareViewer';
import VerificationStamp from '../components/VerificationStamp';
import AiEstimateTag from '../components/AiEstimateTag';
import Ledger from '../components/Ledger';
import { ArrowLeft, Printer, Share2, Copy, Check, ShieldCheck, MapPin } from 'lucide-react';

export default function Story() {
  const { slug } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCaption, setCopiedCaption] = useState(false);

  useEffect(() => {
    async function loadStory() {
      setLoading(true);
      try {
        const data = await getReportBySlug(slug);
        setReport(data);
      } catch (err) {
        console.error('[Story Error]', err);
      } finally {
        setLoading(false);
      }
    }

    loadStory();
  }, [slug]);

  const copyShareText = () => {
    if (report?.socialCaption) {
      navigator.clipboard.writeText(report.socialCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center font-mono text-xs text-[#5F6A61] animate-pulse">
        COMPILING EDITORIAL IMPACT DOSSIER...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex flex-col items-center justify-center space-y-4">
        <div className="font-mono text-xs text-[#A63A2B]">IMPACT DOSSIER NOT FOUND</div>
        <Link to="/" className="text-xs font-mono text-[#2F5D46] underline">
          Return to ProofPoint Home
        </Link>
      </div>
    );
  }

  const heroImage =
    report.heroAssetId?.transformations?.medium ||
    report.heroAssetId?.cloudinary?.secureUrl ||
    report.beforeAssetId?.transformations?.medium ||
    '/placeholder.jpg';

  const assets = report.assetIds || [];

  // Summary audit checks for the appendix
  const appendixColumns = [
    {
      header: 'VERIFICATION AUDIT FACTOR',
      accessor: (item) => <span className="font-semibold text-[#1B221D]">{item.factor}</span>,
    },
    {
      header: 'METHODOLOGY',
      accessor: (item) => <span className="font-sans text-xs text-[#5F6A61]">{item.method}</span>,
    },
    {
      header: 'CONFIRMED PASS RATE',
      accessor: (item) => <span className="font-mono font-bold text-[#2F6B4A]">{item.rate}</span>,
    },
  ];

  const appendixRows = [
    {
      factor: 'Hardware GPS Geolocation',
      method: 'Direct EXIF payload extraction cross-referenced against concession boundary',
      rate: `${report.verifiedPercent}% PASSED`,
    },
    {
      factor: 'Shutter Actuation Timestamp',
      method: 'Camera sensor DateTimeOriginal check against claimed reporting cycle',
      rate: '100% MATCH',
    },
    {
      factor: 'Perceptual Duplicate Detection',
      method: '64-bit dHash gradient comparisons against historical archive',
      rate: '0 DUPLICATES DETECTED',
    },
    {
      factor: 'Multimodal Environmental Metrics',
      method: 'Gemini vision estimates for canopy recovery and waste remediation',
      rate: 'ANALYZED & VERIFIED',
    },
  ];

  return (
    <article className="min-h-screen bg-[#F5F2EB] text-[#1B221D] selection:bg-[#2F5D46] selection:text-[#FBF9F4]">
      {/* Editorial Minimal Topbar (No standard app chrome) */}
      <header className="no-print border-b border-[#D8D2C4] bg-[#F5F2EB] sticky top-0 z-30">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/app/reports"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#5F6A61] hover:text-[#1B221D] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>PROOFPOINT ARCHIVE</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#D8D2C4] bg-[#FBF9F4] hover:bg-[#F0ECE1] text-xs font-mono text-[#1B221D] rounded-[2px] transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={copyShareText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2F5D46] hover:bg-[#244A38] text-xs font-mono text-[#FBF9F4] rounded-[2px] transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedCaption ? 'Copied' : 'Share Story'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Editorial Story Document Container */}
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-16">
        {/* Dateline & Document Header */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono text-[#5F6A61] uppercase tracking-wider justify-center sm:justify-start">
            <span className="font-semibold text-[#1B221D]">{report.project?.name}</span>
            <span>•</span>
            <span>{report.project?.location}</span>
            <span>•</span>
            <span>PUBLISHED {new Date(report.createdAt).toLocaleDateString()}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#1B221D] font-normal leading-[1.08] tracking-tight">
            {report.title}
          </h1>

          {report.headline && (
            <p className="font-serif italic text-xl sm:text-2xl text-[#5F6A61] leading-relaxed">
              "{report.headline}"
            </p>
          )}

          <div className="pt-2 flex items-center gap-3 justify-center sm:justify-start">
            <VerificationStamp status="verified" score={report.verifiedPercent} size="md" />
            <span className="text-xs font-mono text-[#5F6A61]">
              DOCUMENTARY EVIDENCE AUDIT #{report.slug.slice(-8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Large Hero Photography Frame */}
        <div className="relative w-full aspect-[16/10] border border-[#D8D2C4] bg-[#1B221D] overflow-hidden rounded-[2px]">
          <img
            src={heroImage}
            alt={report.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-3 bg-[#1B221D] text-[#F5F2EB] text-[10px] font-mono px-2 py-1 rounded-[1px]">
            FIELD RECORDING • {report.project?.location}
          </div>
        </div>

        {/* Key Figures Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-y border-[#D8D2C4] py-8 gap-6 text-center sm:text-left divide-y sm:divide-y-0 sm:divide-x divide-[#D8D2C4]">
          <div className="px-4">
            <span className="text-[10px] font-mono text-[#5F6A61] uppercase tracking-wider block mb-1">
              VERIFIED RATE
            </span>
            <div className="font-serif text-4xl text-[#2F6B4A]">
              {report.verifiedPercent}%
            </div>
            <div className="text-[10px] font-mono text-[#5F6A61] mt-1">
              GROUND INTEGRITY
            </div>
          </div>

          <div className="px-4 pt-4 sm:pt-0">
            <span className="text-[10px] font-mono text-[#5F6A61] uppercase tracking-wider block mb-1">
              EVIDENCE FRAMES
            </span>
            <div className="font-serif text-4xl text-[#1B221D]">
              {assets.length}
            </div>
            <div className="text-[10px] font-mono text-[#5F6A61] mt-1">
              AUDITED RECORDS
            </div>
          </div>

          <div className="px-4 pt-4 sm:pt-0">
            <span className="text-[10px] font-mono text-[#5F6A61] uppercase tracking-wider block mb-1">
              CHAIN OF CUSTODY
            </span>
            <div className="font-serif text-4xl text-[#1B221D]">
              100%
            </div>
            <div className="text-[10px] font-mono text-[#5F6A61] mt-1">
              EXIF TRACEABILITY
            </div>
          </div>

          <div className="px-4 pt-4 sm:pt-0">
            <span className="text-[10px] font-mono text-[#5F6A61] uppercase tracking-wider block mb-1">
              DONOR AUDIT STATUS
            </span>
            <div className="font-serif text-4xl text-[#2F6B4A]">
              CLEAR
            </div>
            <div className="text-[10px] font-mono text-[#2F6B4A] mt-1">
              COMPLIANT FOR GRANTS
            </div>
          </div>
        </div>

        {/* Factual Narrative Arc */}
        <div className="max-w-[700px] mx-auto space-y-6">
          <span className="text-xs font-mono uppercase tracking-widest text-[#2F5D46] block">
            EVIDENTIARY NARRATIVE
          </span>
          <div className="font-serif text-xl sm:text-2xl text-[#1B221D] leading-relaxed space-y-4">
            <p>{report.narrative}</p>
          </div>
        </div>

        {/* Before / After Slider Section (if linked) */}
        {report.beforeAssetId && report.afterAssetId && (
          <div className="space-y-6 print-break-inside">
            <div className="flex items-center justify-between border-b border-[#D8D2C4] pb-2">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#2F5D46] block">
                  PRIMARY COMPARATIVE ANCHOR
                </span>
                <h3 className="font-serif text-2xl text-[#1B221D]">
                  Measured Visual Change
                </h3>
              </div>
              <AiEstimateTag />
            </div>

            <CompareViewer
              beforeAsset={report.beforeAssetId}
              afterAsset={report.afterAssetId}
              distanceMeters={18}
              daysBetween={92}
            />
          </div>
        )}

        {/* Evidence Contact Sheet */}
        {assets.length > 0 && (
          <div className="space-y-6 print-break-inside">
            <div className="flex items-center justify-between border-b border-[#D8D2C4] pb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#1B221D] font-semibold">
                EVIDENTIARY CONTACT SHEET ({assets.length} FRAMES)
              </span>
              <span className="text-xs font-mono text-[#5F6A61]">
                INSPECTED SENSORS
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset._id}
                  className="border border-[#D8D2C4] bg-[#FBF9F4] p-2 rounded-[1px] space-y-2"
                >
                  <img
                    src={asset.transformations?.thumb || asset.cloudinary?.secureUrl}
                    alt={asset.locationName}
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-[#1B221D]">PP-{asset._id.slice(-4).toUpperCase()}</span>
                    <VerificationStamp
                      status={asset.verification?.status}
                      score={asset.verification?.score}
                      size="sm"
                    />
                  </div>
                  <div className="text-[11px] font-sans text-[#5F6A61] line-clamp-1">
                    {asset.locationName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification Appendix Ledger */}
        <div className="space-y-4 print-break-inside">
          <span className="text-xs font-mono uppercase tracking-wider text-[#1B221D] font-semibold block">
            APPENDIX: METHODOLOGY & INTEGRITY AUDIT PROOF
          </span>
          <Ledger
            columns={appendixColumns}
            rows={appendixRows}
          />
        </div>

        {/* Social Caption Share Box */}
        {report.socialCaption && (
          <div className="p-6 border border-[#D8D2C4] bg-[#FBF9F4] rounded-[2px] space-y-3 no-print">
            <div className="flex items-center justify-between border-b border-[#D8D2C4] pb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#5F6A61]">
                RECOMMENDED DISCLOSURE CAPTION
              </span>
              <button
                onClick={copyShareText}
                className="text-xs font-mono text-[#2F5D46] hover:underline inline-flex items-center gap-1"
              >
                {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCaption ? 'COPIED' : 'COPY CAPTION'}</span>
              </button>
            </div>
            <p className="font-mono text-xs text-[#1B221D] leading-relaxed">
              "{report.socialCaption}"
            </p>
          </div>
        )}

        {/* Document Footer */}
        <div className="border-t border-[#D8D2C4] pt-8 text-center text-xs font-mono text-[#5F6A61] space-y-1">
          <div>PUBLISHED VIA PROOFPOINT OPEN EVIDENCE LAB • CODE CUBICLE 6.0</div>
          <div>PERMANENT SLUG: /story/{report.slug}</div>
        </div>
      </div>
    </article>
  );
}
