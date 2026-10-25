/**
 * Compression Math and Audio Resolution Sync Utilities
 * "compresss until it's dead"
 */
export interface CompressionSettings {
  compressionFocus: 'both' | 'quality_only' | 'resolution_only'; // FreeConvert distinction: Quality vs Resolution
  mode: 'percentage' | 'target_size' | 'crf' | 'bitrate' | 'preset';
  presetName?: string;
  targetPercent?: number; // e.g. 10 to 99.9%
  targetSizeMB?: number; // e.g. 8 for discord, 25 for email
  crf?: number; // 0 (lossless) to 63 (pure artifact noise)
  videoBitrateKbps?: number; // manual bitrate
  resolutionMode: 'original' | 'preset' | 'custom' | 'scale_percent' | 'pixel_count';
  resolutionPreset?: string;
  customWidth?: number;
  customHeight?: number;
  scalePercent?: number;
  totalPixels?: number; // Exact amount of pixels in the whole video (e.g. 500, 1000, 2304)
  pixelBlockSize?: number; // Size of chunky pixel blocks (e.g. 8px, 16px, 24px)
  chunkyPixelUpscale?: boolean; // Nearest-neighbor upscale so pixels look giant & sharp like Gumball meme video
  maintainAspectRatio: boolean;
  fpsMode: 'original' | 'custom';
  fps?: number;
  videoCodec: 'h264' | 'h265' | 'vp9' | 'vp8' | 'gif';
  
  // Audio Resolution & Compression
  syncAudioResolution: boolean; // whether audio resolution scales down with video resolution
  audioMode: 'keep' | 'custom' | 'mute';
  audioSampleRate?: number; // in Hz (e.g. 48000 down to 1)
  audioBitrateKbps?: number; // in kbps (e.g. 192 down to 1)
  audioVolumePercent?: number; // 100% standard, or higher for death blast
  audioBitDepth?: number; // 1 to 16 bits

  // Meme Audio & Distortion Destruction Modes
  memeAudioMode?: 'none' | 'gumball_meme' | 'demonic_worst' | 'telephone_radio' | 'custom';
  audioOverdriveDb?: number; // 0 to 30 dB gain boost / saturation
  audioHardClip?: boolean; // hard square-wave clipping overdrive
  audioMetallicResonance?: boolean; // metallic robot pipe resonance (aecho filter)
  audioBandpass?: boolean; // 250Hz - 3.6kHz telephone bandpass filter
}

export interface VideoMetadata {
  width: number;
  height: number;
  durationSeconds: number;
  sizeBytes: number;
  fps: number;
  bitrateKbps: number;
  audioSampleRate?: number;
  audioBitrateKbps?: number;
  codecVideo?: string;
  codecAudio?: string;
}

/**
 * Format raw bytes into human-readable strings
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  if (!Number.isFinite(bytes) || bytes < 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}

/**
 * Format seconds into mm:ss or hh:mm:ss
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Synchronize Audio Resolution (Sample Rate Hz and Bitrate kbps)
 * based on the compressed video resolution (height in pixels).
 * When video quality drops, audio fidelity drops in exact harmonic cadence!
 */
export function getSyncedAudioResolution(effectiveHeight: number): {
  sampleRate: number;
  bitrateKbps: number;
  tierName: string;
} {
  if (effectiveHeight >= 1080) {
    return { sampleRate: 48000, bitrateKbps: 192, tierName: 'Studio HD Audio (48 kHz / 192 kbps)' };
  } else if (effectiveHeight >= 720) {
    return { sampleRate: 44100, bitrateKbps: 128, tierName: 'Standard Audio (44.1 kHz / 128 kbps)' };
  } else if (effectiveHeight >= 480) {
    return { sampleRate: 32000, bitrateKbps: 96, tierName: 'Medium Audio (32 kHz / 96 kbps)' };
  } else if (effectiveHeight >= 360) {
    return { sampleRate: 24000, bitrateKbps: 64, tierName: 'Vintage Radio Audio (24 kHz / 64 kbps)' };
  } else if (effectiveHeight >= 240) {
    return { sampleRate: 16000, bitrateKbps: 32, tierName: 'Lo-Fi Telephone (16 kHz / 32 kbps)' };
  } else if (effectiveHeight >= 144) {
    return { sampleRate: 11025, bitrateKbps: 16, tierName: 'Walkie-Talkie Crunch (11 kHz / 16 kbps)' };
  } else if (effectiveHeight >= 48) {
    return { sampleRate: 8000, bitrateKbps: 8, tierName: '8-Bit Toy Bitcrush (8 kHz / 8 kbps)' };
  } else if (effectiveHeight >= 24) {
    return { sampleRate: 4000, bitrateKbps: 4, tierName: 'Terminal Deep-Fry (4 kHz / 4 kbps)' };
  } else if (effectiveHeight > 1) {
    return { sampleRate: 1000, bitrateKbps: 1, tierName: '☠️ Oblivion Pulse (1 kHz / 1 kbps)' };
  } else {
    // 1 pixel: absolute single-pulse singularity
    return { sampleRate: 1, bitrateKbps: 1, tierName: '💀 Subatomic Singularity (1 Hz / 1-bit / 1 kbps)' };
  }
}

