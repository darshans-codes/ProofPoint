import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { getReports, getAssets, getSuggestedPairs, createReport } from '../api/client';
import { useProject } from '../context/ProjectContext';
import VerificationStamp from '../components/VerificationStamp';
import Ledger from '../components/Ledger';
import EmptyState from '../components/EmptyState';
import EvidenceImage from '../components/EvidenceImage';
import { Plus, ArrowRight, FileText, Check, ShieldCheck, X } from 'lucide-react';

export default function Reports() {
  const { projects, selectedProjectId } = useProject();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal 3-step workflow state
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [reportTitle, setReportTitle] = useState('');
  const [modalProjectId, setModalProjectId] = useState('');
  const [projectAssets, setProjectAssets] = useState([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState(new Set());
  const [suggestedPairs, setSuggestedPairs] = useState([]);
  const [selectedPair, setSelectedPair] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const closeButtonRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!modalOpen) return undefined;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setModalOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  const fetchReportsList = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getReports(
        selectedProjectId !== 'all' ? selectedProjectId : undefined
      );
      setReports(data);
    } catch (err) {
      console.error('[Reports Error]', err);
      setErrorMessage(err.response?.data?.error || 'Reports could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsList();
  }, [selectedProjectId]);

  // Load project assets and pairs when modal project changes
  useEffect(() => {
    if (!modalProjectId) return;
    async function loadProjectDetails() {
      try {
        const [assetRes, pairRes] = await Promise.all([
          getAssets({ projectId: modalProjectId, limit: 50 }),
          getSuggestedPairs(modalProjectId),
        ]);

        const assets = assetRes.assets || [];
        setProjectAssets(assets);
        setSuggestedPairs(pairRes || []);

        // Pre-select verified assets by default
        const initialSelected = new Set(
          assets.filter((a) => a.verification?.status === 'verified').map((a) => a._id)
        );
        setSelectedAssetIds(initialSelected);

        if (pairRes?.length > 0) {
          setSelectedPair(pairRes[0]);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadProjectDetails();
  }, [modalProjectId]);

  const toggleSelectAsset = (id) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerateReport = async () => {
    if (!reportTitle.trim() || !modalProjectId) return;
    setSubmitting(true);
    try {
      const res = await createReport({
        title: reportTitle.trim(),
        projectId: modalProjectId,
        assetIds: Array.from(selectedAssetIds),
        beforeId: selectedPair?.before?._id,
        afterId: selectedPair?.after?._id,
      });

      setModalOpen(false);
      navigate(`/story/${res.slug}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create report');
    } finally {
      setSubmitting(false);
    }
  };

  const reportColumns = [
    {
      header: 'HERO SPECIMEN',
      accessor: (r) => {
        return (
          <EvidenceImage
            asset={r.heroAssetId}
            alt="Hero thumbnail"
            className="w-16 h-11 object-cover border border-[#D8D2C4] rounded-[1px]"
          />
        );
      },
    },
    {
      header: 'REPORT TITLE & HEADLINE',
      accessor: (r) => (
        <div>
          <Link
            to={`/story/${r.slug}`}
            className="font-serif text-sm font-semibold text-[#1B221D] hover:text-[#2F5D46] underline"
          >
            {r.title}
          </Link>
          <div className="text-[11px] font-sans text-[#5F6A61] line-clamp-1 mt-0.5">
            {r.headline || 'Audited field impact story'}
          </div>
        </div>
      ),
    },
    {
      header: 'PROJECT CONCESSION',
      accessor: (r) => <span className="font-mono text-xs text-[#1B221D]">{r.project?.name}</span>,
    },
    {
      header: 'PUBLISHED DATE',
      accessor: (r) => (
        <span className="font-mono text-xs text-[#5F6A61]">
          {new Date(r.createdAt).toISOString().split('T')[0]}
        </span>
      ),
    },
    {
      header: 'VERIFIED RATIO',
      accessor: (r) => (
        <span className="font-mono text-xs font-semibold text-[#2F6B4A]">
          {r.verifiedPercent}% VERIFIED
        </span>
      ),
    },
    {
      header: 'PUBLIC STORY',
      accessor: (r) => (
        <Link
          to={`/story/${r.slug}`}
          className="inline-flex items-center gap-1 font-mono text-xs text-[#2F5D46] hover:underline"
        >
          <span>Open Story</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-8 max-w-[1360px] mx-auto">
      {errorMessage && <div className="border border-[#A63A2B] bg-[#F3DAD5] p-3 text-xs font-mono text-[#A63A2B]" role="alert">{errorMessage}</div>}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#D8D2C4] pb-6 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#2F5D46] block mb-1">
            PUBLIC AUDIT ARCHIVE
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1B221D] font-normal tracking-tight">
            Published Impact Reports
          </h1>
          <p className="text-sm font-sans text-[#5F6A61] mt-1 max-w-2xl">
            Compiled multi-asset evidence dossiers designed for institutional donors, board reviews, and public accountability.
          </p>
        </div>

        <button
          onClick={() => {
            setModalProjectId(projects[0]?._id || '');
            setReportTitle('');
            setStep(1);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-[#2F5D46] hover:bg-[#244A38] text-[#FBF9F4] text-xs font-mono uppercase tracking-wider px-4 py-2.5 rounded-[2px] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Report</span>
        </button>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="p-12 border border-[#D8D2C4] bg-[#FBF9F4] text-center font-mono text-xs text-[#5F6A61] animate-pulse">
          LOADING PUBLISHED AUDIT REPORTS...
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          title="No published impact reports yet"
          description="Synthesize your verified evidence and before/after pairs into an editorial public impact story."
          actionLabel="Generate Report"
          onAction={() => {
            setModalProjectId(projects[0]?._id || '');
            setReportTitle('');
            setStep(1);
            setModalOpen(true);
          }}
        />
      ) : (
        <Ledger
          title="Published Institutional Impact Reports"
          columns={reportColumns}
          rows={reports}
        />
      )}

      {/* 3-Step Report Creation Modal */}
      {modalOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-[#1B221D]/60 flex items-center justify-center p-4"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0 }}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModalOpen(false);
          }}
        >
          <motion.div
            className="w-full max-w-3xl max-h-[90vh] bg-[#FBF9F4] border border-[#D8D2C4] rounded-[2px] flex flex-col"
            initial={reducedMotion ? false : { y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-[#D8D2C4] bg-[#F5F2EB] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#5F6A61] uppercase tracking-wider block">
                  STEP {step} OF 3
                </span>
                <h3 id="report-modal-title" className="font-serif text-lg font-semibold text-[#1B221D]">
                  {step === 1 && 'Choose Project & Evidence Records'}
                  {step === 2 && 'Select Comparative Before/After Anchor'}
                  {step === 3 && 'Review Dossier & Generate Factual Arc'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                ref={closeButtonRef}
                aria-label="Close report dialog"
                className="text-[#5F6A61] hover:text-[#1B221D] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs font-mono">
              {/* STEP 1: Choose project & evidence */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[#1B221D] uppercase">Report Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Acre River Basin Q3 Restoration Dossier"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        className="w-full bg-[#F5F2EB] border border-[#D8D2C4] p-2 text-xs font-mono rounded-[2px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[#1B221D] uppercase">Project *</label>
                      <select
                        value={modalProjectId}
                        onChange={(e) => setModalProjectId(e.target.value)}
                        className="w-full bg-[#F5F2EB] border border-[#D8D2C4] p-2 text-xs font-mono rounded-[2px]"
                      >
                        {projects.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#D8D2C4]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#1B221D] uppercase">
                        Select Evidentiary Frames ({selectedAssetIds.size} of {projectAssets.length} selected):
                      </span>
                      <span className="text-[10px] text-[#2F6B4A]">SELECT RECORDS FOR REVIEW</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1 border border-[#D8D2C4] bg-[#F5F2EB]">
                      {projectAssets.map((asset) => {
                        const isSelected = selectedAssetIds.has(asset._id);
                        return (
                          <button
                            type="button"
                            key={asset._id}
                            onClick={() => toggleSelectAsset(asset._id)}
                            aria-pressed={isSelected}
                            aria-label={`${isSelected ? 'Remove' : 'Select'} evidence frame PP-${asset._id.slice(-4).toUpperCase()}`}
                            className={`p-1.5 border rounded-[1px] cursor-pointer transition-colors relative ${
                              isSelected
                                ? 'border-[#2F5D46] bg-[#E4EEE7]'
                                : 'border-[#D8D2C4] bg-[#FBF9F4]'
                            }`}
                          >
                            <EvidenceImage
                              asset={asset}
                              alt="thumb"
                              className="w-full aspect-[4/3] object-cover mb-1"
                            />
                            <div className="text-[10px] flex items-center justify-between">
                              <span className="font-semibold text-[#1B221D]">
                                PP-{asset._id.slice(-4).toUpperCase()}
                              </span>
                              <VerificationStamp
                                status={asset.verification?.status}
                                score={asset.verification?.score}
                                size="sm"
                              />
                            </div>
                            </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Choose before/after pair */}
              {step === 2 && (
                <div className="space-y-4">
                  <span className="text-[#1B221D] uppercase block">
                    Choose Primary Comparative Pair (Optional but Recommended):
                  </span>

                  {suggestedPairs.length === 0 ? (
                    <div className="p-6 border border-[#D8D2C4] text-center text-[#5F6A61]">
                      No automated pairs detected for this project. You may proceed without an anchor pair.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {suggestedPairs.map((p) => {
                        const isChosen = selectedPair?.id === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPair(isChosen ? null : p)}
                            className={`p-3 border rounded-[2px] cursor-pointer flex items-center justify-between ${
                              isChosen
                                ? 'border-[#2F5D46] bg-[#E4EEE7] ring-1 ring-[#2F5D46]'
                                : 'border-[#D8D2C4] bg-[#F5F2EB]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center -space-x-2">
                                <EvidenceImage
                                  asset={p.before}
                                  alt="before"
                                  className="w-12 h-9 object-cover border border-[#D8D2C4]"
                                />
                                <EvidenceImage
                                  asset={p.after}
                                  alt="after"
                                  className="w-12 h-9 object-cover border border-[#D8D2C4]"
                                />
                              </div>
                              <div>
                                <div className="font-serif text-sm font-semibold text-[#1B221D]">
                                  {p.locationName}
                                </div>
                                <div className="text-[10px] text-[#5F6A61]">
                                  {p.daysBetween} DAYS APART • {p.distanceMeters}M SEPARATION
                                </div>
                              </div>
                            </div>
                            <span className="font-semibold text-xs text-[#2F5D46]">
                              {isChosen ? 'SELECTED' : 'SELECT'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Review and Generate */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="p-4 border border-[#D8D2C4] bg-[#F5F2EB] space-y-2">
                    <div className="text-sm font-serif font-semibold text-[#1B221D]">
                      {reportTitle}
                    </div>
                    <div className="text-xs text-[#5F6A61]">
                      TOTAL FRAMES INCLUDED: {selectedAssetIds.size}
                    </div>
                    {selectedPair && (
                      <div className="text-xs text-[#2F6B4A] font-semibold">
                        BEFORE/AFTER ANCHOR LINKED ({selectedPair.locationName})
                      </div>
                    )}
                  </div>

                  <p className="font-sans text-xs text-[#5F6A61] leading-relaxed">
                    Upon clicking "Generate & Publish", ProofPoint will query the Gemini multimodal engine to generate a factual 150-200 word publication narrative, compute verifiable metric deltas, and publish an auditable Impact Story with a public shareable URL.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-[#D8D2C4] bg-[#F5F2EB] flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 border border-[#D8D2C4] bg-[#FBF9F4] text-xs font-mono uppercase rounded-[2px]"
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  disabled={step === 1 && (!reportTitle.trim() || selectedAssetIds.size === 0)}
                  onClick={() => setStep(step + 1)}
                  className="px-5 py-2 bg-[#2F5D46] hover:bg-[#244A38] disabled:opacity-50 text-[#FBF9F4] text-xs font-mono uppercase rounded-[2px]"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleGenerateReport}
                  className="px-6 py-2.5 bg-[#2F5D46] hover:bg-[#244A38] text-[#FBF9F4] text-xs font-mono uppercase rounded-[2px] inline-flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'Generating...' : 'Generate & Publish Impact Story'}</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
