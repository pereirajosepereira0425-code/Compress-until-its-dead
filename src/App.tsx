import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { PresetSelector } from './components/PresetSelector';
import { CustomInputsWorkbench } from './components/CustomInputsWorkbench';
import { AdvancedSettingsModal } from './components/AdvancedSettingsModal';
import { ComparePlayer } from './components/ComparePlayer';
import { StatsCard } from './components/StatsCard';
import { ExplainerSection } from './components/ExplainerSection';
import { Footer } from './components/Footer';
import {
  CompressionSettings,
  VideoMetadata,
  COMPRESSION_PRESETS,
  PresetDefinition,
  formatBytes,
  getSyncedAudioResolution,
  calculateTargetDimensions,
} from './utils/compressionMath';

const DEFAULT_SETTINGS: CompressionSettings = {
  compressionFocus: 'both',
  mode: 'percentage',
  presetName: 'Clean Squeeze',
  targetPercent: 50,
  crf: 28,
  resolutionMode: 'original',
  chunkyPixelUpscale: true,
  maintainAspectRatio: true,
  fpsMode: 'original',
  videoCodec: 'h264',
  syncAudioResolution: true, // Star feature!
  audioMode: 'keep',
  audioSampleRate: 44100,
  audioBitrateKbps: 128,
  audioVolumePercent: 100,
};

