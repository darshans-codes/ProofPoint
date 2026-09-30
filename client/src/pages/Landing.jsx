import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react';
import ProofPointTerrain from '../components/ProofPointTerrain';
import CompareViewer from '../components/CompareViewer';
import EvidenceImage from '../components/EvidenceImage';
import VerificationStamp from '../components/VerificationStamp';
import AiEstimateTag from '../components/AiEstimateTag';
import Footer from '../components/Footer';
import { getAllAssets, getProjects, getSuggestedPairs } from '../api/client';
import {
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  FileCheck,
  ChevronRight,
} from 'lucide-react';

const CHECKS = [
  {
    number: '01',
    name: 'GPS Coordinates Present',
    threshold: 'EXIF Latitude & Longitude Block',
    detail: 'Extracts hardware-recorded spatial coordinates directly from the image header. Rejects stripped or missing GPS metadata.',
    weight: '20 PTS',
  },
  {
    number: '02',
    name: 'Location Matches Claim',
    threshold: 'Haversine distance < 2.0 km',
    detail: 'Compares recorded hardware coordinates against the NGO field project boundary to confirm physical presence on site.',
    weight: '25 PTS',
  },
  {
    number: '03',
    name: 'EXIF Timestamp Confirmed',
    threshold: 'Hardware DateTimeOriginal record',
    detail: 'Verifies original shutter actuation timestamp against claimed reporting period, preventing re-use of historical media.',
    weight: '15 PTS',
  },
  {
    number: '04',
    name: 'Capture Date Matches Claim',
    threshold: 'Delta within +/- 48 hours',
    detail: 'Validates that claimed project milestone dates strictly correlate with camera sensor actuation timestamps.',
    weight: '20 PTS',
  },
  {
    number: '05',
    name: 'Perceptual Duplicate Detection',
    threshold: 'dHash 64-bit (Hamming distance > 5)',
    detail: 'Computes grayscale gradient hashes across rows to detect recycled, rotated, or slightly cropped photos from previous grants.',
    weight: '15 PTS',
  },
  {
    number: '06',
    name: 'AI Objective Vision Analysis',
    threshold: 'Gemini Multimodal Verification',
    detail: 'Automated extraction of factual captions, activity classification, and structured environmental metric estimates.',
    weight: '5 PTS',
  },
];

const TRANSFORMATION_STEPS = [
  {
    step: '01 / UPLOAD',
    title: 'Field Ingestion',
    desc: 'Rangers and field biologists upload batch photos directly from cameras or mobile devices with raw EXIF metadata intact.',
    preview: {
      type: 'raw',
      title: 'FILE: IMG_4821.JPG',
      meta: '4.2 MB • Canon EOS 5D Mark IV',
    },
  },
  {
    step: '02 / CHECK',
    title: 'Cryptographic & EXIF Audit',
    desc: 'ProofPoint cross-references GPS against concession boundaries, checks temporal variance, and flags perceptual duplicate images.',
    preview: {
      type: 'verified',
      title: 'AUDIT PASSED: 94/100',
      meta: 'GPS: -9.9749, -67.8243 • Delta: 2.1 hrs',
    },
  },
  {
    step: '03 / COMPARE',
    title: 'Before and after',
    desc: 'Algorithms pair baseline and follow-up frames within 100 meters, extracting metric deltas for canopy, waste, and water clarity.',
    preview: {
      type: 'compare',
      title: 'PAIR CONFIRMED: 92 DAYS APART',
      meta: '+14 Native Trees • Waste Remediated',
    },
  },
  {
    step: '04 / PUBLISH',
    title: 'Auditable Donor Impact Story',
    desc: 'The verified record is compiled into an editorial public report with an immutable chain of custody for institutional donors.',
    preview: {
      type: 'publish',
      title: 'IMPACT STORY PUBLISHED',
      meta: 'Public URL • 100% Provenance Traceable',
    },
  },
];