export function calculateDimensionsFromPixelCount(
  origW: number,
  origH: number,
  totalPixels: number
): { width: number; height: number } {
  if (origW <= 0 || origH <= 0 || totalPixels <= 0) return { width: 64, height: 36 };
  if (totalPixels <= 1) {
    return { width: 1, height: 1 };
  }
  const aspect = origW / origH;
  const rawH = Math.max(1, Math.round(Math.sqrt(totalPixels / aspect)));
  const rawW = Math.max(1, Math.round(totalPixels / rawH));
  return { width: Math.max(1, rawW), height: Math.max(1, rawH) };
}

export function calculateDimensionsFromBlockSize(
  origW: number,
  origH: number,
  blockSize: number
): { width: number; height: number } {
  const safeBlock = Math.max(1, blockSize);
  const rawW = origW / safeBlock;
  const rawH = origH / safeBlock;
  const width = Math.max(1, Math.round(rawW));
  const height = Math.max(1, Math.round(rawH));
  return { width, height };
}

/**
 * Calculate output video dimensions based on input dimensions and settings.
 * Ensures even dimensions (divisible by 2) for H.264 / standard codecs.
 */
export function calculateTargetDimensions(
  origW: number,
  origH: number,
  settings: CompressionSettings
): { width: number; height: number } {
  if (origW <= 0 || origH <= 0) {
    return { width: 640, height: 360 };
  }

  // If user chooses to change Quality Only, resolution is preserved 100%!
  if (settings.compressionFocus === 'quality_only') {
    return {
      width: Math.max(2, Math.round(origW / 2) * 2),
      height: Math.max(2, Math.round(origH / 2) * 2),
    };
  }

  let targetW = origW;
  let targetH = origH;

  if (settings.resolutionMode === 'pixel_count' && settings.totalPixels && settings.totalPixels > 0) {
    const fromPixels = calculateDimensionsFromPixelCount(origW, origH, settings.totalPixels);
    targetW = fromPixels.width;
    targetH = fromPixels.height;
  } else if (
    settings.resolutionMode === 'custom' ||
    (settings.customWidth && settings.customHeight && (settings.customWidth !== origW || settings.customHeight !== origH))
  ) {
    const userW = Math.max(1, settings.customWidth || origW);
    const userH = Math.max(1, settings.customHeight || origH);

    if (settings.maintainAspectRatio) {
      const aspect = origW / origH;
      if (settings.customWidth && !settings.customHeight) {
        targetW = userW;
        targetH = Math.max(1, Math.round(userW / aspect));
      } else if (settings.customHeight && !settings.customWidth) {
        targetH = userH;
        targetW = Math.max(1, Math.round(userH * aspect));
      } else {
        // Both provided with maintain aspect ratio: fit inside box
        const scaleW = userW / origW;
        const scaleH = userH / origH;
        const scale = Math.min(scaleW, scaleH);
        targetW = Math.max(1, Math.round(origW * scale));
        targetH = Math.max(1, Math.round(origH * scale));
      }
    } else {
      targetW = userW;
      targetH = userH;
    }
  } else if (settings.resolutionMode === 'scale_percent') {
    const scale = Math.max(0.01, (settings.scalePercent ?? 100) / 100);
    targetW = Math.round(origW * scale);
    targetH = Math.round(origH * scale);
  } else if (settings.resolutionMode === 'preset') {
    const preset = settings.resolutionPreset || 'original';
    const presetsMap: Record<string, [number, number]> = {
      '4k': [3840, 2160],
      '1440p': [2560, 1440],
      '1080p': [1920, 1080],
      '720p': [1280, 720],
      '480p': [854, 480],
      '360p': [640, 360],
      '240p': [426, 240],
      '144p': [256, 144],
      '96p': [170, 96],
      '48p': [84, 48],
      '24p': [42, 24],
      '12p': [20, 12],
      '6p': [10, 6],
      '2p': [4, 2],
    };
    if (presetsMap[preset]) {
      const [pW, pH] = presetsMap[preset];
      if (settings.maintainAspectRatio) {
        const aspect = origW / origH;
        if (aspect >= 1) {
          targetH = pH;
          targetW = Math.round(pH * aspect);
        } else {
          targetW = pW;
          targetH = Math.round(pW / aspect);
        }
      } else {
        targetW = pW;
        targetH = pH;
      }
    }
  }

  // Ensure minimum 1x1
  targetW = Math.max(1, Math.round(targetW));
  targetH = Math.max(1, Math.round(targetH));

  return { width: targetW, height: targetH };
}

