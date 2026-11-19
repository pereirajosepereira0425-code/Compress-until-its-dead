import React, { useState } from 'react';
import { CompressionSettings, VideoMetadata, getSyncedAudioResolution } from '../utils/compressionMath';

interface AdvancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CompressionSettings;
  onSaveSettings: (settings: CompressionSettings) => void;
  videoMetadata?: VideoMetadata | null;
}

export const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({
  isOpen,
  onClose,
  settings: initialSettings,
  onSaveSettings,
  videoMetadata,
}) => {
  const [settings, setSettings] = useState<CompressionSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<'resolution' | 'audio' | 'compression' | 'codec'>('resolution');

  if (!isOpen) return null;

  const currentW = videoMetadata?.width || 1280;
  const currentH = videoMetadata?.height || 720;

  // Compute what synced audio would be right now
  let previewHeight = currentH;
  if (settings.resolutionMode === 'scale_percent') {
    previewHeight = Math.round(currentH * ((settings.scalePercent ?? 100) / 100));
  } else if (settings.resolutionMode === 'custom' && settings.customHeight) {
    previewHeight = settings.customHeight;
  } else if (settings.resolutionMode === 'preset') {
    const map: Record<string, number> = {
      '4k': 2160, '1080p': 1080, '720p': 720, '480p': 480, '360p': 360,
      '240p': 240, '144p': 144, '96p': 96, '48p': 48, '24p': 24, '12p': 12, '2p': 2
    };
    previewHeight = map[settings.resolutionPreset || ''] || currentH;
  }
  const syncedAudioPreview = getSyncedAudioResolution(previewHeight);

  const handleApply = () => {
    onSaveSettings(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚙️</span>
            <div>
              <h2 className="text-base font-bold text-white">Advanced Compressor Settings</h2>
              <p className="text-xs text-slate-400">Zero limits: change resolution, audio fidelity, and bitrate to any amount.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 pt-3 border-b border-slate-800/80 bg-slate-900/50 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('resolution')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'resolution'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📐 Resolution & Dimensions
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audio'
                ? 'border-rose-400 text-rose-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🔊 Audio Resolution Sync</span>
            {settings.syncAudioResolution && (
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('compression')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'compression'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🎚️ Compression & Bitrate
          </button>
          <button
            onClick={() => setActiveTab('codec')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'codec'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🎞️ Framerate & Codec
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-200">
          {/* TAB 1: RESOLUTION & DIMENSIONS */}
          {activeTab === 'resolution' && (
            <div className="space-y-5">
              {/* Quality vs Resolution Focus Selector */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Target Focus (Quality vs Resolution)</span>
                  <span className="text-[10px] text-slate-400">FreeConvert Concept</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'both', label: 'Dual Crunch (Both)', icon: '☠️' },
                    { id: 'quality_only', label: 'Quality Only (Keep Res)', icon: '💎' },
                    { id: 'resolution_only', label: 'Resolution Only (Keep Qual)', icon: '📐' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          compressionFocus: f.id as any,
                        }))
                      }
                      className={`p-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                        settings.compressionFocus === f.id
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-bold'
                          : 'border-slate-800 bg-slate-950/80 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{f.icon}</span>
                        <span className="truncate">{f.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Resolution Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'original', label: 'Original', icon: '📺' },
                    { id: 'preset', label: 'Presets (4K to 2p)', icon: '📐' },
                    { id: 'scale_percent', label: 'Scale %', icon: '🔍' },
                    { id: 'custom', label: 'Custom (Any WxH)', icon: '✏️' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          resolutionMode: mode.id as any,
                        }))
                      }
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer flex items-center gap-2 ${
                        settings.resolutionMode === mode.id
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-bold'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span>{mode.icon}</span>
                      <span>{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Selector */}
              {settings.resolutionMode === 'preset' && (
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Choose Resolution Target:</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {[
                      { id: '4k', label: '4K UHD (2160p)' },
                      { id: '1080p', label: '1080p FHD' },
                      { id: '720p', label: '720p HD' },
                      { id: '480p', label: '480p SD' },
                      { id: '360p', label: '360p Potato' },
                      { id: '240p', label: '240p Low' },
                      { id: '144p', label: '144p Cam' },
                      { id: '96p', label: '96p Retro' },
                      { id: '48p', label: '48p Deep-Fry' },
                      { id: '24p', label: '24p Dead' },
                      { id: '12p', label: '12p Oblivion' },
                      { id: '2p', label: '2p Subatomic' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            resolutionPreset: p.id,
                          }))
                        }
                        className={`p-2 rounded-lg text-xs font-mono border text-center transition-all cursor-pointer ${
                          settings.resolutionPreset === p.id
                            ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300 font-bold'
                            : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Scale Percent Slider */}
              {settings.resolutionMode === 'scale_percent' && (
                <div className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold">Scale Dimensions:</span>
                    <span className="font-mono text-emerald-400 font-bold text-sm">
                      {settings.scalePercent ?? 50}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={settings.scalePercent ?? 50}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        scalePercent: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>1% (Microscopic)</span>
                    <span>50% (Half Size)</span>
                    <span>100% (Original)</span>
                  </div>
                </div>
              )}

              {/* Custom Dimensions (Zero Limits!) */}
              {settings.resolutionMode === 'custom' && (
                <div className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span>Set Exact Resolution:</span>
                    <span className="text-slate-500 font-normal">Original: {currentW}x{currentH}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Width (pixels):</label>
                      <input
                        type="number"
                        min={settings.oneBitMode ? 0 : 1}
                        max="8192"
                        value={settings.customWidth ?? currentW}
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value, 10);
                          const minVal = settings.oneBitMode ? 0 : 1;
                          setSettings((prev) => ({
                            ...prev,
                            customWidth: Number.isNaN(parsed) ? minVal : Math.max(minVal, parsed),
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Height (pixels):</label>
                      <input
                        type="number"
                        min={settings.oneBitMode ? 0 : 1}
                        max="8192"
                        value={settings.customHeight ?? currentH}
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value, 10);
                          const minVal = settings.oneBitMode ? 0 : 1;
                          setSettings((prev) => ({
                            ...prev,
                            customHeight: Number.isNaN(parsed) ? minVal : Math.max(minVal, parsed),
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Maintain Aspect Ratio Toggle */}
              <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5">
                <div>
                  <div className="text-xs font-semibold text-white">Maintain Aspect Ratio</div>
                  <div className="text-[11px] text-slate-400">
                    Avoid stretching video distortion when scaling dimensions
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      maintainAspectRatio: !prev.maintainAspectRatio,
                    }))
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    settings.maintainAspectRatio ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform ${
                      settings.maintainAspectRatio ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO RESOLUTION SYNC (USER HIGHLIGHT!) */}
          {activeTab === 'audio' && (
            <div className="space-y-5">
              {/* The Star Feature: Sync Audio Resolution with Video Resolution */}
              <div className="bg-gradient-to-r from-rose-950/40 to-slate-900 border border-rose-800/60 rounded-xl p-4.5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔊⚡</span>
                      <h3 className="text-sm font-bold text-white">
                        Sync Audio Resolution with Video Resolution
                      </h3>
                      <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Harmonic Compression
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      As video resolution decreases (e.g. 240p, 144p, or 24p), the audio&apos;s temporal resolution (Sample Rate Hz) and bit resolution (Bit Depth) automatically drop in matching proportion!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        syncAudioResolution: !prev.syncAudioResolution,
                      }))
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                      settings.syncAudioResolution ? 'bg-rose-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform transform ${
                        settings.syncAudioResolution ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {settings.syncAudioResolution && (
                  <div className="bg-rose-950/60 border border-rose-700/50 rounded-lg p-3 text-xs text-rose-200 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <span>🎯 Current Dynamic Audio Target:</span>
                      <span className="font-mono text-white">{syncedAudioPreview.tierName}</span>
                    </div>
                    <p className="text-[11px] text-rose-300/80">
                      Sample Rate: {syncedAudioPreview.sampleRate} Hz · Audio Bitrate: {syncedAudioPreview.bitrateKbps} kbps · Quantization: 8-bit/4-bit bitcrusher applied automatically!
                    </p>
                  </div>
                )}
              </div>

              {/* Audio Mode */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Audio Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'keep', label: 'Keep Original', icon: '🎧' },
                    { id: 'custom', label: 'Custom Tuning', icon: '🎛️' },
                    { id: 'mute', label: 'Mute Audio', icon: '🔇' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          audioMode: mode.id as any,
                        }))
                      }
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer flex items-center gap-2 ${
                        settings.audioMode === mode.id
                          ? 'border-rose-500 bg-rose-950/40 text-rose-200 font-bold'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span>{mode.icon}</span>
                      <span>{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Audio Resolution Sliders */}
              {settings.audioMode !== 'mute' && !settings.syncAudioResolution && (
                <div className="space-y-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  {/* Sample Rate (Temporal Resolution) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-semibold">Audio Sample Rate (Temporal Resolution):</span>
                      <span className="font-mono text-rose-400 font-bold">
                        {settings.audioSampleRate ?? 44100} Hz
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { hz: 48000, label: '48k' },
                        { hz: 44100, label: '44.1k' },
                        { hz: 16000, label: '16k' },
                        { hz: 8000, label: '8k' },
                        { hz: 1, label: '1 Hz 🪦' },
                      ].map((item) => (
                        <button
                          key={item.hz}
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              audioSampleRate: item.hz,
                            }))
                          }
                          className={`p-1.5 rounded text-[11px] font-mono border text-center transition-all cursor-pointer ${
                            settings.audioSampleRate === item.hz
                              ? 'border-rose-500 bg-rose-950/50 text-rose-300 font-bold'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <div className="pt-1">
                      <label className="text-[11px] text-slate-400">Type Custom Sample Rate (Hz):</label>
                      <input
                        type="number"
                        min={settings.oneBitMode ? 0 : 1}
                        max="48000"
                        step="1"
                        value={settings.audioSampleRate ?? 44100}
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value, 10);
                          const minVal = settings.oneBitMode ? 0 : 1;
                          setSettings((prev) => ({
                            ...prev,
                            audioSampleRate: Number.isNaN(parsed) ? minVal : Math.max(minVal, parsed),
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 font-mono focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Audio Bit Depth / Quantization (acrusher bits) */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-semibold">Audio Bit Resolution (Bitcrusher Depth):</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {settings.audioBitDepth ?? 16}-bit
                      </span>
                    </div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {[
                        { bits: 16, label: '16-bit Clean' },
                        { bits: 12, label: '12-bit Tape' },
                        { bits: 8, label: '8-bit NES' },
                        { bits: 4, label: '4-bit Crunch' },
                        { bits: 2, label: '2-bit Square' },
                        { bits: 1, label: '1-bit Chaos' },
                      ].map((b) => (
                        <button
                          key={b.bits}
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              audioBitDepth: b.bits,
                            } as any))
                          }
                          className={`p-1.5 rounded text-[10px] font-mono border text-center transition-all cursor-pointer ${
                            (settings as any).audioBitDepth === b.bits || (!((settings as any).audioBitDepth) && b.bits === 16)
                              ? 'border-amber-500 bg-amber-950/50 text-amber-300 font-bold'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audio Bitrate */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-semibold">Audio Bitrate:</span>
                      <span className="font-mono text-rose-400 font-bold">
                        {settings.audioBitrateKbps || 128} kbps
                      </span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="320"
                      step="8"
                      value={settings.audioBitrateKbps || 128}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          audioBitrateKbps: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Volume Boost / Attenuation */}
              {settings.audioMode !== 'mute' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold">Audio Output Volume:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {settings.audioVolumePercent || 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="10"
                    value={settings.audioVolumePercent || 100}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        audioVolumePercent: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>10% (Whisper)</span>
                    <span>100% (Normal)</span>
                    <span>300% (Dead-Mode Blast)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMPRESSION METHOD & BITRATE */}
          {activeTab === 'compression' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Compression Strategy
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'percentage', label: 'By Percentage', icon: '📉' },
                    { id: 'target_size', label: 'Target Size (MB)', icon: '📦' },
                    { id: 'crf', label: 'Constant Quality (CRF)', icon: '💎' },
                    { id: 'bitrate', label: 'Exact Bitrate', icon: '⚡' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          mode: m.id as any,
                        }))
                      }
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer flex items-center gap-2 ${
                        settings.mode === m.id
                          ? 'border-amber-500 bg-amber-950/40 text-amber-200 font-bold'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {settings.mode === 'percentage' && (
                <div className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold">Reduce File Size By:</span>
                    <span className="font-mono text-amber-400 font-bold text-sm">
                      {settings.targetPercent ?? 50}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="99"
                    step="1"
                    value={settings.targetPercent ?? 50}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        targetPercent: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>-10% (Subtle)</span>
                    <span>-50% (Standard)</span>
                    <span>-99% (Near Extinction)</span>
                  </div>
                </div>
              )}

              {settings.mode === 'target_size' && (
                <div className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold">Target File Size (MB):</span>
                    <span className="font-mono text-amber-400 font-bold text-sm">
                      {settings.targetSizeMB ?? 8} MB
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[
                      { mb: 8, label: '8 MB (Discord)' },
                      { mb: 15, label: '15 MB (Slack)' },
                      { mb: 25, label: '25 MB (Gmail)' },
                      { mb: 1, label: '1 MB (Ultra Tiny)' },
                    ].map((preset) => (
                      <button
                        key={preset.mb}
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            targetSizeMB: preset.mb,
                          }))
                        }
                        className={`p-1.5 rounded text-xs font-mono border text-center transition-all cursor-pointer ${
                          settings.targetSizeMB === preset.mb
                            ? 'border-amber-500 bg-amber-950/50 text-amber-300 font-bold'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="500"
                    value={settings.targetSizeMB ?? 8}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        targetSizeMB: parseFloat(e.target.value) || 1,
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              {settings.mode === 'crf' && (
                <div className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold">CRF (Constant Rate Factor):</span>
                    <span className="font-mono text-amber-400 font-bold text-sm">
                      {settings.crf ?? 28}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="63"
                    step="1"
                    value={settings.crf ?? 28}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        crf: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>0 (Lossless)</span>
                    <span>23 (Default)</span>
                    <span>38 (Heavy)</span>
                    <span>63 (Dead Noise)</span>
                  </div>
                </div>
              )}

              {settings.mode === 'bitrate' && (
                <div className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold">Video Bitrate (kbps):</span>
                    <span className="font-mono text-amber-400 font-bold text-sm">
                      {settings.videoBitrateKbps ?? 200} kbps
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10000"
                    step="5"
                    value={settings.videoBitrateKbps ?? 200}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        videoBitrateKbps: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>2 kbps (Oblivion)</span>
                    <span>150 kbps (Meme)</span>
                    <span>1000 kbps (Good)</span>
                    <span>10000 kbps (Ultra)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FRAMERATE & CODEC */}
          {activeTab === 'codec' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Target Framerate (FPS)
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {[
                    { fps: 60, label: '60 fps' },
                    { fps: 30, label: '30 fps' },
                    { fps: 24, label: '24 fps' },
                    { fps: 15, label: '15 fps' },
                    { fps: 10, label: '10 fps' },
                    { fps: 5, label: '5 fps' },
                    { fps: 2, label: '2 fps' },
                    { fps: 1, label: '1 fps' },
                  ].map((f) => (
                    <button
                      key={f.fps}
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          fpsMode: 'custom',
                          fps: f.fps,
                        }))
                      }
                      className={`p-2 rounded-lg text-xs font-mono border text-center transition-all cursor-pointer ${
                        settings.fpsMode === 'custom' && settings.fps === f.fps
                          ? 'border-cyan-500 bg-cyan-950/50 text-cyan-300 font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Video Codec
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'h264', label: 'H.264 (AVC)', desc: 'Most compatible, web standard' },
                    { id: 'h265', label: 'H.265 (HEVC)', desc: 'Higher compression density' },
                    { id: 'vp9', label: 'VP9 (WebM)', desc: 'Open web video standard' },
                  ].map((codec) => (
                    <button
                      key={codec.id}
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          videoCodec: codec.id as any,
                        }))
                      }
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        settings.videoCodec === codec.id
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 font-bold'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-semibold text-white">{codec.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{codec.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-amber-300 hover:from-emerald-300 hover:to-amber-200 rounded-lg shadow-md transition-all cursor-pointer"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
