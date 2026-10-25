import React, { useRef, useState } from 'react';
import { VideoMetadata, formatBytes, formatDuration } from '../utils/compressionMath';

interface SampleVideo {
  id: string;
  name: string;
  badge: string;
  originalName: string;
  metadata?: VideoMetadata;
}

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  onSampleSelected: (sampleId: string) => void;
  samples: SampleVideo[];
  isUploading: boolean;
  uploadProgress?: number;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelected,
  onSampleSelected,
  samples,
  isUploading,
  uploadProgress,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|m4v|gif)$/i.test(file.name)) {
        setErrorMsg(null);
        onFileSelected(file);
      } else {
        setErrorMsg('Please upload a video file (.mp4, .webm, .mov, .mkv, .avi, .gif)');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setErrorMsg(null);
      onFileSelected(file);
    }
  };

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return;
    try {
      setIsFetchingUrl(true);
      setErrorMsg(null);
      const res = await fetch(urlInput.trim());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const filename = urlInput.split('/').pop()?.split('?')[0] || 'remote_video.mp4';
      const file = new File([blob], filename, { type: blob.type || 'video/mp4' });
      onFileSelected(file);
    } catch (err: any) {
      setErrorMsg(`Could not download video URL: ${err.message}. Try downloading it or choosing a sample.`);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Drag & Drop Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all bg-gradient-to-b ${
          isDragOver
            ? 'border-emerald-400 bg-emerald-950/20 shadow-2xl shadow-emerald-900/20 scale-[1.005]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mkv,.avi,.mp4,.mov,.webm,.gif"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700/80 border border-slate-700 flex items-center justify-center text-3xl shadow-inner shadow-slate-600/20">
            🎬
          </div>

          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Drag & Drop your video here
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Supports MP4, WebM, MOV, MKV, AVI, GIF up to 500 MB. Zero compression limit.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-6 py-3 text-sm font-bold text-slate-950 bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400 hover:from-rose-300 hover:to-emerald-300 rounded-xl shadow-lg shadow-rose-950/40 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <span>📁</span>
              <span>{isUploading ? 'Uploading Video...' : 'Choose Video File'}</span>
            </button>
          </div>

          {isUploading && (
            <div className="w-full max-w-xs mx-auto space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Uploading...</span>
                <span>{uploadProgress || 60}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-amber-300 transition-all duration-300"
                  style={{ width: `${uploadProgress || 60}%` }}
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-lg p-2.5">
              ⚠️ {errorMsg}
            </p>
          )}
        </div>
      </div>

      {/* Quick Test Samples Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="text-base">🧪</span>
          <span className="font-semibold text-white">Don&apos;t have a video?</span>
          <span className="text-slate-400 hidden sm:inline">Try an instant HD test sample:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {samples.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSampleSelected(sample.id)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 transition-all hover:border-slate-600 flex items-center gap-1.5 cursor-pointer"
            >
              <span>▶️</span>
              <span>{sample.name}</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-1 py-0.5 rounded">
                {sample.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Direct URL input option */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 flex items-center gap-2">
        <span className="text-slate-500 text-sm pl-1">🔗</span>
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste public video URL (.mp4, .webm) to fetch directly..."
          className="bg-transparent flex-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
        />
        <button
          onClick={handleFetchUrl}
          disabled={!urlInput.trim() || isFetchingUrl}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 hover:text-white transition-colors cursor-pointer"
        >
          {isFetchingUrl ? 'Fetching...' : 'Fetch Video'}
        </button>
      </div>
    </div>
  );
};
