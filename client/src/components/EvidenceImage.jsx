import React, { useState } from 'react';
import { getEvidenceImageUrl } from '../lib/media';

export default function EvidenceImage({ asset, variant = 'thumb', alt = '', className = '', loading }) {
  const [failed, setFailed] = useState(false);
  const src = getEvidenceImageUrl(asset, variant);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[#E8E4DA] text-center text-[10px] font-mono uppercase tracking-wider text-[#5F6A61] ${className}`}
        role="img"
        aria-label={`${alt || 'Evidence image'} unavailable`}
      >
        Image unavailable
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
