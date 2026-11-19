import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBytes,
  formatDuration,
  getSyncedAudioResolution,
  calculateTargetDimensions,
  calculateDimensionsFromPixelCount,
  estimateBitrateForTargetSize,
  calculateSavings,
  COMPRESSION_PRESETS,
  applyMemeAudioPreset,
  getMemeAudioDescription,
  calculateAcrusherSamplesForRate,
  calculateOneBitCompressionStats,
  CompressionSettings,
} from './compressionMath';

test('formatBytes formats bytes correctly', () => {
  assert.equal(formatBytes(0), '0 Bytes');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1048576), '1 MB');
  assert.equal(formatBytes(25165824), '24 MB');
  assert.equal(formatBytes(-10), '0 Bytes');
});

test('formatDuration formats seconds into mm:ss or hh:mm:ss', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(45), '0:45');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(3665), '1:01:05');
});

test('getSyncedAudioResolution scales audio sample rate and bitrate down with video resolution', () => {
  // 1080p -> Studio 48kHz
  const hd = getSyncedAudioResolution(1080);
  assert.equal(hd.sampleRate, 48000);
  assert.equal(hd.bitrateKbps, 192);

  // 720p -> 44.1kHz
  const mid = getSyncedAudioResolution(720);
  assert.equal(mid.sampleRate, 44100);
  assert.equal(mid.bitrateKbps, 128);

  // 360p -> 24kHz
  const potato = getSyncedAudioResolution(360);
  assert.equal(potato.sampleRate, 24000);
  assert.equal(potato.bitrateKbps, 64);

  // 144p -> 11kHz
  const low = getSyncedAudioResolution(144);
  assert.equal(low.sampleRate, 11025);
  assert.equal(low.bitrateKbps, 16);

  // 48p -> 8kHz
  const fried = getSyncedAudioResolution(48);
  assert.equal(fried.sampleRate, 8000);
  assert.equal(fried.bitrateKbps, 8);

  // 16p -> Oblivion pulse (1kHz / 1kbps)
  const dead = getSyncedAudioResolution(16);
  assert.equal(dead.sampleRate, 1000);
  assert.equal(dead.bitrateKbps, 1);
});

test('calculateTargetDimensions scales dimensions and respects custom exact dimensions', () => {
  // 50% scale of 1920x1080 -> 960x540
  const half = calculateTargetDimensions(1920, 1080, {
    compressionFocus: 'both',
    mode: 'percentage',
    resolutionMode: 'scale_percent',
    scalePercent: 50,
    maintainAspectRatio: true,
    syncAudioResolution: true,
    audioMode: 'keep',
    videoCodec: 'h264',
    fpsMode: 'original',
  });
  assert.equal(half.width, 960);
  assert.equal(half.height, 540);

  // Exact custom dimensions (e.g. 15x15 or any number typed by user)
  const tiny = calculateTargetDimensions(1920, 1080, {
    compressionFocus: 'both',
    mode: 'percentage',
    resolutionMode: 'custom',
    customWidth: 15,
    customHeight: 15,
    maintainAspectRatio: false,
    syncAudioResolution: true,
    audioMode: 'keep',
    videoCodec: 'h264',
    fpsMode: 'original',
  });
  assert.equal(tiny.width, 15);
  assert.equal(tiny.height, 15);
  assert.ok(tiny.width >= 2);
  assert.ok(tiny.height >= 2);

  // Quality only preserves resolution
  const qualityOnly = calculateTargetDimensions(1920, 1080, {
    compressionFocus: 'quality_only',
    mode: 'percentage',
    resolutionMode: 'scale_percent',
    scalePercent: 10,
    maintainAspectRatio: true,
    syncAudioResolution: true,
    audioMode: 'keep',
    videoCodec: 'h264',
    fpsMode: 'original',
  });
  assert.equal(qualityOnly.width, 1920);
  assert.equal(qualityOnly.height, 1080);
});

test('estimateBitrateForTargetSize calculates realistic video bitrate', () => {
  // Target 8MB (8,388,608 bytes) for 60 seconds video with 64kbps audio
  const bitrate = estimateBitrateForTargetSize(8 * 1024 * 1024, 60, 64);
  // Total bitrate = (8*1024*1024*8)/(60*1000) ~ 1118 kbps. Minus 64 ~ 1054 kbps
  assert.ok(bitrate > 900 && bitrate < 1200);
});

