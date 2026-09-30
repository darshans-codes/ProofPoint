import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useProject } from '../context/ProjectContext';
import { uploadAssets } from '../api/client';
import { UploadCloud, CheckCircle2, Trash2, ArrowRight, AlertCircle } from 'lucide-react';

function LocationPicker({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng);
    },
  });
  return null;
}

const pickerIcon = L.divIcon({
  className: 'proofpoint-picker-marker',
  html: '<div style="width:12px;height:12px;background:#2F5D46;border:2px solid #FBF9F4"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

export default function Upload() {
  const { projects, selectedProjectId, setSelectedProjectId, refreshProjects } = useProject();
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [projectId, setProjectId] = useState(
    selectedProjectId !== 'all' ? selectedProjectId : projects[0]?._id || ''
  );
  const [locationName, setLocationName] = useState('');
  const [capturedDate, setCapturedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const [uploading, setUploading] = useState(false);
  const [fileStates, setFileStates] = useState([]);
  const [createdAssets, setCreatedAssets] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);

  // File selection
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected].slice(0, 15));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []).filter(
      (f) => f.type.startsWith('image/') || f.type === 'video/mp4'
    );
    setFiles((prev) => [...prev, ...dropped].slice(0, 15));
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setErrorMessage('Please select at least one evidence image or video file.');
      return;
    }
    if (!projectId) {
      setErrorMessage('Please assign these assets to a monitoring project.');
      return;
    }
    if (!locationName.trim()) {
      setErrorMessage('Please specify the field location/concession sector.');
      return;
    }

    setErrorMessage('');
    setUploading(true);
    setFileStates(files.map((file) => ({ name: file.name, stage: 'pending', progress: 0 })));
    const created = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const updateState = (patch) => {
          setFileStates((current) =>
            current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
          );
        };
        updateState({ stage: 'uploading' });
        const formData = new FormData();
        formData.append('projectId', projectId);
        formData.append('locationName', locationName.trim());
        formData.append('capturedDate', capturedDate);
        if (lat && lng) {
          formData.append('lat', lat);
          formData.append('lng', lng);
        }
        formData.append('files', file);
        const assets = await uploadAssets(formData, (percent) => updateState({ progress: percent }));
        updateState({ stage: 'metadata' });
        updateState({ stage: 'analyzing' });
        updateState({ stage: 'verifying' });
        updateState({ stage: 'done', progress: 100 });
        created.push(...assets);
      }
      setCreatedAssets(created);
      refreshProjects();
    } catch (err) {
      console.error('[Upload Error]', err);
      setErrorMessage(
        err.response?.data?.error || err.message || 'Evidence intake failed.'
      );
      setUploading(false);
      setFileStates((current) => current.map((item) => (
        item.stage === 'done' ? item : { ...item, stage: 'error' }
      )));
    }
  };

  return (
    <div className="space-y-8 max-w-[1360px] mx-auto">
      {/* Header */}
      <div className="border-b border-[#D8D2C4] pb-6">
        <div className="text-xs font-mono uppercase tracking-widest text-[#2F5D46] mb-1">
          EVIDENCE INTAKE & INGESTION DESK
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1B221D] font-normal tracking-tight">
          Ingest Raw Field Specimen
        </h1>
        <p className="text-sm font-sans text-[#5F6A61] mt-1 max-w-2xl">
          Upload authentic camera or drone sensor recordings. Hardware EXIF data is immediately extracted, verified against claim parameters, and scanned for duplicate image hashes.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 border border-[#A63A2B] bg-[#F3DAD5] text-[#A63A2B] text-xs font-mono rounded-[2px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Progress View on Submission */}
      {uploading ? (
        <div className="border border-[#D8D2C4] bg-[#FBF9F4] p-8 space-y-6">
          <div className="border-b border-[#D8D2C4] pb-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#5F6A61] block">
                PROCESSING INTAKE BATCH
              </span>
              <h2 className="font-serif text-2xl text-[#1B221D] font-semibold mt-1">
                Auditing {files.length} Evidence Records
              </h2>
            </div>
            {fileStates.length > 0 && fileStates.every((item) => item.stage === 'done') ? (
              <span className="font-mono text-xs px-2.5 py-1 bg-[#E4EEE7] text-[#2F6B4A] border border-[#2F6B4A] rounded-[2px] font-semibold">
                AUDIT COMPLETE
              </span>
            ) : (
              <span className="font-mono text-xs px-2.5 py-1 bg-[#F4E9CF] text-[#9A6B12] border border-[#9A6B12] rounded-[2px]">
                INSPECTION IN PROGRESS
              </span>
            )}
          </div>

          <div className="divide-y divide-[#D8D2C4] border border-[#D8D2C4] bg-[#F5F2EB] text-xs font-mono">
            {fileStates.map((item) => (
              <div key={item.name} className="p-4 flex flex-wrap gap-3 items-center justify-between">
                <span className="text-[#1B221D] truncate max-w-full">{item.name}</span>
                <span className={item.stage === 'error' ? 'text-[#A63A2B]' : item.stage === 'done' ? 'text-[#2F6B4A]' : 'text-[#9A6B12]'}>
                  {item.stage === 'uploading' ? `UPLOADING (${item.progress}%)` : item.stage.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          {fileStates.length > 0 && fileStates.every((item) => item.stage === 'done') && (
            <div className="pt-4 flex items-center justify-between">
              <div className="text-xs font-mono text-[#2F6B4A] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{createdAssets.length} evidentiary frames successfully persisted to archive.</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setUploading(false);
                    setFiles([]);
                    setFileStates([]);
                  }}
                  className="px-4 py-2 border border-[#D8D2C4] text-xs font-mono uppercase bg-[#F5F2EB] hover:bg-[#FBF9F4] rounded-[2px]"
                >
                  Intake Another Batch
                </button>
                <Link
                  to="/app/gallery"
                  className="px-5 py-2 bg-[#2F5D46] hover:bg-[#244A38] text-[#FBF9F4] text-xs font-mono uppercase rounded-[2px] inline-flex items-center gap-1.5"
                >
                  <span>View in Gallery</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 7/5 Asymmetric Split */
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Dropzone & Selected Files */}
          <div className="lg:col-span-7 space-y-6">
            {/* Dashed Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#D8D2C4] hover:border-[#1B221D] bg-[#FBF9F4] p-10 text-center rounded-[2px] cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/mp4"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 text-[#5F6A61] mx-auto mb-3" />
              <div className="font-serif text-lg font-semibold text-[#1B221D]">
                Drop raw field photos or videos here
              </div>
              <p className="text-xs font-mono text-[#5F6A61] mt-1">
                Select up to 15 files (JPEG, PNG, HEIC, MP4 • Max 25MB each)
              </p>
              <div className="mt-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#2F5D46] border border-[#2F5D46]/40 px-3 py-1 bg-[#E8EFEA] rounded-[2px]">
                  Browse Local Files
                </span>
              </div>
            </div>

            {/* Selected Files Ruled Table */}
            {files.length > 0 && (
              <div className="border border-[#D8D2C4] bg-[#FBF9F4]">
                <div className="p-3 border-b border-[#D8D2C4] flex items-center justify-between text-xs font-mono text-[#5F6A61]">
                  <span>SELECTED QUEUE ({files.length} FILES)</span>
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="text-[#A63A2B] hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="divide-y divide-[#D8D2C4] max-h-60 overflow-y-auto">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex items-center justify-between text-xs font-mono hover:bg-[#F5F2EB]/50"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[80%]">
                        <span className="text-[#5F6A61] font-medium">{(idx + 1).toString().padStart(2, '0')}.</span>
                        <span className="text-[#1B221D] truncate">{file.name}</span>
                        <span className="text-[#5F6A61] text-[10px]">
                          ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-[#5F6A61] hover:text-[#A63A2B] p-1"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Metadata Specification Form */}
          <div className="lg:col-span-5 border border-[#D8D2C4] bg-[#FBF9F4] p-6 space-y-5 rounded-[2px]">
            <div className="border-b border-[#D8D2C4] pb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F6A61] block">
                METADATA & OBSERVATION SPECIFICATION
              </span>
              <h3 className="font-serif text-lg font-semibold text-[#1B221D]">
                Field Claim Parameters
              </h3>
            </div>

            {/* Project Select */}
            <div className="space-y-1">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#1B221D]">
                Project Concession *
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                className="w-full bg-[#F5F2EB] border border-[#D8D2C4] text-[#1B221D] text-xs font-mono p-2.5 rounded-[2px] focus:outline-none focus:border-[#2F5D46]"
              >
                <option value="">Select project boundary...</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Location Name */}
            <div className="space-y-1">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#1B221D]">
                Field Sector / Observation Point *
              </label>
              <input
                type="text"
                placeholder="e.g. Sector 4B, Acre River Mile 14"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                required
                className="w-full bg-[#F5F2EB] border border-[#D8D2C4] text-[#1B221D] text-xs font-mono p-2.5 rounded-[2px] focus:outline-none focus:border-[#2F5D46]"
              />
            </div>

            {/* Capture Date */}
            <div className="space-y-1">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#1B221D]">
                Claimed Date of Capture *
              </label>
              <input
                type="date"
                value={capturedDate}
                onChange={(e) => setCapturedDate(e.target.value)}
                required
                className="w-full bg-[#F5F2EB] border border-[#D8D2C4] text-[#1B221D] text-xs font-mono p-2.5 rounded-[2px] focus:outline-none focus:border-[#2F5D46]"
              />
              <span className="text-[10px] font-mono text-[#5F6A61] block">
                Verification checks this against the internal camera timestamp (+/- 48 hrs).
              </span>
            </div>

            {/* Optional Coordinates */}
            <div className="space-y-2 pt-2 border-t border-[#D8D2C4]/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-[#1B221D]">
                  Claimed Coordinates (Optional)
                </label>
                <span className="text-[10px] font-mono text-[#5F6A61]">WGS84</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude (e.g. -9.9749)"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full bg-[#F5F2EB] border border-[#D8D2C4] text-[#1B221D] text-xs font-mono p-2 rounded-[2px]"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude (e.g. -67.8243)"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full bg-[#F5F2EB] border border-[#D8D2C4] text-[#1B221D] text-xs font-mono p-2 rounded-[2px]"
                />
              </div>
              <div className="h-40 border border-[#D8D2C4] overflow-hidden">
                <MapContainer
                  center={[Number(lat) || 0, Number(lng) || 0]}
                  zoom={Number(lat) && Number(lng) ? 12 : 2}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  />
                  <LocationPicker onPick={({ lat: nextLat, lng: nextLng }) => {
                    setLat(nextLat.toFixed(5));
                    setLng(nextLng.toFixed(5));
                  }} />
                  {lat && lng && <Marker position={[Number(lat), Number(lng)]} icon={pickerIcon} />}
                </MapContainer>
              </div>
              <span className="text-[10px] font-mono text-[#5F6A61] block">
                Click the map to set the claimed point. EXIF coordinates remain the source of verification.
              </span>
            </div>

            <div className="pt-4 border-t border-[#D8D2C4]">
              <button
                type="submit"
                disabled={files.length === 0}
                className="w-full bg-[#2F5D46] hover:bg-[#244A38] disabled:opacity-50 text-[#FBF9F4] text-xs font-mono uppercase tracking-wider py-3 rounded-[2px] transition-colors cursor-pointer"
              >
                Run Ingestion & Verification ({files.length} Files)
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