/**
 * Calculate estimated video bitrate in kbps for target size
 */
export function estimateBitrateForTargetSize(
  targetSizeBytes: number,
  durationSeconds: number,
  audioBitrateKbps: number = 64
): number {
  if (durationSeconds <= 0 || targetSizeBytes <= 0) return 100;
  // File size = (Video Bitrate + Audio Bitrate) * Duration / 8
  const totalBitrateKbps = (targetSizeBytes * 8) / (durationSeconds * 1000);
  const videoBitrateKbps = Math.max(1, Math.round(totalBitrateKbps - audioBitrateKbps));
  return videoBitrateKbps;
}

/**
 * Calculate percentage savings
 */
export function calculateSavings(originalBytes: number, compressedBytes: number): {
  bytesSaved: number;
  percentSaved: number;
} {
  if (originalBytes <= 0) return { bytesSaved: 0, percentSaved: 0 };
  const bytesSaved = Math.max(0, originalBytes - compressedBytes);
  const percentSaved = Math.min(100, Math.max(0, (bytesSaved / originalBytes) * 100));
  return {
    bytesSaved,
    percentSaved: parseFloat(percentSaved.toFixed(1)),
  };
}

/**
 * Extreme presets inspired by FreeConvert + "Compress Until It's Dead"
 */
export interface PresetDefinition {
  id: string;
  name: string;
  icon: string;
  badge: string;
  description: string;
  settings: Partial<CompressionSettings>;
}