test('calculateSavings computes savings percent and bytes', () => {
  const result = calculateSavings(1000000, 200000);
  assert.equal(result.bytesSaved, 800000);
  assert.equal(result.percentSaved, 80.0);
});

test('calculateTargetDimensions and calculateDimensionsFromPixelCount support down to 1', () => {
  // Total pixels = 1
  const onePixel = calculateDimensionsFromPixelCount(1920, 1080, 1);
  assert.equal(onePixel.width, 1);
  assert.equal(onePixel.height, 1);

  // Custom dimensions 1x1
  const customOne = calculateTargetDimensions(1920, 1080, {
    compressionFocus: 'both',
    mode: 'percentage',
    resolutionMode: 'custom',
    customWidth: 1,
    customHeight: 1,
    maintainAspectRatio: false,
    syncAudioResolution: true,
    audioMode: 'keep',
    videoCodec: 'h264',
    fpsMode: 'original',
  });
  assert.equal(customOne.width, 1);
  assert.equal(customOne.height, 1);

  // Audio down to 1 Hz
  const subatomicAudio = getSyncedAudioResolution(1);
  assert.equal(subatomicAudio.sampleRate, 1);
  assert.equal(subatomicAudio.bitrateKbps, 1);
  assert.ok(subatomicAudio.tierName.includes('1 Hz'));
});

test('presets exist and have valid settings', () => {
  assert.ok(COMPRESSION_PRESETS.length >= 6);
  const deadPreset = COMPRESSION_PRESETS.find(p => p.id === 'compress-until-dead');
  assert.ok(deadPreset);
  assert.equal(deadPreset?.settings.syncAudioResolution, true);

  const gumball = COMPRESSION_PRESETS.find(p => p.id === 'gumball-meme');
  assert.ok(gumball);
  assert.equal(gumball?.settings.memeAudioMode, 'gumball_meme');
  assert.equal(gumball?.settings.audioOverdriveDb, 12);
  assert.equal(gumball?.settings.audioHardClip, true);
  assert.equal(gumball?.settings.audioMetallicResonance, true);

  const demonic = COMPRESSION_PRESETS.find(p => p.id === 'demonic-worst');
  assert.ok(demonic);
  assert.equal(demonic?.settings.memeAudioMode, 'demonic_worst');
  assert.equal(demonic?.settings.audioOverdriveDb, 24);
  assert.equal(demonic?.settings.audioBitDepth, 1);
});

test('applyMemeAudioPreset configures correct audio overdrive and degradation parameters', () => {
  const baseSettings: CompressionSettings = {
    compressionFocus: 'both',
    mode: 'percentage',
    resolutionMode: 'original',
    maintainAspectRatio: true,
    syncAudioResolution: true,
    audioMode: 'keep',
    videoCodec: 'h264',
    fpsMode: 'original',
  };

  // Gumball Meme mode
  const gumball = applyMemeAudioPreset('gumball_meme', baseSettings);
  assert.equal(gumball.memeAudioMode, 'gumball_meme');
  assert.equal(gumball.audioOverdriveDb, 12);
  assert.equal(gumball.audioHardClip, true);
  assert.equal(gumball.audioMetallicResonance, true);
  assert.equal(gumball.audioBandpass, true);
  assert.equal(gumball.audioSampleRate, 8000);
  assert.equal(gumball.audioBitDepth, 4);

  const gumballDesc = getMemeAudioDescription(gumball);
  assert.ok(gumballDesc?.includes('Gumball'));
  assert.ok(gumballDesc?.includes('+12dB'));

  // Demonic Worst mode
  const demonic = applyMemeAudioPreset('demonic_worst', baseSettings);
  assert.equal(demonic.memeAudioMode, 'demonic_worst');
  assert.equal(demonic.audioOverdriveDb, 24);
  assert.equal(demonic.audioBitDepth, 1);
  assert.equal(demonic.audioSampleRate, 1000);
  assert.equal(demonic.audioHardClip, true);

  const demonicDesc = getMemeAudioDescription(demonic);
  assert.ok(demonicDesc?.includes('Demonic'));
  assert.ok(demonicDesc?.includes('+24dB'));

  // Reset to clean
  const clean = applyMemeAudioPreset('none', demonic);
  assert.equal(clean.memeAudioMode, 'none');
  assert.equal(clean.audioOverdriveDb, 0);
  assert.equal(clean.audioSampleRate, 44100);
  assert.equal(clean.audioBitDepth, 16);
  assert.equal(clean.audioHardClip, false);
});

