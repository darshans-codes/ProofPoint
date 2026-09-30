import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSuggestedPairs, compareAssets, createReport } from '../api/client';
import { useProject } from '../context/ProjectContext';
import CompareViewer from '../components/CompareViewer';
import VerificationStamp from '../components/VerificationStamp';
import AiEstimateTag from '../components/AiEstimateTag';
import Ledger from '../components/Ledger';
import { ArrowRight, FilePlus, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

export default function Compare() {
  const { selectedProjectId } = useProject();
  const location = useLocation();
  const navigate = useNavigate();

  const [pairs, setPairs] = useState([]);
  const [selectedPair, setSelectedPair] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [comparisonError, setComparisonError] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);

  // Load suggested pairs
  useEffect(() => {
    async function loadPairs() {
      try {
        const list = await getSuggestedPairs(
          selectedProjectId !== 'all' ? selectedProjectId : undefined
        );
        setPairs(list);

        // Check if navigated with a specific pair in location state
        if (location.state?.pair) {
          setSelectedPair(location.state.pair);
        } else if (list.length > 0) {
          setSelectedPair(list[0]);
        }
      } catch (err) {
        console.error('[Compare] Load pairs error:', err);
      }
    }

    loadPairs();
  }, [selectedProjectId]);

  // When selectedPair changes, execute comparison
  useEffect(() => {
    if (!selectedPair?.before?._id || !selectedPair?.after?._id) return;

    async function runComparison() {
      setLoadingCompare(true);
      setComparisonError('');
      try {
        const res = await compareAssets(
          selectedPair.before._id,
          selectedPair.after._id
        );
        setComparisonData(res);
      } catch (err) {
        console.error('[Compare] Execution error:', err);
        setComparisonError(err.response?.data?.error || 'This comparison could not be evaluated.');
      } finally {
        setLoadingCompare(false);
      }
    }

    runComparison();
  }, [selectedPair]);

  // Quick report creation from current pair
  const handleAddToReport = async () => {
    if (!selectedPair) return;
    setGeneratingReport(true);
    try {
      const title = `${selectedPair.projectName || 'Site'} Impact Comparative Audit`;
      const report = await createReport({
        title,
        projectId: selectedPair.before.project,
        assetIds: [selectedPair.before._id, selectedPair.after._id],
        beforeId: selectedPair.before._id,
        afterId: selectedPair.after._id,
      });

      navigate(`/story/${report.slug}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const changeColumns = [
    {
      header: 'ASPECT / BENCHMARK',
      accessor: (c) => <span className="font-semibold text-[#1B221D]">{c.aspect}</span>,
    },
    {
      header: 'BASELINE OBSERVATION',
      accessor: (c) => <span className="font-sans text-[#5F6A61]">{c.before}</span>,
    },
    {
      header: 'FOLLOW-UP OBSERVATION',
      accessor: (c) => <span className="font-sans text-[#1B221D] font-medium">{c.after}</span>,
    },
    {
      header: 'DIRECTION OF CHANGE',
      accessor: (c) => {
        const dir = (c.direction || 'neutral').toLowerCase();
        let color = 'text-[#5F6A61] bg-[#F5F2EB] border-[#D8D2C4]';
        if (dir === 'improved') color = 'text-[#2F6B4A] bg-[#E4EEE7] border-[#2F6B4A]/30';
        if (dir === 'worsened') color = 'text-[#A63A2B] bg-[#F3DAD5] border-[#A63A2B]/30';

        return (
          <span className={`inline-block font-mono text-[10px] px-2 py-0.5 border rounded-[1px] uppercase ${color}`}>
            {dir}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-10 max-w-[1360px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#D8D2C4] pb-6 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#2F5D46] block mb-1">
            SPATIAL & TEMPORAL COMPARISON
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1B221D] font-normal tracking-tight">
            Before & After Verification Suite
          </h1>
          <p className="text-sm font-sans text-[#5F6A61] mt-1 max-w-2xl">
            Autonomous spatial pairing links baseline recordings with follow-up interventions within a 100-meter radius. Multimodal vision measures physical differences and environmental progress.
          </p>
        </div>

        {selectedPair && (
          <button
            onClick={handleAddToReport}
            disabled={generatingReport}
            className="inline-flex items-center gap-2 bg-[#2F5D46] hover:bg-[#244A38] text-[#FBF9F4] text-xs font-mono uppercase tracking-wider px-4 py-2.5 rounded-[2px] transition-colors cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            <span>{generatingReport ? 'Compiling Report...' : 'Publish As Impact Story'}</span>
          </button>
        )}
      </div>

      {/* Suggested Pairs Selector */}
      {pairs.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-mono text-[#5F6A61] uppercase tracking-wider block">
            SUGGESTED SPATIAL PAIRS IN REPOSITORY ({pairs.length}):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pairs.map((p) => {
              const isSelected = selectedPair?.id === p.id;
              const beforeImg = p.before.transformations?.thumb || p.before.cloudinary?.secureUrl;
              const afterImg = p.after.transformations?.thumb || p.after.cloudinary?.secureUrl;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPair(p)}
                  className={`p-3 border rounded-[2px] cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-[#2F5D46] bg-[#F5F2EB] ring-1 ring-[#2F5D46]'
                      : 'border-[#D8D2C4] bg-[#FBF9F4] hover:border-[#1B221D]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center -space-x-2 flex-shrink-0">
                      <img src={beforeImg} alt="Before" className="w-12 h-9 object-cover border border-[#D8D2C4]" />
                      <img src={afterImg} alt="After" className="w-12 h-9 object-cover border border-[#D8D2C4]" />
                    </div>
                    <div>
                      <div className="font-serif text-sm font-semibold text-[#1B221D] truncate max-w-[160px]">
                        {p.locationName || 'Field Observation Site'}
                      </div>
                      <div className="text-[10px] font-mono text-[#5F6A61]">
                        {p.daysBetween} DAYS APART • {p.distanceMeters}M
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-[#2F5D46] uppercase font-semibold">
                    {isSelected ? 'ACTIVE' : 'SELECT'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Comparison Area */}
      {selectedPair ? (
        <div className="space-y-8">
          {/* Tactile Slider */}
          {loadingCompare ? (
            <div className="border border-[#D8D2C4] bg-[#FBF9F4] p-12 text-center font-mono text-xs text-[#5F6A61]">
              READING COMPARISON RECORDS...
            </div>
          ) : comparisonError ? (
            <div className="border border-[#A63A2B] bg-[#F3DAD5] p-6 text-sm text-[#A63A2B]">
              {comparisonError}
            </div>
          ) : (
            <CompareViewer
              beforeAsset={selectedPair.before}
              afterAsset={selectedPair.after}
              distanceMeters={selectedPair.distanceMeters}
              daysBetween={selectedPair.daysBetween}
            />
          )}

          {/* AI Estimate Analysis & Metric Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left (7 cols): AI Analysis Paragraph & Changes Ledger */}
            <div className="lg:col-span-7 space-y-6">
              <div className="border border-[#D8D2C4] bg-[#FBF9F4] p-6 rounded-[2px] space-y-3">
                <div className="flex items-center justify-between border-b border-[#D8D2C4] pb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F6A61]">
                    FACTUAL OBSERVATION SUMMARY
                  </span>
                  <AiEstimateTag />
                </div>
                <p className="text-sm font-sans text-[#1B221D] leading-relaxed">
                  {loadingCompare
                    ? 'Comparison analysis is in progress.'
                    : comparisonData?.comparison?.summary || 'No analysis is available for this pair.'}
                </p>
                <div className="text-[10px] font-mono text-[#5F6A61]">
                  CONFIDENCE RATING:{' '}
                  <span className="uppercase font-semibold text-[#2F6B4A]">
                    {comparisonData?.comparison?.confidence || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Changes Ledger */}
              <Ledger
                title="Observed Environmental Changes Ledger"
                columns={changeColumns}
                rows={comparisonData?.comparison?.changes || []}
                emptyText="Changes being calculated..."
              />
            </div>

            {/* Right (5 cols): Metric Deltas Table */}
            <div className="lg:col-span-5 border border-[#D8D2C4] bg-[#FBF9F4] p-6 rounded-[2px] space-y-4">
              <div className="flex items-center justify-between border-b border-[#D8D2C4] pb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F6A61]">
                  STRUCTURED METRICS DELTA
                </span>
                <AiEstimateTag />
              </div>

              <div className="divide-y divide-[#D8D2C4] text-xs font-mono">
                {(comparisonData?.metricsSummary || []).map((m, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[#1B221D] font-medium block">{m.label}</span>
                      <span className="text-[10px] text-[#5F6A61]">
                        {m.before} → {m.after}
                      </span>
                    </div>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-[1px] ${
                        m.direction === 'improved'
                          ? 'text-[#2F6B4A] bg-[#E4EEE7]'
                          : m.direction === 'worsened'
                          ? 'text-[#A63A2B] bg-[#F3DAD5]'
                          : 'text-[#1B221D] bg-[#F5F2EB]'
                      }`}
                    >
                      {m.change}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#D8D2C4]">
                <button
                  onClick={handleAddToReport}
                  disabled={generatingReport}
                  className="w-full bg-[#2F5D46] hover:bg-[#244A38] text-[#FBF9F4] text-xs font-mono uppercase tracking-wider py-3 rounded-[2px] transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>{generatingReport ? 'Compiling Report...' : 'Publish As Impact Story'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 border border-[#D8D2C4] bg-[#FBF9F4] text-center font-mono text-xs text-[#5F6A61]">
          No suggested pairs found for this project yet. Ensure you have at least two photographs with GPS or matching location names taken at least 1 day apart.
        </div>
      )}
    </div>
  );
}