export const COMPRESSION_PRESETS: PresetDefinition[] = [
  {
    id: 'standard-50',
    name: 'Clean Squeeze',
    icon: '✨',
    badge: '-50% Size',
    description: 'High visual fidelity with sensible 50% size reduction.',
    settings: {
      mode: 'percentage',
      targetPercent: 50,
      crf: 28,
      resolutionMode: 'original',
      maintainAspectRatio: true,
      syncAudioResolution: true,
      audioMode: 'custom',
      audioBitrateKbps: 128,
      audioSampleRate: 44100,
    },
  },
  {
    id: 'discord-8mb',
    name: 'Discord Free (8MB)',
    icon: '👾',
    badge: 'Max 8 MB',
    description: 'Guarantees video fits within Discord free tier attachment limit.',
    settings: {
      mode: 'target_size',
      targetSizeMB: 7.8,
      resolutionMode: 'preset',
      resolutionPreset: '720p',
      maintainAspectRatio: true,
      syncAudioResolution: true,
      fpsMode: 'custom',
      fps: 30,
    },
  },
  {
    id: 'email-25mb',
    name: 'Gmail Attachment (25MB)',
    icon: '✉️',
    badge: 'Max 24 MB',
    description: 'Safe target for email attachments without Google Drive upload.',
    settings: {
      mode: 'target_size',
      targetSizeMB: 24,
      resolutionMode: 'preset',
      resolutionPreset: '1080p',
      maintainAspectRatio: true,
      syncAudioResolution: true,
    },
  },
  {
    id: 'youtube-2007',
    name: '2007 YouTube Potato',
    icon: '🥔',
    badge: '360p Crunchy',
    description: 'Nostalgic early YouTube era: 360p, 24fps, 24kHz compressed audio.',
    settings: {
      mode: 'bitrate',
      videoBitrateKbps: 350,
      resolutionMode: 'preset',
      resolutionPreset: '360p',
      maintainAspectRatio: true,
      syncAudioResolution: true,
      audioSampleRate: 24000,
      audioBitrateKbps: 48,
      fpsMode: 'custom',
      fps: 24,
    },
  },
  {
    id: 'cctv-security',
    name: '90s CCTV Security Cam',
    icon: '📹',
    badge: '144p / 10fps',
    description: 'Low-frame rate surveillance footage with telephone audio.',
    settings: {
      mode: 'bitrate',
      videoBitrateKbps: 120,
      resolutionMode: 'preset',
      resolutionPreset: '144p',
      maintainAspectRatio: true,
      syncAudioResolution: true,
      audioSampleRate: 11025,
      audioBitrateKbps: 16,
      fpsMode: 'custom',
      fps: 10,
    },
  },
  {
    id: 'deep-fried-meme',
    name: 'Deep-Fried Bitcrush',
    icon: '🔥',
    badge: '72p Deep-Fry',
    description: 'Meme-level crunch with screaming 8kHz audio and visible blocky macroblocks.',
    settings: {
      mode: 'bitrate',
      videoBitrateKbps: 45,
      resolutionMode: 'preset',
      resolutionPreset: '72p',
      maintainAspectRatio: true,
      syncAudioResolution: true,
      audioSampleRate: 8000,
      audioBitrateKbps: 8,
      audioVolumePercent: 120,
      fpsMode: 'custom',
      fps: 8,
    },
  },
  {
    id: 'gumball-meme',
    name: '💫 Gumball Shooting Star',
    icon: '💫',
    badge: 'Meme Audio & Pixels',
    description: 'Exact meme look & sound: 2,304 total pixels (64×36), nearest-neighbor chunky mosaic, speech comb echo, telephone bandpass, and blown-out +12dB overdrive singing drop.',
    settings: {
      compressionFocus: 'both',
      mode: 'bitrate',
      videoBitrateKbps: 65,
      resolutionMode: 'pixel_count',
      totalPixels: 2304,
      pixelBlockSize: 20,
      chunkyPixelUpscale: true,
      maintainAspectRatio: true,
      syncAudioResolution: false,
      audioMode: 'custom',
      memeAudioMode: 'gumball_meme',
      audioOverdriveDb: 12,
      audioHardClip: true,
      audioMetallicResonance: true,
      audioBandpass: true,
      audioSampleRate: 8000,
      audioBitDepth: 4,
      audioBitrateKbps: 16,
      audioVolumePercent: 130,
      fpsMode: 'custom',
      fps: 24,
    },
  },
  {
    id: 'demonic-worst',
    name: '☠️ WORST AUDIO EVER',
    icon: '👹',
    badge: 'Pure Demonic Screech',
    description: 'Worse than the meme: +24dB speaker blowout, 1-bit harsh aliasing, dual demonic comb filter, and 1,000 Hz foldover crunch.',
    settings: {
      compressionFocus: 'both',
      mode: 'bitrate',
      videoBitrateKbps: 15,
      resolutionMode: 'pixel_count',
      totalPixels: 576,
      pixelBlockSize: 32,
      chunkyPixelUpscale: true,
      maintainAspectRatio: true,
      syncAudioResolution: false,
      audioMode: 'custom',
      memeAudioMode: 'demonic_worst',
      audioOverdriveDb: 24,
      audioHardClip: true,
      audioMetallicResonance: true,
      audioBandpass: false,
      audioSampleRate: 1000,
      audioBitDepth: 1,
      audioBitrateKbps: 4,
      audioVolumePercent: 220,
      fpsMode: 'custom',
      fps: 12,
    },
  },
  {
    id: 'compress-until-dead',
    name: 'COMPRESS UNTIL IT’S DEAD',
    icon: '☠️',
    badge: 'Maximum Carnage',
    description: 'Extreme punishment: 32x32 resolution, 10 kbps bitrate, 4kHz crushed audio, 5 fps.',
    settings: {
      mode: 'bitrate',
      videoBitrateKbps: 10,
      resolutionMode: 'preset',
      resolutionPreset: '24p',
      maintainAspectRatio: true,
      syncAudioResolution: true,
      chunkyPixelUpscale: true,
      audioSampleRate: 4000,
      audioBitrateKbps: 4,
      fpsMode: 'custom',
      fps: 5,
    },
  },
  {
    id: 'oblivion-zero',
    name: '🪦 ABSOLUTE OBLIVION',
    icon: '🪦',
    badge: '2kbps / 12x12',
    description: 'Theoretical zero: 12x12 pixels, 2 kbps, 2kHz robotic pulse, 2 fps.',
    settings: {
      mode: 'bitrate',
      videoBitrateKbps: 2,
      resolutionMode: 'preset',
      resolutionPreset: '12p',
      maintainAspectRatio: true,
      syncAudioResolution: true,
      audioSampleRate: 2000,
      audioBitrateKbps: 2,
      fpsMode: 'custom',
      fps: 2,
    },
  },
];

