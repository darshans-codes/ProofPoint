import React from 'react';
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
  ReactCompareSliderHandle,
} from 'react-compare-slider';
import { getEvidenceImageUrl } from '../lib/media';

export default function CompareViewer({
  beforeAsset,
  afterAsset,
  distanceMeters,
  daysBetween,
}) {
  if (!beforeAsset || !afterAsset) {
    return (
      <div className="w-full aspect-[16/10] bg-[#FBF9F4] border border-[#D8D2C4] flex items-center justify-center text-sm font-mono text-[#5F6A61]">
        Select or supply two assets to initialize comparative analysis.
      </div>
    );
  }

  const beforeUrl = getEvidenceImageUrl(beforeAsset, 'medium');
  const afterUrl = getEvidenceImageUrl(afterAsset, 'medium');

  if (!beforeUrl || !afterUrl) {
    return (
      <div className="w-full aspect-[16/10] bg-[#FBF9F4] border border-[#D8D2C4] flex items-center justify-center p-6 text-center text-sm font-mono text-[#5F6A61]">
        Evidence image unavailable
      </div>
    );
  }

  const beforeDate = beforeAsset.capturedDate
    ? new Date(beforeAsset.capturedDate).toISOString().split('T')[0]
    : 'BASELINE';

  const afterDate = afterAsset.capturedDate
    ? new Date(afterAsset.capturedDate).toISOString().split('T')[0]
    : 'FOLLOW-UP';

  return (
    <div className="relative w-full border border-[#D8D2C4] bg-[#1B221D] overflow-hidden select-none">
      <ReactCompareSlider
        itemOne={
          <ReactCompareSliderImage
            src={beforeUrl}
            alt="Baseline observation"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        }
        itemTwo={
          <ReactCompareSliderImage
            src={afterUrl}
            alt="Follow-up observation"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        }
        handle={
          <ReactCompareSliderHandle
            buttonStyle={{
              backdropFilter: 'none',
              background: '#F5F2EB',
              border: '1px solid #1B221D',
              color: '#1B221D',
              boxShadow: 'none',
              width: 32,
              height: 32,
            }}
            linesStyle={{
              color: '#F5F2EB',
              width: 2,
            }}
          />
        }
        className="w-full aspect-[16/10] max-h-[600px]"
      />

      {/* Before Tag (Top Left) */}
      <div className="absolute top-4 left-4 bg-[#1B221D] text-[#F5F2EB] text-[11px] font-mono uppercase px-2.5 py-1 rounded-[2px] border border-[#D8D2C4]/30 pointer-events-none">
        <span>BEFORE / {beforeDate}</span>
      </div>

      {/* After Tag (Top Right) */}
      <div className="absolute top-4 right-4 bg-[#2F5D46] text-[#F5F2EB] text-[11px] font-mono uppercase px-2.5 py-1 rounded-[2px] border border-[#D8D2C4]/30 pointer-events-none">
        <span>AFTER / {afterDate}</span>
      </div>

      {/* Meta strip (Bottom Center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1B221D] text-[#D8D2C4] text-[10px] font-mono px-3 py-1 rounded-[2px] border border-[#D8D2C4]/20 flex items-center gap-3 pointer-events-none">
        {daysBetween !== undefined && (
          <span>{daysBetween} DAYS APART</span>
        )}
        {distanceMeters !== undefined && distanceMeters > 0 && (
          <>
            <span>•</span>
            <span>{distanceMeters}M SEPARATION</span>
          </>
        )}
        <span>•</span>
        <span className="text-[#34D399]">VERIFIED PAIR</span>
      </div>
    </div>
  );
}