test('all-ones-30db preset sets all parameters to 1 plus +30dB overdrive and chunky pixels', () => {
  const preset = COMPRESSION_PRESETS.find((p) => p.id === 'all-ones-30db');
  assert.ok(preset);
  assert.equal(preset.settings.customWidth, 1);
  assert.equal(preset.settings.customHeight, 1);
  assert.equal(preset.settings.totalPixels, 1);
  assert.equal(preset.settings.chunkyPixelUpscale, true);
  assert.equal(preset.settings.audioOverdriveDb, 30);
  assert.equal(preset.settings.audioSampleRate, 1);
  assert.equal(preset.settings.audioBitDepth, 1);
  assert.equal(preset.settings.audioBitrateKbps, 1);
  assert.equal(preset.settings.audioVolumePercent, 1);
  assert.equal(preset.settings.videoBitrateKbps, 1);
  assert.equal(preset.settings.fps, 1);
  assert.equal(preset.settings.crf, 1);
});

test('one-bit-singularity preset sets all non-audio controls to 0 and keeps audio 1-bit compression', () => {
  const preset = COMPRESSION_PRESETS.find((p) => p.id === 'one-bit-singularity');
  assert.ok(preset);
  assert.equal(preset.settings.oneBitMode, true);
  assert.equal(preset.settings.monochromeOneBit, true);
  assert.equal(preset.settings.totalPixels, 0);
  assert.equal(preset.settings.customWidth, 0);
  assert.equal(preset.settings.customHeight, 0);
  assert.equal(preset.settings.videoBitrateKbps, 0);
  assert.equal(preset.settings.fps, 0);
  assert.equal(preset.settings.crf, 0);
  assert.equal(preset.settings.audioBitDepth, 1);
  assert.equal(preset.settings.audioSampleRate, 1);

  // Dimensions resolve to 0x0 in oneBitMode
  const dims = calculateTargetDimensions(1280, 720, {
    compressionFocus: 'both',
    mode: 'bitrate',
    resolutionMode: 'pixel_count',
    maintainAspectRatio: true,
    syncAudioResolution: false,
    audioMode: 'custom',
    videoCodec: 'h264',
    fpsMode: 'custom',
    ...preset.settings,
  });
  assert.equal(dims.width, 0);
  assert.equal(dims.height, 0);
});

test('calculateOneBitCompressionStats computes exact compression ratio and bitrate to reach 1 bit', () => {
  const plan = calculateOneBitCompressionStats(1250000, 100);
  assert.equal(plan.originalBits, 10000000);
  assert.equal(plan.targetBits, 1);
  assert.equal(plan.bytesEquivalent, 0.125);
  assert.equal(plan.compressionRatio, 10000000);
  assert.ok(plan.percentSaved > 99.999);
  assert.equal(plan.requiredTotalBps, 0.01);
});

test('calculateAcrusherSamplesForRate clamps sample-and-hold factor to FFmpeg 1..250 bounds', () => {
  assert.equal(calculateAcrusherSamplesForRate(44100, 44100), 1);
  assert.equal(calculateAcrusherSamplesForRate(8000, 8000), 1);
  assert.equal(calculateAcrusherSamplesForRate(4000, 8000), 2);
  assert.equal(calculateAcrusherSamplesForRate(1000, 8000), 8);
  assert.equal(calculateAcrusherSamplesForRate(1, 8000), 250);
  assert.equal(calculateAcrusherSamplesForRate(0, 8000), 250);
});

test('zero-bit-void preset sets zeroBitMode and collapses all fields to 0', () => {
  const preset = COMPRESSION_PRESETS.find((p) => p.id === 'zero-bit-void');
  assert.ok(preset);
  assert.equal(preset.settings.zeroBitMode, true);
  assert.equal(preset.settings.oneBitMode, true);
  assert.equal(preset.settings.audioMode, 'mute');
  assert.equal(preset.settings.totalPixels, 0);
  assert.equal(preset.settings.customWidth, 0);
  assert.equal(preset.settings.customHeight, 0);
  assert.equal(preset.settings.videoBitrateKbps, 0);
  assert.equal(preset.settings.fps, 0);
  assert.equal(preset.settings.crf, 0);
  assert.equal(preset.settings.audioSampleRate, 0);
  assert.equal(preset.settings.audioBitDepth, 0);
  assert.equal(preset.settings.audioBitrateKbps, 0);
  assert.equal(preset.settings.audioVolumePercent, 0);
});
