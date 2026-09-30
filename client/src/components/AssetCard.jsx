import React from 'react';
import { Link } from 'react-router-dom';
import VerificationStamp from './VerificationStamp';

export default function AssetCard({
  asset,
  onClick,
  selectable = false,
  selected = false,
  onToggleSelect,
}) {
  if (!asset) return null;

  const frameId = `PP-${(asset._id || '').slice(-4).toUpperCase()}`;
  const imageUrl =
    asset.transformations?.thumb ||
    asset.cloudinary?.secureUrl ||
    asset.cloudinary?.url ||
    '/placeholder.jpg';

  const dateStr = asset.capturedDate
    ? new Date(asset.capturedDate).toISOString().split('T')[0]
    : 'Unknown Date';

  const cardContent = (
    <div
      className={`group relative flex flex-col bg-[#FBF9F4] border transition-all duration-200 ${
        selected
          ? 'border-[#2F5D46] ring-1 ring-[#2F5D46]'
          : 'border-[#D8D2C4] hover:border-[#1B221D]'
      }`}
    >
      {/* Photo Frame */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E8E4DA]">
        <img
          src={imageUrl}
          alt={asset.ai?.caption || `${asset.projectName || 'Field'} evidence photo`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
        />

        {/* Kind badge if video */}
        {asset.kind === 'video' && (
          <div className="absolute top-2 left-2 bg-[#1B221D] text-[#F5F2EB] text-[10px] font-mono px-1.5 py-0.5 rounded-[2px]">
            VIDEO
          </div>
        )}

        {/* Selection Checkbox */}
        {selectable && (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSelect && onToggleSelect(asset._id);
            }}
            className="absolute top-2 right-2 w-5 h-5 rounded-[2px] border border-[#D8D2C4] bg-[#FBF9F4] flex items-center justify-center cursor-pointer hover:border-[#2F5D46]"
          >
            {selected && <div className="w-3 h-3 bg-[#2F5D46] rounded-[1px]" />}
          </div>
        )}
      </div>

      {/* Metadata strip */}
      <div className="p-3 flex flex-col gap-1.5 border-t border-[#D8D2C4]">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#5F6A61]">
          <span className="font-semibold text-[#1B221D]">{frameId}</span>
          <span>{dateStr}</span>
        </div>

        {/* Caption */}
        <p className="text-[13px] text-[#1B221D] line-clamp-2 leading-snug font-sans">
          {asset.ai?.caption || `${asset.locationName || 'Field site observation'}`}
        </p>

        {/* Bottom strip: Location & Verification Stamp */}
        <div className="pt-1 mt-auto flex items-center justify-between gap-2 border-t border-[#D8D2C4]/50">
          <span
            className="text-[11px] font-mono text-[#5F6A61] truncate max-w-[130px]"
            title={asset.locationName}
          >
            {asset.locationName}
          </span>
          <VerificationStamp
            status={asset.verification?.status}
            score={asset.verification?.score}
            size="sm"
          />
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className="cursor-pointer">
        {cardContent}
      </div>
    );
  }

  return (
    <Link to={`/app/assets/${asset._id}`} className="block">
      {cardContent}
    </Link>
  );
}