export default function App() {
  const [samples, setSamples] = useState<any[]>([]);
  const [fileId, setFileId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const [settings, setSettings] = useState<CompressionSettings>(DEFAULT_SETTINGS);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('standard-50');
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgressText, setCompressionProgressText] = useState('Encoding video...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [compressionResult, setCompressionResult] = useState<{
    fileId: string;
    downloadUrl: string;
    streamUrl: string;
    original: VideoMetadata;
    compressed: VideoMetadata & {
      audioBitDepth?: number;
      audioTierLabel?: string;
      targetWidth?: number;
      targetHeight?: number;
      memeAudioMode?: string;
      audioOverdriveDb?: number;
    };
    savings: { bytesSaved: number; percentSaved: number };
  } | null>(null);

  const compressorSectionRef = useRef<HTMLDivElement>(null);
  const presetsSectionRef = useRef<HTMLDivElement>(null);
  const compareSectionRef = useRef<HTMLDivElement>(null);
  const howItWorksSectionRef = useRef<HTMLDivElement>(null);

  // Fetch preloaded samples on mount
  useEffect(() => {
    fetch('/api/samples')
      .then((res) => res.json())
      .then((data) => {
        if (data.samples && data.samples.length > 0) {
          setSamples(data.samples);
        }
      })
      .catch((err) => console.warn('Could not load samples:', err));
  }, []);

  // Handle uploaded file
  const handleFileSelected = async (file: File) => {
    try {
      setIsUploading(true);
      setErrorMsg(null);
      setCompressionResult(null);
      setVideoTitle(file.name);

      const formData = new FormData();
      formData.append('video', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Upload failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      setFileId(data.fileId);
      setVideoMetadata(data.metadata);
      setStreamUrl(data.streamUrl);
      setSettings((prev) => ({
        ...prev,
        customWidth: data.metadata.width,
        customHeight: data.metadata.height,
        videoBitrateKbps: Math.round(data.metadata.bitrateKbps * 0.5) || 200,
        audioSampleRate: data.metadata.audioSampleRate || 44100,
      }));

      // Scroll to compressor controls
      setTimeout(() => {
        compressorSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle sample selection
  const handleSampleSelected = async (sampleId: string) => {
    try {
      setIsUploading(true);
      setErrorMsg(null);
      setCompressionResult(null);

      const found = samples.find((s) => s.id === sampleId);
      setVideoTitle(found ? found.name : sampleId);

      const res = await fetch(`/api/probe/${sampleId}`);
      if (!res.ok) throw new Error('Could not load sample video info');

      const meta = await res.json();
      setFileId(sampleId);
      setVideoMetadata(meta);
      setStreamUrl(`/api/stream/${sampleId}`);
      setSettings((prev) => ({
        ...prev,
        customWidth: meta.width,
        customHeight: meta.height,
        videoBitrateKbps: Math.round(meta.bitrateKbps * 0.5) || 200,
        audioSampleRate: meta.audioSampleRate || 44100,
      }));

      setTimeout(() => {
        compressorSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load sample');
    } finally {
      setIsUploading(false);
    }
  };

  // Preset Selection
  const handleSelectPreset = (preset: PresetDefinition) => {
    setSelectedPresetId(preset.id);
    let targetW = videoMetadata?.width || 1280;
    let targetH = videoMetadata?.height || 720;
    
    // Calculate preset target dimensions for input population
    const dummySettings: CompressionSettings = {
      ...settings,
      ...preset.settings,
    };
    if (videoMetadata) {
      const dims = calculateTargetDimensions(videoMetadata.width, videoMetadata.height, dummySettings);
      targetW = dims.width;
      targetH = dims.height;
    }

    setSettings((prev) => ({
      ...prev,
      ...preset.settings,
      customWidth: targetW,
      customHeight: targetH,
      presetName: preset.name,
    }));
  };

  // Execute Compression
  const handleCompress = async () => {
    if (!fileId) return;

    try {
      setIsCompressing(true);
      setErrorMsg(null);
      setCompressionProgressText('Transcoding video & compressing audio resolution...');

      const res = await fetch('/api/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          settings,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Compression failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      setCompressionResult(data);

      setTimeout(() => {
        compareSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Compression process failed');
    } finally {
      setIsCompressing(false);
    }
  };

  // Compress Again (Demise Loop)
  const handleCompressAgain = () => {
    if (!compressionResult) return;
    setFileId(compressionResult.fileId);
    setStreamUrl(compressionResult.streamUrl);
    setVideoMetadata(compressionResult.compressed);
    setVideoTitle(`crushed_${videoTitle}`);
    setCompressionResult(null);

    // Switch to even deeper death mode if not already
    const deadPreset = COMPRESSION_PRESETS.find((p) => p.id === 'compress-until-dead');
    if (deadPreset) {
      handleSelectPreset(deadPreset);
    }

    setTimeout(() => {
      compressorSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleReset = () => {
    setFileId(null);
    setVideoTitle('');
    setVideoMetadata(null);
    setStreamUrl(null);
    setCompressionResult(null);
  };

  const handleNavigate = (section: string) => {
    if (section === 'compressor') {
      compressorSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'presets') {
      presetsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'audio-resolution') {
      setIsAdvancedModalOpen(true);
    } else if (section === 'compare') {
      compareSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'how-it-works') {
      howItWorksSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Current calculated target audio tier
  const currentHeight = videoMetadata?.height || 720;
  const audioPreview = getSyncedAudioResolution(currentHeight);

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      <Header
        onStartCrushing={() => {
          if (!fileId && samples.length > 0) {
            handleSampleSelected(samples[0].id);
          } else {
            compressorSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onNavigate={handleNavigate}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span>⚡</span>
            <span className="font-semibold text-white">FreeConvert Engine Upgraded</span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400 font-bold">Zero Compression Limits</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Compress your video{' '}
            <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
              until it&apos;s dead.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Change video quality, width, height, and resolution to <strong className="text-white font-semibold">any amount</strong> without limits. Plus, compress the <strong className="text-rose-300 font-semibold">audio&apos;s resolution</strong> (Sample Rate &amp; Bit Depth) in harmonic sync!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span> No 8MB/25MB paywalls
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span> 4K down to 2x2 pixels
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1.5">
              <span className="text-rose-400">✓</span> Audio Sample Rate &amp; Bitcrusher
            </span>
          </div>
        </section>

        {/* COMPRESSOR MAIN WORKBENCH */}
        <section ref={compressorSectionRef} className="space-y-6 scroll-mt-24">
          {/* If No Video Selected: Show DropZone */}
          {!fileId ? (
            <DropZone
              onFileSelected={handleFileSelected}
              onSampleSelected={handleSampleSelected}
              samples={samples}
              isUploading={isUploading}
            />
          ) : (
            /* Video Selected State: Active File Bar & Settings Controls */
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
              {/* Active Video Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                    🎬
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white truncate max-w-md">
                        {videoTitle}
                      </h2>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono px-2 py-0.5 rounded">
                        Ready
                      </span>
                    </div>
                    {videoMetadata && (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono text-slate-300">
                          {formatBytes(videoMetadata.sizeBytes)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-300">
                          {videoMetadata.width}×{videoMetadata.height}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-300">
                          {videoMetadata.fps} fps
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-rose-300">
                          {videoMetadata.audioSampleRate || 44100} Hz Audio
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsAdvancedModalOpen(true)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>⚙️</span>
                    <span>Settings ({settings.resolutionMode})</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Preset Selector */}
              <div ref={presetsSectionRef}>
                <PresetSelector
                  selectedPresetId={selectedPresetId}
                  onSelectPreset={handleSelectPreset}
                  onOpenCustomSettings={() => setIsAdvancedModalOpen(true)}
                />
              </div>

              {/* Direct Numeric Input Console (Type Any Number Below Original!) */}
              {videoMetadata && (
                <div className="pt-2">
                  <CustomInputsWorkbench
                    settings={settings}
                    onChangeSettings={(newSettings) => setSettings(newSettings)}
                    metadata={videoMetadata}
                  />
                </div>
              )}

              {/* Special Audio Resolution Highlight Card */}
              <div className="bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 border border-rose-900/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔊</span>
                    <span className="text-xs font-bold text-white">
                      Audio Resolution Status:
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-300">
                      {settings.syncAudioResolution
                        ? 'Synced with Video Scale'
                        : `${settings.audioSampleRate || 44100} Hz / ${(settings as any).audioBitDepth || 16}-bit`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {settings.syncAudioResolution
                      ? `When video shrinks, audio will automatically compress to match: ${audioPreview.tierName}.`
                      : 'Audio resolution is configured manually in advanced settings.'}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      syncAudioResolution: !prev.syncAudioResolution,
                    }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                    settings.syncAudioResolution
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {settings.syncAudioResolution ? '✓ Audio Sync Active' : 'Enable Audio Sync'}
                </button>
              </div>

              {/* Big Primary Compress Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Selected Mode:</span>
                  <span className="font-semibold text-white font-mono">
                    {settings.presetName || 'Custom'}
                  </span>
                  <span>·</span>
                  <span className="text-slate-500">
                    Engine: FFmpeg libx264 + AAC
                  </span>
                </div>

                <button
                  onClick={handleCompress}
                  disabled={isCompressing}
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-extrabold text-slate-950 bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400 hover:from-rose-300 hover:to-emerald-300 rounded-xl shadow-xl shadow-rose-950/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {isCompressing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>{compressionProgressText}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base">☠️</span>
                      <span>Compress Video (Until It&apos;s Dead)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300">
                  ⚠️ {errorMsg}
                </div>
              )}
            </div>
          )}
        </section>

        {/* RESULTS & COMPARISON SECTION */}
        {compressionResult && videoMetadata && (
          <section ref={compareSectionRef} className="space-y-6 animate-in fade-in duration-300 scroll-mt-24">
            {/* Stats Card */}
            <StatsCard
              originalMeta={compressionResult.original}
              compressedMeta={compressionResult.compressed}
              savings={compressionResult.savings}
              downloadUrl={compressionResult.downloadUrl}
              onCompressAgain={handleCompressAgain}
              onReset={handleReset}
            />

            {/* Side-by-Side Curtain Player */}
            {streamUrl && (
              <ComparePlayer
                originalUrl={streamUrl}
                compressedUrl={compressionResult.streamUrl}
                originalMeta={compressionResult.original}
                compressedMeta={compressionResult.compressed}
              />
            )}
          </section>
        )}

        {/* EXPLAINER & ARCHITECTURE SECTION */}
        <div ref={howItWorksSectionRef} className="scroll-mt-24">
          <ExplainerSection />
        </div>
      </main>

      <Footer />

      {/* Advanced Settings Modal */}
      <AdvancedSettingsModal
        isOpen={isAdvancedModalOpen}
        onClose={() => setIsAdvancedModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        videoMetadata={videoMetadata}
      />
    </div>
  );
}
