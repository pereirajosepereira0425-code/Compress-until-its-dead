import React from 'react';
import {
  CompressionSettings,
  VideoMetadata,
  getSyncedAudioResolution,
  calculateDimensionsFromPixelCount,
  calculateDimensionsFromBlockSize,
  applyMemeAudioPreset,
  getMemeAudioDescription,
} from '../utils/compressionMath';

interface CustomInputsWorkbenchProps {
  settings: CompressionSettings;
  onChangeSettings: (newSettings: CompressionSettings) => void;
  metadata: VideoMetadata;
}

export const CustomInputsWorkbench: React.FC<CustomInputsWorkbenchProps> = ({
  settings,
  onChangeSettings,
  metadata,
}) => {
  const origW = metadata.width || 1280;
  const origH = metadata.height || 720;
  const currentW = settings.customWidth ?? origW;
  const currentH = settings.customHeight ?? origH;

  const handleWidthChange = (val: number) => {
    const newW = Math.max(1, val);
    let newH = currentH;
    if (settings.maintainAspectRatio) {
      const aspect = origW / origH;
      newH = Math.max(1, Math.round(newW / aspect));
    }
    onChangeSettings({
      ...settings,
      resolutionMode: 'custom',
      customWidth: newW,
      customHeight: newH,
    });
  };

  const handleHeightChange = (val: number) => {
    const newH = Math.max(1, val);
    let newW = currentW;
    if (settings.maintainAspectRatio) {
      const aspect = origW / origH;
      newW = Math.max(1, Math.round(newH * aspect));
    }

    // If audio sync is active, also sync audio to the new typed height!
    let updatedSettings: CompressionSettings = {
      ...settings,
      resolutionMode: 'custom',
      customWidth: newW,
      customHeight: newH,
    };

    if (settings.syncAudioResolution) {
      const synced = getSyncedAudioResolution(newH);
      updatedSettings.audioSampleRate = synced.sampleRate;
      updatedSettings.audioBitrateKbps = synced.bitrateKbps;
      if (newH <= 1) (updatedSettings as any).audioBitDepth = 1;
      else if (newH <= 24) (updatedSettings as any).audioBitDepth = 2;
      else if (newH <= 48) (updatedSettings as any).audioBitDepth = 4;
      else if (newH <= 144) (updatedSettings as any).audioBitDepth = 8;
      else (updatedSettings as any).audioBitDepth = 16;
    }

    onChangeSettings(updatedSettings);
  };

  const handleTotalPixelsChange = (pixels: number) => {
    const safePixels = Math.max(1, pixels);
    const { width, height } = calculateDimensionsFromPixelCount(origW, origH, safePixels);
    let updatedSettings: CompressionSettings = {
      ...settings,
      resolutionMode: 'pixel_count',
      totalPixels: safePixels,
      customWidth: width,
      customHeight: height,
    };

    if (settings.syncAudioResolution) {
      const synced = getSyncedAudioResolution(height);
      updatedSettings.audioSampleRate = synced.sampleRate;
      updatedSettings.audioBitrateKbps = synced.bitrateKbps;
      if (height <= 1) (updatedSettings as any).audioBitDepth = 1;
      else if (height <= 24) (updatedSettings as any).audioBitDepth = 2;
      else if (height <= 48) (updatedSettings as any).audioBitDepth = 4;
      else if (height <= 144) (updatedSettings as any).audioBitDepth = 8;
      else (updatedSettings as any).audioBitDepth = 16;
    }

    onChangeSettings(updatedSettings);
  };

  const handlePixelBlockSizeChange = (blockSize: number) => {
    const safeBlock = Math.max(1, blockSize);
    const { width, height } = calculateDimensionsFromBlockSize(origW, origH, safeBlock);
    let updatedSettings: CompressionSettings = {
      ...settings,
      resolutionMode: 'pixel_count',
      pixelBlockSize: safeBlock,
      totalPixels: width * height,
      customWidth: width,
      customHeight: height,
    };

    if (settings.syncAudioResolution) {
      const synced = getSyncedAudioResolution(height);
      updatedSettings.audioSampleRate = synced.sampleRate;
      updatedSettings.audioBitrateKbps = synced.bitrateKbps;
      if (height <= 1) (updatedSettings as any).audioBitDepth = 1;
      else if (height <= 24) (updatedSettings as any).audioBitDepth = 2;
      else if (height <= 48) (updatedSettings as any).audioBitDepth = 4;
      else if (height <= 144) (updatedSettings as any).audioBitDepth = 8;
      else (updatedSettings as any).audioBitDepth = 16;
    }

    onChangeSettings(updatedSettings);
  };

  const handleAudioSampleRateChange = (hz: number) => {
    onChangeSettings({
      ...settings,
      syncAudioResolution: false,
      audioMode: 'custom',
      audioSampleRate: Math.max(1, hz),
    });
  };

  const handleAudioBitDepthChange = (bits: number) => {
    onChangeSettings({
      ...settings,
      syncAudioResolution: false,
      audioMode: 'custom',
      audioBitDepth: Math.max(1, Math.min(16, bits)),
    } as any);
  };

  const handleAudioBitrateChange = (kbps: number) => {
    onChangeSettings({
      ...settings,
      syncAudioResolution: false,
      audioMode: 'custom',
      audioBitrateKbps: Math.max(1, kbps),
    });
  };

  const handleFpsChange = (fps: number) => {
    onChangeSettings({
      ...settings,
      fpsMode: 'custom',
      fps: Math.max(0.5, fps),
    });
  };

  const handleVideoBitrateChange = (kbps: number) => {
    onChangeSettings({
      ...settings,
      mode: 'bitrate',
      videoBitrateKbps: Math.max(1, kbps),
    });
  };

  const handleCrfChange = (crf: number) => {
    onChangeSettings({
      ...settings,
      mode: 'crf',
      crf: Math.max(0, Math.min(63, crf)),
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* FreeConvert Distinction: Quality vs Resolution Focus Selector */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <h4 className="text-sm font-bold text-white">
                What do you want to change? (Quality vs. Resolution)
              </h4>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              <strong className="text-emerald-300">Resolution</strong> is the pixel canvas size (Width × Height). <strong className="text-amber-300">Quality</strong> is the bitrate and compression packed into each pixel.
            </p>
          </div>
        </div>

        {/* 3 Focus Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() =>
              onChangeSettings({
                ...settings,
                compressionFocus: 'quality_only',
              })
            }
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              settings.compressionFocus === 'quality_only'
                ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>💎</span>
                <span>Change Quality Only</span>
              </span>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded">
                Keep {origW}x{origH}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Preserves 100% full original resolution. Compresses only the bitrate, CRF, and file size.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              onChangeSettings({
                ...settings,
                compressionFocus: 'resolution_only',
              })
            }
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              settings.compressionFocus === 'resolution_only'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>📐</span>
                <span>Change Resolution Only</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded">
                Resize Pixels
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Changes only width &amp; height dimensions. Preserves crisp high encoding quality (CRF 18).
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              onChangeSettings({
                ...settings,
                compressionFocus: 'both',
              })
            }
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              settings.compressionFocus === 'both'
                ? 'bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500/50'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>☠️</span>
                <span>Change Both (Dual Crunch)</span>
              </span>
              <span className="text-[10px] font-mono text-rose-300 bg-rose-950/80 px-1.5 py-0.5 rounded">
                Zero Limits
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Change both resolution and quality down to any amount at the same time.
            </p>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="text-base">⌨️</span>
          <h3 className="text-sm font-bold text-white">
            Custom Limitless Parameters
          </h3>
          <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded font-mono">
            Direct Numeric Input
          </span>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Type any custom number below original — zero limits!
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CARD 1: VIDEO RESOLUTION (WIDTH & HEIGHT) */}
        <div className={`border rounded-xl p-4 space-y-3 shadow-md transition-all ${
          settings.compressionFocus === 'quality_only'
            ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>📐</span>
              <span>Dimensions &amp; Resolution</span>
            </span>
            {settings.compressionFocus === 'quality_only' ? (
              <span className="text-[10px] text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
                Preserving Original {origW}x{origH}
              </span>
            ) : (
              <button
                onClick={() =>
                  onChangeSettings({
                    ...settings,
                    maintainAspectRatio: !settings.maintainAspectRatio,
                  })
                }
                className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                  settings.maintainAspectRatio
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Lock or unlock aspect ratio"
              >
                <span>{settings.maintainAspectRatio ? '🔒 Locked' : '🔓 Unlocked'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Width Input */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <label className="text-slate-400 font-medium">Width (px)</label>
                <span className="text-slate-500 font-mono">Orig: {origW}</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={origW * 2}
                  disabled={settings.compressionFocus === 'quality_only'}
                  value={settings.compressionFocus === 'quality_only' ? origW : currentW}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono font-bold focus:border-emerald-500 focus:outline-none disabled:opacity-40"
                />
                <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 pointer-events-none">
                  px
                </span>
              </div>
            </div>

            {/* Height Input */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <label className="text-slate-400 font-medium">Height (px)</label>
                <span className="text-slate-500 font-mono">Orig: {origH}</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={origH * 2}
                  disabled={settings.compressionFocus === 'quality_only'}
                  value={settings.compressionFocus === 'quality_only' ? origH : currentH}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono font-bold focus:border-emerald-500 focus:outline-none disabled:opacity-40"
                />
                <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 pointer-events-none">
                  px
                </span>
              </div>
            </div>
          </div>

          {/* Quick scale helper shortcuts */}
          {settings.compressionFocus !== 'quality_only' && (
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>Quick:</span>
              <div className="flex flex-wrap gap-1 font-mono">
                {[
                  { label: '50%', w: Math.round(origW * 0.5), h: Math.round(origH * 0.5) },
                  { label: '25%', w: Math.round(origW * 0.25), h: Math.round(origH * 0.25) },
                  { label: '144p', w: 256, h: 144 },
                  { label: '32p ☠️', w: 32, h: 32 },
                  { label: '1x1 💀', w: 1, h: 1 },
                ].map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => {
                      let updated: CompressionSettings = {
                        ...settings,
                        resolutionMode: 'custom',
                        customWidth: q.w,
                        customHeight: q.h,
                        totalPixels: q.w * q.h,
                      };
                      if (settings.syncAudioResolution) {
                        const synced = getSyncedAudioResolution(q.h);
                        updated.audioSampleRate = synced.sampleRate;
                        updated.audioBitrateKbps = synced.bitrateKbps;
                        if (q.h <= 1) (updated as any).audioBitDepth = 1;
                        else if (q.h <= 24) (updated as any).audioBitDepth = 2;
                        else if (q.h <= 48) (updated as any).audioBitDepth = 4;
                        else if (q.h <= 144) (updated as any).audioBitDepth = 8;
                        else (updated as any).audioBitDepth = 16;
                      }
                      onChangeSettings(updated);
                    }}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Direct Total Pixels Input (User feature: match Darwin/Gumball meme video) */}
          {settings.compressionFocus !== 'quality_only' && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                  <span>✨</span>
                  <span>Total Video Pixels</span>
                </label>
                <span className="text-[10px] font-mono text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  {(currentW * currentH).toLocaleString()} px
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={origW * origH}
                  step="1"
                  placeholder="e.g. 2304 for Gumball meme or 1 for single pixel"
                  value={settings.totalPixels || (currentW * currentH)}
                  onChange={(e) => handleTotalPixelsChange(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-amber-500/50 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:outline-none"
                />
                <span className="absolute right-2.5 top-1.5 text-[10px] text-amber-400/70 pointer-events-none">
                  total px
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Type any number down to <strong className="text-amber-200">1</strong>! e.g. <strong className="text-amber-200">2304</strong> for the Darwin shooting star meme, or <strong className="text-rose-300">1</strong> for a single pixel.
              </p>

              {/* Quick Pixel Count Buttons */}
              <div className="flex flex-wrap gap-1 font-mono text-[10px] pt-0.5">
                {[
                  { label: '💫 Gumball (2,304)', val: 2304 },
                  { label: '👾 1,000 px', val: 1000 },
                  { label: '💀 500 px', val: 500 },
                  { label: '256 px', val: 256 },
                  { label: '💀 1 px (Single Pixel)', val: 1 },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleTotalPixelsChange(p.val)}
                    className="px-1.5 py-0.5 rounded bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-200 cursor-pointer transition-all"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Chunky Meme Pixel Mode Checkbox */}
              <label className="flex items-start gap-2 pt-2 pb-1 px-2.5 bg-rose-950/20 border border-rose-900/40 rounded-lg cursor-pointer hover:border-rose-700/60 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.chunkyPixelUpscale !== false}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      chunkyPixelUpscale: e.target.checked,
                    })
                  }
                  className="mt-0.5 accent-rose-500 rounded cursor-pointer"
                />
                <div className="text-[11px]">
                  <span className="font-semibold text-rose-300 flex items-center gap-1">
                    <span>💫</span> Chunky Meme Pixel Mode
                  </span>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    Nearest-neighbor upscale bakes giant sharp square pixels directly into the MP4 so it looks razor sharp and pixelated across Discord &amp; mobile players!
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* CARD 2: AUDIO RESOLUTION & BITCRUSH */}
        {/* CARD 2: AUDIO RESOLUTION & MEME DEGRADATION */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🔊</span>
              <div>
                <span className="text-xs font-bold text-white block">
                  Audio Resolution &amp; Meme Overdrive
                </span>
                <span className="text-[10px] text-slate-400">
                  {getMemeAudioDescription(settings) || 'Harmonic bitcrush & sample downsampling'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onChangeSettings({
                  ...settings,
                  syncAudioResolution: !settings.syncAudioResolution,
                })
              }
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                settings.syncAudioResolution
                  ? 'bg-rose-950/60 text-rose-300 border-rose-800/80 font-bold'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {settings.syncAudioResolution ? '✓ Synced to Video' : 'Manual FX'}
            </button>
          </div>

          {/* Quick Meme Sound Mode Presets */}
          <div className="space-y-1.5 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <span>💫</span>
                <span>Meme Sound Engines (Gumball &amp; Worst)</span>
              </span>
              <span className="text-[10px] text-amber-400 font-mono">
                {settings.memeAudioMode === 'gumball_meme'
                  ? 'Gumball Mode Active'
                  : settings.memeAudioMode === 'demonic_worst'
                  ? 'Demonic Mode Active'
                  : settings.memeAudioMode === 'telephone_radio'
                  ? 'Telephone Mode Active'
                  : 'Clean / Custom'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onChangeSettings(applyMemeAudioPreset('gumball_meme', settings))}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold text-left transition-all border cursor-pointer flex flex-col justify-between ${
                  settings.memeAudioMode === 'gumball_meme'
                    ? 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-sm shadow-amber-950 ring-1 ring-amber-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <span className="flex items-center gap-1">
                  <span>💫</span>
                  <span className="truncate">Gumball Meme</span>
                </span>
                <span className="text-[8px] font-normal text-amber-400/80 mt-0.5">
                  +12dB · Comb Echo · 8kHz
                </span>
              </button>

              <button
                type="button"
                onClick={() => onChangeSettings(applyMemeAudioPreset('demonic_worst', settings))}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold text-left transition-all border cursor-pointer flex flex-col justify-between ${
                  settings.memeAudioMode === 'demonic_worst'
                    ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-sm shadow-rose-950 ring-1 ring-rose-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <span className="flex items-center gap-1">
                  <span>👹</span>
                  <span className="truncate">Worst Audio Ever</span>
                </span>
                <span className="text-[8px] font-normal text-rose-400/80 mt-0.5">
                  +24dB · 1-bit · Demonic
                </span>
              </button>

              <button
                type="button"
                onClick={() => onChangeSettings(applyMemeAudioPreset('telephone_radio', settings))}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold text-left transition-all border cursor-pointer flex flex-col justify-between ${
                  settings.memeAudioMode === 'telephone_radio'
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 shadow-sm shadow-cyan-950 ring-1 ring-cyan-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <span className="flex items-center gap-1">
                  <span>📻</span>
                  <span className="truncate">1999 Walkie</span>
                </span>
                <span className="text-[8px] font-normal text-cyan-400/80 mt-0.5">
                  Bandpass · 11kHz
                </span>
              </button>

              <button
                type="button"
                onClick={() => onChangeSettings(applyMemeAudioPreset('none', settings))}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold text-left transition-all border cursor-pointer flex flex-col justify-between ${
                  settings.memeAudioMode === 'none' && !settings.audioOverdriveDb
                    ? 'bg-slate-800 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <span className="flex items-center gap-1">
                  <span>🧼</span>
                  <span className="truncate">Clean Reset</span>
                </span>
                <span className="text-[8px] font-normal text-slate-500 mt-0.5">
                  0dB · Clean 44.1k
                </span>
              </button>
            </div>
          </div>

          {/* Overdrive & Distortion Gain Slider */}
          <div className="space-y-1.5 bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
            <div className="flex justify-between items-center text-[11px]">
              <label className="text-slate-300 font-medium flex items-center gap-1.5">
                <span>🔥</span>
                <span>Overdrive / Distortion Gain</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    (settings.audioOverdriveDb || 0) >= 20
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : (settings.audioOverdriveDb || 0) >= 10
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : (settings.audioOverdriveDb || 0) > 0
                      ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {(settings.audioOverdriveDb || 0) >= 20
                    ? '☠️ Speaker Oblivion'
                    : (settings.audioOverdriveDb || 0) >= 10
                    ? '💫 Meme Overdrive'
                    : (settings.audioOverdriveDb || 0) > 0
                    ? 'Warm Drive'
                    : 'Clean'}
                </span>
                <span className="text-amber-400 font-mono font-bold text-xs">
                  +{settings.audioOverdriveDb || 0} dB
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={settings.audioOverdriveDb || 0}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    audioOverdriveDb: parseInt(e.target.value, 10),
                    memeAudioMode: 'custom',
                  })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <input
                type="number"
                min="0"
                max="30"
                value={settings.audioOverdriveDb || 0}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    audioOverdriveDb: Math.max(0, Math.min(30, parseInt(e.target.value, 10) || 0)),
                    memeAudioMode: 'custom',
                  })
                }
                className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono font-bold text-right"
              />
            </div>

            {/* Audio Texture Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1.5">
              <label className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 cursor-pointer hover:bg-slate-850">
                <input
                  type="checkbox"
                  checked={Boolean(settings.audioHardClip)}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      audioHardClip: e.target.checked,
                      memeAudioMode: 'custom',
                    })
                  }
                  className="rounded border-slate-700 accent-amber-500"
                />
                <div className="text-[10px]">
                  <span className="text-white font-medium block">Hard Clip Overdrive</span>
                  <span className="text-slate-500 text-[9px]">Blown bass square wave</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 cursor-pointer hover:bg-slate-850">
                <input
                  type="checkbox"
                  checked={Boolean(settings.audioMetallicResonance)}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      audioMetallicResonance: e.target.checked,
                      memeAudioMode: 'custom',
                    })
                  }
                  className="rounded border-slate-700 accent-cyan-500"
                />
                <div className="text-[10px]">
                  <span className="text-white font-medium block">Metallic Pipe Echo</span>
                  <span className="text-slate-500 text-[9px]">Hollow robotic comb ring</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 cursor-pointer hover:bg-slate-850">
                <input
                  type="checkbox"
                  checked={Boolean(settings.audioBandpass)}
                  onChange={(e) =>
                    onChangeSettings({
                      ...settings,
                      audioBandpass: e.target.checked,
                      memeAudioMode: 'custom',
                    })
                  }
                  className="rounded border-slate-700 accent-rose-500"
                />
                <div className="text-[10px]">
                  <span className="text-white font-medium block">Telephone Bandpass</span>
                  <span className="text-slate-500 text-[9px]">250Hz - 3.6kHz box</span>
                </div>
              </label>
            </div>
          </div>

          {/* Granular Resample & Bit Depth Controls */}
          <div className="grid grid-cols-2 gap-3">
            {/* Audio Sample Rate (Hz) down to 1 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <label className="text-slate-400 font-medium">Sample Rate (Hz)</label>
                <span className="text-slate-500 font-mono">
                  {metadata.audioSampleRate || 44100}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="48000"
                  step="1"
                  value={settings.audioSampleRate || 44100}
                  onChange={(e) =>
                    handleAudioSampleRateChange(parseInt(e.target.value, 10) || 1)
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 font-mono font-bold focus:border-rose-500 focus:outline-none"
                />
                <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 pointer-events-none">
                  Hz
                </span>
              </div>
              <div className="flex flex-wrap gap-1 font-mono text-[9px] pt-1">
                {[
                  { label: '1 Hz 🪦', hz: 1 },
                  { label: '1000 Hz 👹', hz: 1000 },
                  { label: '8 kHz 💫', hz: 8000 },
                  { label: '44.1k', hz: 44100 },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => handleAudioSampleRateChange(s.hz)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Bit Depth (Bits) down to 1 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <label className="text-slate-400 font-medium">Bit Depth</label>
                <span className="text-slate-500 font-mono">16-bit</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="16"
                  step="1"
                  value={(settings as any).audioBitDepth || 16}
                  onChange={(e) =>
                    handleAudioBitDepthChange(parseInt(e.target.value, 10) || 1)
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 font-mono font-bold focus:border-rose-500 focus:outline-none"
                />
                <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 pointer-events-none">
                  bits
                </span>
              </div>
              <div className="flex flex-wrap gap-1 font-mono text-[9px] pt-1">
                {[
                  { label: '1-bit ⚡', bits: 1 },
                  { label: '2-bit ☠️', bits: 2 },
                  { label: '4-bit 💫', bits: 4 },
                  { label: '8-bit', bits: 8 },
                  { label: '16-bit', bits: 16 },
                ].map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => handleAudioBitDepthChange(b.bits)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Audio Bitrate & Volume */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Audio Bitrate (kbps)</label>
              <input
                type="number"
                min="1"
                max="320"
                value={settings.audioBitrateKbps || 128}
                onChange={(e) =>
                  handleAudioBitrateChange(parseInt(e.target.value, 10) || 64)
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 font-mono font-bold focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Volume Multiplier (%)</label>
              <input
                type="number"
                min="10"
                max="500"
                step="10"
                value={settings.audioVolumePercent || 100}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    audioVolumePercent: parseInt(e.target.value, 10) || 100,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* CARD 3: QUALITY & FRAMERATE */}
        <div className={`border rounded-xl p-4 space-y-3 shadow-md transition-all ${
          settings.compressionFocus === 'resolution_only'
            ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>⚡</span>
              <span>Quality, Bitrate &amp; FPS</span>
            </span>
            {settings.compressionFocus === 'resolution_only' ? (
              <span className="text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                High Quality (CRF 18)
              </span>
            ) : (
              <span className="text-[10px] font-mono text-amber-400">
                {settings.mode === 'crf' ? `CRF ${settings.crf}` : `${settings.videoBitrateKbps}k`}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Video Bitrate (kbps) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <label className="text-slate-400 font-medium">Video Bitrate</label>
                <span className="text-slate-500 font-mono">Orig: {metadata.bitrateKbps}k</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={metadata.bitrateKbps * 2}
                  disabled={settings.compressionFocus === 'resolution_only'}
                  value={settings.videoBitrateKbps || 200}
                  onChange={(e) =>
                    handleVideoBitrateChange(parseInt(e.target.value, 10) || 100)
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:border-amber-500 focus:outline-none disabled:opacity-40"
                />
                <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 pointer-events-none">
                  kbps
                </span>
              </div>
            </div>

            {/* Framerate (fps) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <label className="text-slate-400 font-medium">Framerate (fps)</label>
                <span className="text-slate-500 font-mono">Orig: {metadata.fps}</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0.5"
                  max={metadata.fps || 60}
                  step="1"
                  value={settings.fps || metadata.fps || 30}
                  onChange={(e) => handleFpsChange(parseFloat(e.target.value) || 30)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                />
                <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 pointer-events-none">
                  fps
                </span>
              </div>
            </div>
          </div>

          {/* Constant Rate Factor (CRF) input */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-[11px]">
              <label className="text-slate-400">CRF Quality (0 = Lossless, 63 = Dead)</label>
              <span className="font-mono text-amber-400 font-bold">
                {settings.compressionFocus === 'resolution_only' ? 18 : (settings.crf ?? 28)}
              </span>
            </div>
            <input
              type="number"
              min="0"
              max="63"
              disabled={settings.compressionFocus === 'resolution_only'}
              value={settings.compressionFocus === 'resolution_only' ? 18 : (settings.crf ?? 28)}
              onChange={(e) => handleCrfChange(parseInt(e.target.value, 10) || 28)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:border-amber-500 focus:outline-none disabled:opacity-40"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
