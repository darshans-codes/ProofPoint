import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllAssets, getAssets, getProjects, getSuggestedPairs, getReports } from '../api/client';
import { useProject } from '../context/ProjectContext';
import AssetCard from '../components/AssetCard';
import VerificationStamp from '../components/VerificationStamp';
import SkeletonGrid from '../components/SkeletonGrid';
import EmptyState from '../components/EmptyState';
import { ArrowRight, Layers, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Overview() {
  const { selectedProjectId, selectedProject } = useProject();
  const [stats, setStats] = useState({
    totalAssets: 0,
    verifiedCount: 0,
    verifiedPercent: 0,
    projectsCount: 0,
    reportsCount: 0,
  });
  const [recentAssets, setRecentAssets] = useState([]);
  const [suggestedPairs, setSuggestedPairs] = useState([]);
  const [reports, setReports] = useState([]);
  const [uploadsOverTime, setUploadsOverTime] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params = {};
        if (selectedProjectId !== 'all') {
          params.projectId = selectedProjectId;
        }

        const [assetsRes, allAssets, projectsRes, pairsRes, reportsRes] = await Promise.all([
          getAssets({ ...params, limit: 6 }),
          getAllAssets(params),
          getProjects(),
          getSuggestedPairs(selectedProjectId !== 'all' ? selectedProjectId : undefined),
          getReports(selectedProjectId !== 'all' ? selectedProjectId : undefined),
        ]);

        const totalAssets = assetsRes.pagination?.total || 0;
        const verifiedCount = assetsRes.counts?.verified || 0;
        const verifiedPercent = totalAssets > 0 ? Math.round((verifiedCount / totalAssets) * 100) : 0;

        setStats({
          totalAssets,
          verifiedCount,
          verifiedPercent,
          projectsCount: projectsRes.length,
          reportsCount: reportsRes.length,
        });

        setRecentAssets(assetsRes.assets || []);
        setSuggestedPairs(pairsRes.slice(0, 4));
        setReports(reportsRes.slice(0, 4));
        const byDate = allAssets.reduce((groups, asset) => {
          const date = new Date(asset.capturedDate || asset.createdAt).toISOString().split('T')[0];
          groups[date] = (groups[date] || 0) + 1;
          return groups;
        }, {});
        setUploadsOverTime(Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).slice(-14));
      } catch (err) {
        console.error('[Overview] Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedProjectId]);

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#D8D2C4] pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#2F5D46] mb-1">
            <span>FIELD EVIDENCE DISPATCH</span>
            <span>•</span>
            <span>{selectedProject ? selectedProject.name : 'ALL ACTIVE MONITORING CONCESSIONS'}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1B221D] font-normal tracking-tight">
            Evidence overview
          </h1>
          <p className="text-sm font-sans text-[#5F6A61] mt-1">
            Real-time evidentiary status, hardware-verified sensor anchors, and automatic before/after pairings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/app/upload"
            className="inline-flex items-center gap-2 bg-[#2F5D46] hover:bg-[#244A38] text-[#FBF9F4] text-xs font-medium px-4 py-2.5 rounded-[2px] transition-colors"
          >
            <span>Intake New Batch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Large Metric Figures separated by vertical hairlines */}
      <div className="grid grid-cols-2 md:grid-cols-4 border border-[#D8D2C4] bg-[#FBF9F4] divide-y md:divide-y-0 md:divide-x divide-[#D8D2C4]">
        <div className="p-6">
          <span className="text-[11px] font-mono text-[#5F6A61] uppercase tracking-wider block mb-1">
            PHOTOS IN ARCHIVE
          </span>
          <div className="font-serif text-4xl sm:text-5xl text-[#1B221D] font-normal">
            {stats.totalAssets}
          </div>
          <div className="text-[11px] font-mono text-[#5F6A61] mt-2">
            RAW CAMERA SENSOR INGESTION
          </div>
        </div>

        <div className="p-6">
          <span className="text-[11px] font-mono text-[#5F6A61] uppercase tracking-wider block mb-1">
            VERIFIED RATIO
          </span>
          <div className="font-serif text-4xl sm:text-5xl text-[#2F6B4A] font-normal">
            {stats.verifiedPercent}%
          </div>
          <div className="text-[11px] font-mono text-[#2F6B4A] mt-2">
            {stats.verifiedCount} OF {stats.totalAssets} PASSED ALL CHECKS
          </div>
        </div>

        <div className="p-6">
          <span className="text-[11px] font-mono text-[#5F6A61] uppercase tracking-wider block mb-1">
            ACTIVE PROJECTS
          </span>
          <div className="font-serif text-4xl sm:text-5xl text-[#1B221D] font-normal">
            {stats.projectsCount}
          </div>
          <div className="text-[11px] font-mono text-[#5F6A61] mt-2">
            MONITORED CONCESSIONS
          </div>
        </div>

        <div className="p-6">
          <span className="text-[11px] font-mono text-[#5F6A61] uppercase tracking-wider block mb-1">
            IMPACT STORIES
          </span>
          <div className="font-serif text-4xl sm:text-5xl text-[#1B221D] font-normal">
            {stats.reportsCount}
          </div>
          <div className="text-[11px] font-mono text-[#5F6A61] mt-2">
            PUBLISHED PUBLIC AUDITS
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#D8D2C4] pb-2">
          <h2 className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1B221D]">
            Uploads over time
          </h2>
          <span className="text-[10px] font-mono text-[#5F6A61]">CAPTURE DATE / FRAME COUNT</span>
        </div>
        {loading ? (
          <div className="h-40 border border-[#D8D2C4] bg-[#FBF9F4] animate-pulse" />
        ) : uploadsOverTime.length === 0 ? (
          <div className="py-10 border-y border-[#D8D2C4] text-center text-xs font-mono text-[#5F6A61]">
            No dated frames available for this view.
          </div>
        ) : (
          <div className="border-y border-[#D8D2C4] bg-[#FBF9F4] p-4">
            <svg viewBox="0 0 700 180" className="w-full h-44" role="img" aria-label="Uploads over time chart">
              <line x1="24" y1="150" x2="680" y2="150" stroke="#D8D2C4" />
              <line x1="24" y1="24" x2="24" y2="150" stroke="#D8D2C4" />
              <polyline
                fill="none"
                stroke="#2F5D46"
                strokeWidth="2"
                points={uploadsOverTime.map(([, count], index) => {
                  const max = Math.max(...uploadsOverTime.map(([, value]) => value), 1);
                  const x = 28 + (index / Math.max(uploadsOverTime.length - 1, 1)) * 648;
                  const y = 150 - (count / max) * 112;
                  return `${x},${y}`;
                }).join(' ')}
              />
              {uploadsOverTime.map(([date, count], index) => {
                const max = Math.max(...uploadsOverTime.map(([, value]) => value), 1);
                const x = 28 + (index / Math.max(uploadsOverTime.length - 1, 1)) * 648;
                const y = 150 - (count / max) * 112;
                return <circle key={date} cx={x} cy={y} r="3" fill="#2F5D46"><title>{date}: {count} frames</title></circle>;
              })}
            </svg>
            <div className="flex justify-between text-[10px] font-mono text-[#5F6A61]">
              <span>{uploadsOverTime[0][0]}</span>
              <span>{uploadsOverTime[uploadsOverTime.length - 1][0]}</span>
            </div>
          </div>
        )}
      </section>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Recent Frames contact sheet */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[#D8D2C4] pb-2">
            <h2 className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1B221D]">
              Recent Field Frames
            </h2>
            <Link
              to="/app/gallery"
              className="text-xs font-mono text-[#2F5D46] hover:underline flex items-center gap-1"
            >
              <span>View full contact sheet</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <SkeletonGrid count={6} columns={3} />
          ) : recentAssets.length === 0 ? (
            <EmptyState
              title="No evidence ingested yet"
              description="Upload your first batch of camera or drone field media to begin automated EXIF verification and AI analysis."
              actionLabel="Intake Evidence"
              actionTo="/app/upload"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recentAssets.map((asset) => (
                <AssetCard key={asset._id} asset={asset} />
              ))}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Suggested Pairs & Published Reports */}
        <div className="lg:col-span-5 space-y-8">
          {/* Suggested Pairs Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#D8D2C4] pb-2">
              <h2 className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1B221D]">
                Suggested Before/After Pairs
              </h2>
              <Link
                to="/app/compare"
                className="text-xs font-mono text-[#2F5D46] hover:underline flex items-center gap-1"
              >
                <span>Comparison suite</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {suggestedPairs.length === 0 ? (
              <div className="p-6 border border-[#D8D2C4] bg-[#FBF9F4] text-xs font-mono text-[#5F6A61] text-center">
                Pairing algorithm searches for assets taken within 100 meters and at least 1 day apart. None detected in current selection.
              </div>
            ) : (
              <div className="divide-y divide-[#D8D2C4] border border-[#D8D2C4] bg-[#FBF9F4]">
                {suggestedPairs.map((pair) => {
                  const beforeThumb =
                    pair.before.transformations?.thumb ||
                    pair.before.cloudinary?.secureUrl;
                  const afterThumb =
                    pair.after.transformations?.thumb ||
                    pair.after.cloudinary?.secureUrl;

                  return (
                    <Link
                      key={pair.id}
                      to="/app/compare"
                      state={{ pair }}
                      className="p-3.5 flex items-center justify-between hover:bg-[#F5F2EB]/60 transition-colors group block"
                    >
                      <div className="flex items-center gap-3">
                        {/* Dual mini-thumbnails */}
                        <div className="flex items-center -space-x-2">
                          <img
                            src={beforeThumb}
                            alt="Before"
                            className="w-12 h-10 object-cover border border-[#D8D2C4] rounded-[1px]"
                          />
                          <img
                            src={afterThumb}
                            alt="After"
                            className="w-12 h-10 object-cover border border-[#D8D2C4] rounded-[1px]"
                          />
                        </div>

                        <div className="text-left">
                          <div className="font-serif text-sm font-semibold text-[#1B221D] group-hover:text-[#2F5D46] transition-colors">
                            {pair.locationName || 'Field Observation Site'}
                          </div>
                          <div className="text-[10px] font-mono text-[#5F6A61]">
                            {pair.daysBetween} DAYS APART • {pair.distanceMeters}M SEPARATION
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 border border-[#2F6B4A]/30 text-[#2F6B4A] bg-[#E4EEE7] rounded-[1px] uppercase">
                          {pair.confidence}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#5F6A61] group-hover:text-[#1B221D]" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Published Reports Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#D8D2C4] pb-2">
              <h2 className="font-mono text-xs uppercase tracking-wider font-semibold text-[#1B221D]">
                Published Impact Reports
              </h2>
              <Link
                to="/app/reports"
                className="text-xs font-mono text-[#2F5D46] hover:underline flex items-center gap-1"
              >
                <span>All reports</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {reports.length === 0 ? (
              <div className="p-6 border border-[#D8D2C4] bg-[#FBF9F4] text-xs font-mono text-[#5F6A61] text-center">
                No public reports generated yet.
              </div>
            ) : (
              <div className="divide-y divide-[#D8D2C4] border border-[#D8D2C4] bg-[#FBF9F4]">
                {reports.map((report) => (
                  <Link
                    key={report._id}
                    to={`/story/${report.slug}`}
                    className="p-3.5 flex items-center justify-between hover:bg-[#F5F2EB]/60 transition-colors group block"
                  >
                    <div>
                      <div className="font-serif text-sm font-semibold text-[#1B221D] group-hover:text-[#2F5D46] transition-colors">
                        {report.title}
                      </div>
                      <div className="text-[10px] font-mono text-[#5F6A61] mt-0.5">
                        {report.project?.name} • {report.verifiedPercent}% VERIFIED
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-[#2F5D46] group-hover:underline">
                      View Story →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