/**
 * Apply Meme Audio FX presets to current settings
 */
export function applyMemeAudioPreset(
  mode: 'gumball_meme' | 'demonic_worst' | 'telephone_radio' | 'none',
  current: CompressionSettings
): CompressionSettings {
  if (mode === 'gumball_meme') {
    return {
      ...current,
      memeAudioMode: 'gumball_meme',
      syncAudioResolution: false,
      audioMode: 'custom',
      audioOverdriveDb: 12,
      audioHardClip: true,
      audioMetallicResonance: true,
      audioBandpass: true,
      audioSampleRate: 8000,
      audioBitDepth: 4,
      audioBitrateKbps: 16,
      audioVolumePercent: 130,
    };
  }

  if (mode === 'demonic_worst') {
    return {
      ...current,
      memeAudioMode: 'demonic_worst',
      syncAudioResolution: false,
      audioMode: 'custom',
      audioOverdriveDb: 24,
      audioHardClip: true,
      audioMetallicResonance: true,
      audioBandpass: false,
      audioSampleRate: 1000,
      audioBitDepth: 1,
      audioBitrateKbps: 4,
      audioVolumePercent: 220,
    };
  }

  if (mode === 'telephone_radio') {
    return {
      ...current,
      memeAudioMode: 'telephone_radio',
      syncAudioResolution: false,
      audioMode: 'custom',
      audioOverdriveDb: 4,
      audioHardClip: false,
      audioMetallicResonance: false,
      audioBandpass: true,
      audioSampleRate: 11025,
      audioBitDepth: 8,
      audioBitrateKbps: 24,
      audioVolumePercent: 100,
    };
  }

  // mode === 'none' (reset to clean)
  return {
    ...current,
    memeAudioMode: 'none',
    audioOverdriveDb: 0,
    audioHardClip: false,
    audioMetallicResonance: false,
    audioBandpass: false,
    audioSampleRate: 44100,
    audioBitDepth: 16,
    audioBitrateKbps: 128,
    audioVolumePercent: 100,
  };
}

/**
 * Get human-readable description of active meme audio FX
 */
export function getMemeAudioDescription(settings: CompressionSettings): string | null {
  if (settings.memeAudioMode === 'gumball_meme') {
    return '💫 Gumball Shooting Star Meme Audio (+12dB Overdrive, Comb Echo, Bandpass)';
  }
  if (settings.memeAudioMode === 'demonic_worst') {
    return '☠️ Demonic Audio Extinction (+24dB Blowout, 1-bit Aliasing, Dual Comb)';
  }
  if (settings.memeAudioMode === 'telephone_radio') {
    return '📻 1990s Lo-Fi Telephone Bandpass (250Hz - 3.6kHz)';
  }
  if ((settings.audioOverdriveDb && settings.audioOverdriveDb > 0) || settings.audioMetallicResonance) {
    return `🔥 Custom Distortion (+${settings.audioOverdriveDb || 0}dB${settings.audioMetallicResonance ? ', Comb Echo' : ''})`;
  }
  return null;
}

