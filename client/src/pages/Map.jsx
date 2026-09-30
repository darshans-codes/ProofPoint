import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getAllAssets } from '../api/client';
import { useProject } from '../context/ProjectContext';
import VerificationStamp from '../components/VerificationStamp';
import { Play, Pause, RotateCcw, Calendar, Layers, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

// Custom square status markers
function createSquareIcon(status = 'verified') {
  let color = '#2F6B4A';
  if (status === 'needs_review') color = '#9A6B12';
  if (status === 'flagged') color = '#A63A2B';

  return L.divIcon({
    className: 'custom-square-marker',
    html: `<div style="
      width: 14px;
      height: 14px;
      background-color: ${color};
      border: 1.5px solid #F5F2EB;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      cursor: pointer;
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function MapPage() {
  const { selectedProjectId } = useProject();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Timeline scrubber state
  const [sliderIndex, setSliderIndex] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef(null);

  useEffect(() => {
    async function loadMapAssets() {
      setLoading(true);
      setErrorMessage('');
      try {
        const params = {};
        if (selectedProjectId !== 'all') params.projectId = selectedProjectId;
        const allAssets = await getAllAssets(params);

        // Filter for assets with valid GPS
        const geoAssets = allAssets.filter(
          (a) =>
            (a.exif?.hasGps && typeof a.exif.lat === 'number') ||
            (a.claimedGeo && typeof a.claimedGeo.lat === 'number')
        );

        // Sort chronologically
        geoAssets.sort(
          (a, b) => new Date(a.capturedDate).getTime() - new Date(b.capturedDate).getTime()
        );

        setAssets(geoAssets);
      } catch (err) {
        console.error('[Map Error]', err);
        setErrorMessage(err.response?.data?.error || 'Map records could not be loaded.');
      } finally {
        setLoading(false);
      }
    }

    loadMapAssets();
  }, [selectedProjectId]);

  // Timeline playback
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setSliderIndex((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 5;
        });
      }, 500);
    } else {
      clearInterval(playIntervalRef.current);
    }
    return () => clearInterval(playIntervalRef.current);
  }, [isPlaying]);

  // Visible assets based on timeline slider percentage (0 to 100)
  const visibleAssets = useMemo(() => {
    if (assets.length === 0) return [];
    const count = Math.max(1, Math.ceil((sliderIndex / 100) * assets.length));
    return assets.slice(0, count);
  }, [assets, sliderIndex]);

  // Center coordinate
  const defaultCenter = useMemo(() => {
    if (visibleAssets.length > 0) {
      const first = visibleAssets[0];
      const lat = first.exif?.lat ?? first.claimedGeo?.lat ?? -9.9749;
      const lng = first.exif?.lng ?? first.claimedGeo?.lng ?? -67.8243;
      return [lat, lng];
    }
    return [-9.9749, -67.8243]; // Default Acre Basin
  }, [visibleAssets]);

  const currentDateLabel =
    visibleAssets.length > 0
      ? new Date(visibleAssets[visibleAssets.length - 1].capturedDate)
          .toISOString()
          .split('T')[0]
      : 'ALL';

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#D8D2C4] pb-4 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#2F5D46] block mb-1">
            SPATIAL EVIDENCE DISTRIBUTION
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1B221D] font-normal tracking-tight">
            Geographic Monitoring Map
          </h1>
          <p className="text-sm font-sans text-[#5F6A61] mt-1">
            Pins plotted from raw camera sensor GPS. Use the timeline slider to scrub through project restoration history.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#2F6B4A]" />
            <span>VERIFIED</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#9A6B12]" />
            <span>NEEDS REVIEW</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#A63A2B]" />
            <span>FLAGGED</span>
          </span>
        </div>
      </div>

      {/* Map & Timeline Container */}
      <div className="border border-[#D8D2C4] bg-[#FBF9F4] rounded-[2px] overflow-hidden">
        {/* Leaflet Map */}
        <div className="h-[520px] w-full bg-[#E5E0D8] relative">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center font-mono text-xs text-[#5F6A61]">
              LOADING CARTOGRAPHIC TILES...
            </div>
          ) : errorMessage ? (
            <div className="h-full w-full flex items-center justify-center p-8 text-center font-mono text-xs text-[#A63A2B]">
              {errorMessage}
            </div>
          ) : assets.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center p-8 text-center">
              <div>
                <p className="font-serif text-xl text-[#1B221D]">No frames with location data.</p>
                <p className="mt-2 text-xs font-mono text-[#5F6A61]">The map will populate when EXIF or claimed coordinates are present.</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={defaultCenter}
              zoom={11}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              {/* CartoDB Positron (light tiles) */}
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />

              {visibleAssets.map((asset) => {
                const lat = asset.exif?.lat ?? asset.claimedGeo?.lat;
                const lng = asset.exif?.lng ?? asset.claimedGeo?.lng;
                if (lat == null || lng == null) return null;

                const icon = createSquareIcon(asset.verification?.status);
                const frameId = `PP-${asset._id.slice(-4).toUpperCase()}`;
                const thumb = asset.transformations?.thumb || asset.cloudinary?.secureUrl;

                return (
                  <Marker key={asset._id} position={[lat, lng]} icon={icon}>
                    <Popup className="proofpoint-popup">
                      <div className="w-56 p-1 space-y-2 text-left font-sans">
                        <img
                          src={thumb}
                          alt="Thumbnail"
                          className="w-full h-28 object-cover border border-[#D8D2C4] rounded-[1px]"
                        />
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="font-bold text-[#1B221D]">{frameId}</span>
                          <span className="text-[#5F6A61]">
                            {new Date(asset.capturedDate).toISOString().split('T')[0]}
                          </span>
                        </div>
                        <p className="text-xs text-[#1B221D] line-clamp-2 leading-tight">
                          {asset.ai?.caption || asset.locationName}
                        </p>
                        <div className="pt-1 flex items-center justify-between border-t border-[#D8D2C4]">
                          <VerificationStamp
                            status={asset.verification?.status}
                            score={asset.verification?.score}
                            size="sm"
                          />
                          <Link
                            to={`/app/assets/${asset._id}`}
                            className="text-[10px] font-mono text-[#2F5D46] hover:underline"
                          >
                            Details →
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Timeline Scrubber Bar Under Map */}
        <div className="p-4 border-t border-[#D8D2C4] bg-[#F5F2EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 border border-[#D8D2C4] bg-[#FBF9F4] hover:bg-[#E8E4DA] rounded-[2px] text-[#1B221D] cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play Timeline'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setSliderIndex(100)}
              className="p-2 border border-[#D8D2C4] bg-[#FBF9F4] hover:bg-[#E8E4DA] rounded-[2px] text-[#5F6A61] hover:text-[#1B221D] cursor-pointer"
              title="Reset to latest"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] text-[#5F6A61] uppercase">CHRONOLOGICAL HORIZON</span>
              <span className="font-semibold text-[#1B221D]">{currentDateLabel}</span>
            </div>
          </div>

          {/* Timeline Range Slider */}
          <div className="flex-1 w-full max-w-lg flex items-center gap-3">
            <span className="text-[10px] text-[#5F6A61]">BASELINE</span>
            <input
              type="range"
              min="10"
              max="100"
              value={sliderIndex}
              onChange={(e) => {
                setSliderIndex(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full accent-[#2F5D46] cursor-pointer"
            />
            <span className="text-[10px] text-[#5F6A61]">LATEST</span>
          </div>

          <div className="text-right text-[#5F6A61]">
            <span className="font-bold text-[#1B221D]">{visibleAssets.length}</span> OF{' '}
            <span>{assets.length}</span> FRAMES VISIBLE
          </div>
        </div>
      </div>

      {/* Ruled List of Visible Frames */}
      <div className="border border-[#D8D2C4] bg-[#FBF9F4] p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#D8D2C4] pb-2 text-xs font-mono">
          <span className="uppercase text-[#1B221D] font-semibold">
            Visible Evidence Frames along Timeline ({visibleAssets.length})
          </span>
          <span className="text-[#5F6A61]">SORTED CHRONOLOGICALLY</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {visibleAssets.slice(0, 12).map((a) => (
            <Link
              key={a._id}
              to={`/app/assets/${a._id}`}
              className="group block border border-[#D8D2C4] bg-[#F5F2EB] p-1.5 rounded-[1px] hover:border-[#1B221D] transition-colors"
            >
              <img
                src={a.transformations?.thumb || a.cloudinary?.secureUrl}
                alt="thumb"
                className="w-full aspect-[4/3] object-cover mb-1"
              />
              <div className="text-[10px] font-mono flex items-center justify-between">
                <span className="font-semibold text-[#1B221D]">PP-{a._id.slice(-4).toUpperCase()}</span>
                <span className="text-[#5F6A61]">
                  {new Date(a.capturedDate).toISOString().split('T')[0].slice(5)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