export default function Landing() {
  const reduceMotion = useReducedMotion();
  const storyRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [landingData, setLandingData] = useState({ assets: [], pairs: [], projects: [], error: null });
  const { scrollYProgress: storyScroll } = useScroll({
    target: storyRef,
    offset: ['start start', 'end end'],
  });
  const storyScale = useSpring(useTransform(storyScroll, [0, 1], [1, 1.045]), { stiffness: 90, damping: 24 });
  const storyX = useSpring(useTransform(storyScroll, [0, 1], ['0%', '-4%']), { stiffness: 90, damping: 24 });
  const storyRule = useTransform(storyScroll, [0, 1], ['0%', '100%']);

  useEffect(() => {
    let active = true;
    Promise.all([getAllAssets(), getProjects(), getSuggestedPairs()])
      .then(([assets, projects, pairs]) => {
        if (active) setLandingData({ assets, projects, pairs, error: null });
      })
      .catch((error) => {
        if (active) setLandingData((current) => ({ ...current, error }));
      });
    return () => {
      active = false;
    };
  }, []);

  useMotionValueEvent(storyScroll, 'change', (value) => {
    if (reduceMotion) return;
    setActiveStep(Math.min(3, Math.floor(value * 4.01)));
  });

  const locations = landingData.projects
    .map((project) => {
      const projectAssets = landingData.assets.filter(
        (asset) => asset.project === project._id || asset.project?._id === project._id
      );
      const geoAsset = projectAssets.find(
        (asset) => asset.exif?.hasGps && Number.isFinite(asset.exif.lat) && Number.isFinite(asset.exif.lng)
      );
      if (!geoAsset) return null;
      return {
        id: project._id,
        name: project.name,
        region: project.location,
        lat: geoAsset.exif.lat,
        lng: geoAsset.exif.lng,
        count: project.totalAssets || projectAssets.length,
        verifiedRate: project.verifiedPercent || 0,
      };
    })
    .filter(Boolean);
  const selectedPair = landingData.pairs[0];

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#1B221D] flex flex-col selection:bg-[#2F5D46] selection:text-[#FBF9F4]">
      {/* Top Editorial Bar */}
      <header className="w-full border-b border-[#D8D2C4] bg-[#F5F2EB] sticky top-0 z-30">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-2xl font-semibold tracking-tight text-[#1B221D]">
              ProofPoint
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#5F6A61] border-l border-[#D8D2C4] pl-3 hidden sm:inline-block">
              FIELD EVIDENCE & IMPACT INTELLIGENCE
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="hidden sm:inline text-xs font-mono uppercase tracking-wider text-[#1B221D] hover:text-[#2F5D46] transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 bg-[#2F5D46] hover:bg-[#244A38] text-[#FBF9F4] text-xs font-medium px-4 py-2 rounded-[2px] transition-colors"
            >
              <span>Open the platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative w-full border-b border-[#D8D2C4] overflow-hidden">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-[#D8D2C4] bg-[#FBF9F4] text-[11px] font-mono uppercase tracking-wider text-[#5F6A61] mb-6 rounded-[2px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F5D46]" />
              <span>FIELD RECORDS / PROJECT 02</span>
            </div>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] tracking-tight text-[#1B221D] mb-6"
            >
              Proof for the work you did in the field.
            </motion.h1>

            <p className="text-lg sm:text-xl font-sans text-[#5F6A61] leading-relaxed max-w-2xl mb-8">
              Upload field photos. ProofPoint checks where and when they were taken, catches duplicates, measures what changed, and turns the verified set into a transparent report donors can audit.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-[#2F5D46] hover:bg-[#244A38] text-[#FBF9F4] text-sm font-medium px-6 py-3 rounded-[2px] transition-colors shadow-none"
              >
                <span>Open the platform</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/story/q3-riparian-baseline-audit-b6b425f6"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B221D] hover:text-[#2F5D46] px-4 py-3 border border-[#D8D2C4] hover:border-[#1B221D] rounded-[2px] bg-[#FBF9F4] transition-colors"
              >
                <span>Read a sample report</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Micro verification indicators */}
            <div className="mt-12 pt-6 border-t border-[#D8D2C4] w-full grid grid-cols-3 gap-4 text-xs font-mono text-[#5F6A61]">
              <div>
                <span className="text-[#1B221D] block font-semibold text-base font-serif">100% EXIF</span>
                <span>Hardware verification</span>
              </div>
              <div className="border-l border-[#D8D2C4] pl-4">
                <span className="text-[#2F6B4A] block font-semibold text-base font-serif">dHash 64-bit</span>
                <span>Duplicate detection</span>
              </div>
              <div className="border-l border-[#D8D2C4] pl-4">
                <span className="text-[#1B221D] block font-semibold text-base font-serif">Gemini Vision</span>
                <span>Structured estimates</span>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): 3D Environmental Visualization */}
          <div className="lg:col-span-5 h-[360px] sm:h-[440px] w-full border border-[#D8D2C4] bg-[#FBF9F4] rounded-[2px] overflow-hidden relative">
            <ProofPointTerrain className="h-full w-full" locations={locations} />
          </div>
        </div>
      </section>

      {/* SECTION 2 — EVIDENCE TRANSFORMATION (Scroll-driven narrative) */}
      <section ref={storyRef} className="w-full border-b border-[#D8D2C4] py-20 bg-[#FBF9F4]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-[#D8D2C4] pb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#2F5D46] font-semibold block mb-2">
                02 / FIELD RECORD
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1B221D]">
                How field photography becomes verified evidence.
              </h2>
            </div>
            <p className="text-sm font-sans text-[#5F6A61] max-w-md mt-4 md:mt-0">
              Photos uploaded from remote restoration sites undergo multi-layer hardware, cryptographic, and AI audits before being approved for publication.
            </p>
          </div>

          {/* 4 Interactive Transformation Stages */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
              <div className="relative aspect-[4/3] overflow-hidden border border-[#D8D2C4] bg-[#1B221D]">
                {selectedPair?.before && (
                  <motion.div
                    className="absolute inset-0"
                    style={reduceMotion ? undefined : { scale: storyScale, x: storyX }}
                  >
                    <EvidenceImage
                      asset={selectedPair.before}
                      alt="Baseline field evidence"
                      className="h-full w-full object-cover opacity-80"
                    />
                  </motion.div>
                )}
                <div className="absolute inset-0 bg-[#1B221D]/25" />
                <div className="absolute left-4 right-4 top-4 flex items-center justify-between text-[10px] font-mono text-[#F5F2EB]">
                  <span>FIELD RECORD / SEQUENCE</span>
                  <span>0{activeStep + 1} / 04</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="mb-3 h-px bg-[#F5F2EB]/40">
                    <motion.div className="h-px bg-[#F5F2EB]" style={{ width: reduceMotion ? '0%' : storyRule }} />
                  </div>
                  <p className="max-w-sm font-serif text-2xl leading-tight text-[#F5F2EB]">
                    {TRANSFORMATION_STEPS[activeStep].title}
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7">
            {TRANSFORMATION_STEPS.map((t, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`group block w-full border-b border-[#D8D2C4] py-8 text-left transition-colors first:border-t ${
                  activeStep === idx ? 'bg-[#F5F2EB]' : 'hover:bg-[#F5F2EB]/60'
                }`}
              >
                <div className="grid grid-cols-[56px_1fr] gap-4 px-4 sm:px-6">
                  <span className={`font-mono text-xs tracking-wider transition-colors ${activeStep === idx ? 'text-[#2F5D46]' : 'text-[#5F6A61]'}`}>
                    {t.step.split(' / ')[0]}
                  </span>
                  <div>
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-serif text-2xl text-[#1B221D]">{t.title}</h3>
                      <ChevronRight className={`h-4 w-4 shrink-0 transition-transform duration-300 ${activeStep === idx ? 'translate-x-1 text-[#2F5D46]' : 'text-[#8E9890]'}`} />
                    </div>
                    <p className={`mt-3 max-w-xl text-sm leading-relaxed transition-colors ${activeStep === idx ? 'text-[#1B221D]' : 'text-[#5F6A61]'}`}>
                      {t.desc}
                    </p>
                    <div className={`mt-4 overflow-hidden font-mono text-[10px] transition-[max-height,opacity] duration-300 ${activeStep === idx ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <span className="font-semibold text-[#1B221D]">{t.preview.title}</span>
                      <span className="ml-3 text-[#5F6A61]">{t.preview.meta}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — WHAT WE CHECK (Ruled Ledger Rows) */}
      <section className="w-full border-b border-[#D8D2C4] py-20 bg-[#F5F2EB]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-[#2F5D46] font-semibold block mb-2">
              03 / INTEGRITY ENGINE
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1B221D] mb-3">
              Six uncompromising integrity checks.
            </h2>
            <p className="text-sm font-sans text-[#5F6A61]">
              Every asset is scored against strict hardware thresholds. Missing EXIF or unverified claims are transparently displayed—never swept under the rug.
            </p>
          </div>

          <div className="divide-y divide-[#D8D2C4] border-y border-[#D8D2C4] bg-[#FBF9F4]">
            {CHECKS.map((c) => (
              <div
                key={c.number}
                className="py-5 px-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-[#F5F2EB]/60 transition-colors"
              >
                <div className="md:col-span-1 font-mono text-sm font-semibold text-[#5F6A61]">
                  {c.number}
                </div>
                <div className="md:col-span-4">
                  <div className="font-serif text-lg font-semibold text-[#1B221D]">
                    {c.name}
                  </div>
                  <div className="text-xs font-mono text-[#2F5D46] mt-0.5">
                    {c.threshold}
                  </div>
                </div>
                <div className="md:col-span-5 text-xs font-sans text-[#5F6A61] leading-relaxed">
                  {c.detail}
                </div>
                <div className="md:col-span-2 text-right">
                  <span className="inline-block font-mono text-xs font-semibold px-2 py-1 bg-[#E8EFEA] text-[#2F5D46] border border-[#2F5D46]/30 rounded-[2px]">
                    {c.weight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — BEFORE / AFTER COMPARISON VIEWER */}
      <section className="w-full border-b border-[#D8D2C4] py-20 bg-[#FBF9F4]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#2F5D46] font-semibold block mb-2">
                04 / PROVABLE RESTORATION
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1B221D]">
                Measure real change on the ground.
              </h2>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <VerificationStamp status="verified" score={94} size="md" />
              <AiEstimateTag />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              {selectedPair ? (
                <CompareViewer
                  beforeAsset={selectedPair.before}
                  afterAsset={selectedPair.after}
                  distanceMeters={selectedPair.distanceMeters}
                  daysBetween={selectedPair.daysBetween}
                />
              ) : (
                <div className="aspect-[16/10] border border-[#D8D2C4] bg-[#FBF9F4] flex items-center justify-center p-8 text-center">
                  <div>
                    <p className="font-serif text-xl text-[#1B221D]">
                      No before-and-after pair is available yet.
                    </p>
                    <p className="mt-2 text-xs font-mono text-[#5F6A61]">
                      Upload field records with dates and location data to see a truthful comparison here.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 bg-[#F5F2EB] border border-[#D8D2C4] p-6 rounded-[2px] flex flex-col gap-4">
              <div className="border-b border-[#D8D2C4] pb-3">
                <span className="text-[10px] font-mono text-[#5F6A61] uppercase tracking-wider block">
                  RECORDED PAIR
                </span>
                <p className="text-xs font-sans text-[#1B221D] mt-1 leading-relaxed">
                  {selectedPair
                    ? 'This comparison uses the first pair returned by the project evidence archive. Analysis is shown only after the pair is opened.'
                    : 'No stored pair is available for comparison.'}
                </p>
              </div>

              {selectedPair && (
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center py-1.5 border-b border-[#D8D2C4]/60">
                    <span className="text-[#5F6A61]">DAYS BETWEEN</span>
                    <span className="font-semibold text-[#1B221D]">{selectedPair.daysBetween ?? '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-[#5F6A61]">DISTANCE</span>
                    <span className="font-semibold text-[#1B221D]">
                      {selectedPair.distanceMeters != null ? `${selectedPair.distanceMeters} M` : '—'}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[#D8D2C4]">
                <Link
                  to="/app/compare"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#2F5D46] hover:bg-[#244A38] text-[#FBF9F4] text-xs font-medium py-2.5 rounded-[2px] transition-colors"
                >
                  <span>Open Full Comparison Tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — FINAL MINIMALIST CTA */}
      <section className="w-full py-24 bg-[#F5F2EB] text-center border-b border-[#D8D2C4]">
        <div className="max-w-2xl mx-auto px-4">
          <span className="font-mono text-xs uppercase tracking-widest text-[#5F6A61] mb-3 block">
            PROOFPOINT EVIDENCE LAB
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#1B221D] mb-6 leading-tight">
            Ready to prove the impact of your field work?
          </h2>
          <p className="text-base font-sans text-[#5F6A61] mb-8 leading-relaxed">
            Eliminate grant reporting guesswork. Ensure every environmental dollar is backed by cryptographically auditable ground photography.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-[#2F5D46] hover:bg-[#244A38] text-[#FBF9F4] text-sm font-medium px-8 py-3 rounded-[2px] transition-colors"
            >
              <span>Open the platform</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
