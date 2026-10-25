import React, { useState } from 'react';
import { VideoMetadata, formatBytes } from '../utils/compressionMath';

interface StatsCardProps {
  originalMeta: VideoMetadata;
  compressedMeta: VideoMetadata & {
    audioBitDepth?: number;
    audioTierLabel?: string;
    targetWidth?: number;
    targetHeight?: number;
    memeAudioMode?: string;
    audioOverdriveDb?: number;
  };
  savings: { bytesSaved: number; percentSaved: number };
  downloadUrl: string;
  onCompressAgain: () => void;
  onReset: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  originalMeta,
  compressedMeta,
  savings,
  downloadUrl,
  onCompressAgain,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const finalW = compressedMeta.targetWidth || compressedMeta.width;
  const finalH = compressedMeta.targetHeight || compressedMeta.height;
  const totalPixels = finalW * finalH;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const videoBlob = new Blob([blob], { type: 'video/mp4' });
      const blobUrl = window.URL.createObjectURL(videoBlob);

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      const filename = `compresss_dead_${Date.now()}_${finalW}x${finalH}.mp4`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 2000);
    } catch (e) {
      console.warn('Blob download fallback:', e);
      window.location.href = downloadUrl;
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.origin + downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Top Banner with Big Savings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
            Compression Accomplished
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2">
            <span>🎉</span>
            <span>Saved {savings.percentSaved}% of File Size</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Reduced from {formatBytes(originalMeta.sizeBytes)} down to {formatBytes(compressedMeta.sizeBytes)} ({formatBytes(savings.bytesSaved)} shaved off).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 hover:from-emerald-300 hover:to-amber-200 rounded-xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{isDownloading ? '⏳' : '⬇️'}</span>
            <span>{isDownloading ? 'Downloading MP4...' : 'Download Video (MP4)'}</span>
          </button>
          <button
            onClick={handleCopy}
            className="px-3.5 py-2.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>{copied ? '✓' : '🔗'}</span>
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Visual Resolution */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-1">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Visual Resolution</span>
            <span className="text-emerald-400 font-mono text-[10px]">
              {finalW < originalMeta.width ? 'Downscaled' : 'Preserved'}
            </span>
          </div>
          <div className="text-base font-bold text-white font-mono flex items-center gap-2">
            <span className="text-slate-400 line-through text-xs font-normal">
              {originalMeta.width}x{originalMeta.height}
            </span>
            <span>→</span>
            <span className="text-emerald-300">
              {finalW}x{finalH}
            </span>
          </div>
          <div className="text-[10px] text-slate-500">
            Total pixels: {totalPixels < 1000 ? `${totalPixels} px` : `${(totalPixels / 1000).toFixed(1)}k px`}
          </div>
        </div>

        {/* Metric 2: Audio Resolution & Bitcrush */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-1">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Audio Resolution</span>
            <span className="text-rose-400 font-mono text-[10px]">
              {compressedMeta.audioBitDepth ? `${compressedMeta.audioBitDepth}-bit Depth` : '16-bit'}
            </span>
          </div>
          <div className="text-base font-bold text-white font-mono flex items-center gap-2">
            <span className="text-slate-400 line-through text-xs font-normal">
              {originalMeta.audioSampleRate || 44100} Hz
            </span>
            <span>→</span>
            <span className="text-rose-300">
              {compressedMeta.audioSampleRate || 'Muted'} Hz
            </span>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span className="truncate">{compressedMeta.audioTierLabel || 'Synced Harmonic Audio'}</span>
            {compressedMeta.audioOverdriveDb ? (
              <span className="ml-1 text-[9px] font-mono px-1 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-bold shrink-0">
                +{compressedMeta.audioOverdriveDb}dB Drive
              </span>
            ) : null}
          </div>
        </div>

        {/* Metric 3: Video Bitrate */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-1">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Video Bitrate</span>
            <span className="text-amber-400 font-mono text-[10px]">
              {compressedMeta.bitrateKbps < originalMeta.bitrateKbps ? 'Crushed' : 'Optimized'}
            </span>
          </div>
          <div className="text-base font-bold text-white font-mono flex items-center gap-2">
            <span className="text-slate-400 line-through text-xs font-normal">
              {originalMeta.bitrateKbps} kbps
            </span>
            <span>→</span>
            <span className="text-amber-300 font-bold">
              {compressedMeta.bitrateKbps} kbps
            </span>
          </div>
          <div className="text-[10px] text-slate-500">
            Target fps: {compressedMeta.fps} fps
          </div>
        </div>
      </div>

      {/* Next Step Bar */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <button
          onClick={onCompressAgain}
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-rose-500/40 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>☠️</span>
          <span>Compress Again (Next Generation Death)</span>
        </button>

        <button
          onClick={onReset}
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer text-center"
        >
          Upload Another Video
        </button>
      </div>
    </div>
  );
};
