import React, { useRef, useState, useEffect } from 'react';
import { VideoMetadata, formatBytes } from '../utils/compressionMath';

interface ComparePlayerProps {
  originalUrl: string;
  compressedUrl: string;
  originalMeta?: VideoMetadata;
  compressedMeta?: VideoMetadata & {
    audioBitDepth?: number;
    audioTierLabel?: string;
    targetWidth?: number;
    targetHeight?: number;
  };
}

export const ComparePlayer: React.FC<ComparePlayerProps> = ({
  originalUrl,
  compressedUrl,
  originalMeta,
  compressedMeta,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const origVideoRef = useRef<HTMLVideoElement>(null);
  const compVideoRef = useRef<HTMLVideoElement>(null);

  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [audioSource, setAudioSource] = useState<'compressed' | 'original'>('compressed');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [pixelatedRendering, setPixelatedRendering] = useState<boolean>(true);

  // Sync playback
  const togglePlay = () => {
    if (!origVideoRef.current || !compVideoRef.current) return;
    if (isPlaying) {
      origVideoRef.current.pause();
      compVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      origVideoRef.current.play().catch(() => {});
      compVideoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Sync seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (origVideoRef.current) origVideoRef.current.currentTime = time;
    if (compVideoRef.current) compVideoRef.current.currentTime = time;
  };

  const handleTimeUpdate = () => {
    if (compVideoRef.current) {
      setCurrentTime(compVideoRef.current.currentTime);
      if (!duration && compVideoRef.current.duration) {
        setDuration(compVideoRef.current.duration);
      }
    }
  };

  // Switch which audio track is active
  useEffect(() => {
    if (origVideoRef.current && compVideoRef.current) {
      if (isMuted) {
        origVideoRef.current.muted = true;
        compVideoRef.current.muted = true;
      } else {
        if (audioSource === 'compressed') {
          compVideoRef.current.muted = false;
          origVideoRef.current.muted = true;
        } else {
          origVideoRef.current.muted = false;
          compVideoRef.current.muted = true;
        }
      }
    }
  }, [audioSource, isMuted]);

  // Drag slider mechanics
  const handleMouseDown = () => setIsDragging(true);
  const handleTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const clampedX = Math.max(0, Math.min(rect.width, x));
      setSliderPos((clampedX / rect.width) * 100);
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX);
    };

    const handleStop = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleStop);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleStop);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleStop);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleStop);
    };
  }, [isDragging]);

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Banner: Resolution & Audio Stats */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">🔬</span>
          <span className="font-bold text-white">Interactive Curtain Inspector</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Drag center handle to compare quality side-by-side</span>
        </div>

        {/* Audio Track Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
          <span className="text-[11px] text-slate-400 px-1.5">Audio:</span>
          <button
            onClick={() => setAudioSource('compressed')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
              audioSource === 'compressed'
                ? 'bg-rose-500 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📉 Crushed / Synced Audio
          </button>
          <button
            onClick={() => setAudioSource('original')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
              audioSource === 'original'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎧 Original Audio
          </button>
        </div>

        {/* Pixel Renderer Toggle */}
        <button
          onClick={() => setPixelatedRendering(!pixelatedRendering)}
          className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1 ${
            pixelatedRendering
              ? 'bg-amber-950/60 border-amber-800/80 text-amber-300 font-bold'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
          title="Toggle crisp pixelated vs smooth bilinear rendering"
        >
          <span>{pixelatedRendering ? '👾 Sharp Pixels' : '🫧 Smooth'}</span>
        </button>
      </div>

      {/* Main Split Player Canvas */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black select-none overflow-hidden group cursor-ew-resize"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Layer 1: Compressed Video (Base Full Canvas) */}
        <video
          ref={compVideoRef}
          src={compressedUrl}
          playsInline
          loop
          onTimeUpdate={handleTimeUpdate}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ imageRendering: pixelatedRendering ? 'pixelated' : 'auto' }}
        />

        {/* Layer 2: Original Video (Clipped by sliderPos) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <video
            ref={origVideoRef}
            src={originalUrl}
            playsInline
            loop
            className="absolute inset-0 w-full h-full object-contain max-w-none"
            style={{
              width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
              height: '100%',
            }}
          />
        </div>

        {/* Divider Curtain Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-20 cursor-ew-resize flex items-center justify-center transform -translate-x-1/2"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="w-8 h-8 rounded-full bg-white text-slate-950 font-bold text-xs flex items-center justify-center shadow-lg border-2 border-slate-900 pointer-events-none">
            ↔
          </div>
        </div>

        {/* Badges on Video */}
        <div className="absolute top-3 left-3 z-30 pointer-events-none bg-black/70 backdrop-blur-md border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-400">
          Original ({originalMeta ? `${originalMeta.width}x${originalMeta.height}` : 'Source'})
        </div>
        <div className="absolute top-3 right-3 z-30 pointer-events-none bg-black/70 backdrop-blur-md border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-400">
          Compressed ({compressedMeta ? `${compressedMeta.targetWidth || compressedMeta.width}x${compressedMeta.targetHeight || compressedMeta.height}` : 'Crushed'})
        </div>
      </div>

      {/* Playback Controls Bar */}
      <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400 hover:from-rose-300 hover:to-emerald-300 text-slate-950 font-bold flex items-center justify-center text-sm shadow-md transition-all cursor-pointer"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <input
            type="range"
            min="0"
            max={duration || 10}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 accent-emerald-400 cursor-pointer"
          />

          <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
            {currentTime.toFixed(1)}s / {(duration || 5).toFixed(1)}s
          </span>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>

        {/* Bottom Metadata Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400">Original Size:</span>{' '}
            <span className="font-mono text-slate-200 font-bold">
              {originalMeta ? formatBytes(originalMeta.sizeBytes) : '—'}
            </span>
          </div>
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400">Compressed Size:</span>{' '}
            <span className="font-mono text-rose-400 font-bold">
              {compressedMeta ? formatBytes(compressedMeta.sizeBytes) : '—'}
            </span>
          </div>
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400">Audio Sample Rate:</span>{' '}
            <span className="font-mono text-amber-300 font-bold">
              {compressedMeta?.audioSampleRate ? `${compressedMeta.audioSampleRate} Hz` : 'Muted'}
            </span>
          </div>
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400">Audio Bit Depth:</span>{' '}
            <span className="font-mono text-emerald-400 font-bold">
              {compressedMeta?.audioBitDepth ? `${compressedMeta.audioBitDepth}-bit` : '16-bit'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
