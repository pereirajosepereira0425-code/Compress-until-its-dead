import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  calculateTargetDimensions,
  getSyncedAudioResolution,
  estimateBitrateForTargetSize,
  calculateSavings,
} from './src/utils/compressionMath';

dotenv.config();

const execAsync = promisify(exec);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Directories
const UPLOADS_DIR = '/tmp/compress_uploads';
const OUTPUTS_DIR = '/tmp/compress_outputs';
const SAMPLES_DIR = '/tmp/compress_samples';

[UPLOADS_DIR, OUTPUTS_DIR, SAMPLES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const unique = `video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

app.use(express.json());

// Probe video metadata using ffprobe
async function probeVideo(filePath: string) {
  try {
    const cmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
    const { stdout } = await execAsync(cmd);
    const info = JSON.parse(stdout);

    const videoStream = info.streams?.find((s: any) => s.codec_type === 'video');
    const audioStream = info.streams?.find((s: any) => s.codec_type === 'audio');

    let fps = 30;
    if (videoStream?.r_frame_rate) {
      const parts = videoStream.r_frame_rate.split('/');
      if (parts.length === 2 && Number(parts[1]) > 0) {
        fps = Math.round(Number(parts[0]) / Number(parts[1]));
      }
    }

    const duration = parseFloat(info.format?.duration || videoStream?.duration || '0');
    const size = parseInt(info.format?.size || '0', 10) || (fs.existsSync(filePath) ? fs.statSync(filePath).size : 0);
    const bitrate = parseInt(info.format?.bit_rate || '0', 10) || 0;

    return {
      width: parseInt(videoStream?.width || '1280', 10),
      height: parseInt(videoStream?.height || '720', 10),
      durationSeconds: duration > 0 ? duration : 5,
      sizeBytes: size,
      fps: fps || 30,
      bitrateKbps: Math.round(bitrate / 1000) || 1500,
      codecVideo: videoStream?.codec_name || 'h264',
      codecAudio: audioStream?.codec_name || 'aac',
      audioSampleRate: parseInt(audioStream?.sample_rate || '44100', 10),
      audioChannels: parseInt(audioStream?.channels || '2', 10),
      audioBitrateKbps: Math.round(parseInt(audioStream?.bit_rate || '128000', 10) / 1000) || 128,
    };
  } catch (err) {
    console.error('Error probing video:', err);
    const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
    return {
      width: 1280,
      height: 720,
      durationSeconds: 5,
      sizeBytes: stats ? stats.size : 1000000,
      fps: 30,
      bitrateKbps: 1500,
      codecVideo: 'h264',
      codecAudio: 'aac',
      audioSampleRate: 44100,
      audioChannels: 2,
      audioBitrateKbps: 128,
    };
  }
}

// Generate realistic demo sample clips if not yet generated
async function ensureSampleVideos() {
  const samples = [
    {
      id: 'sample_neon_drive',
      name: 'Cyberpunk Neon Drive (1080p)',
      duration: 6,
      desc: 'High contrast urban lighting test clip with stereo synth tone.',
      generate: `ffmpeg -y -f lavfi -i testsrc=duration=6:size=1920x1080:rate=30 -f lavfi -i "sine=frequency=220:duration=6" -vf "drawgrid=width=100:height=100:thickness=2:color=cyan@0.4" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 192k "${SAMPLES_DIR}/sample_neon_drive.mp4"`,
    },
    {
      id: 'sample_nature_waterfall',
      name: 'Rapid Motion & Particles (720p)',
      duration: 5,
      desc: 'Fast moving geometric shapes and dual frequency harmonics.',
      generate: `ffmpeg -y -f lavfi -i testsrc2=duration=5:size=1280x720:rate=60 -f lavfi -i "sine=frequency=440:duration=5" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 128k "${SAMPLES_DIR}/sample_nature_waterfall.mp4"`,
    },
    {
      id: 'sample_action_sprint',
      name: 'High FPS Sprint & Beat (480p)',
      duration: 4,
      desc: 'Color test bars with rhythmic 880Hz audio pulse.',
      generate: `ffmpeg -y -f lavfi -i smptebars=duration=4:size=854x480:rate=30 -f lavfi -i "sine=frequency=880:duration=4" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 96k "${SAMPLES_DIR}/sample_action_sprint.mp4"`,
    },
  ];

  for (const sample of samples) {
    const dest = `${SAMPLES_DIR}/${sample.id}.mp4`;
    if (!fs.existsSync(dest)) {
      try {
        await execAsync(sample.generate);
      } catch (e) {
        console.warn(`Failed to generate sample ${sample.id}:`, e);
      }
    }
  }

  // Copy user's attached Gumball meme video if present
  const userAssetPath = path.resolve('public/assets/aistudio/2026-10-24-171803355_490961be.mp4');
  if (fs.existsSync(userAssetPath)) {
    try {
      fs.copyFileSync(userAssetPath, `${SAMPLES_DIR}/sample_gumball.mp4`);
    } catch (e) {
      console.warn('Could not copy user sample video:', e);
    }
  }
}

// Ensure samples are built in background
ensureSampleVideos().catch(console.error);

// API: Get Samples
app.get('/api/samples', async (_req, res) => {
  await ensureSampleVideos();
  const samples = [
    {
      id: 'sample_gumball',
      name: '🐱 Darwin & Gumball Star',
      badge: 'User Meme · 144p Pixels',
      originalName: 'gumball_shooting_star.mp4',
      filePath: `${SAMPLES_DIR}/sample_gumball.mp4`,
    },
    {
      id: 'sample_neon_drive',
      name: 'Cyberpunk Neon Drive',
      badge: '1080p · 60fps · 6s',
      originalName: 'cyberpunk_drive_1080p.mp4',
      filePath: `${SAMPLES_DIR}/sample_neon_drive.mp4`,
    },
    {
      id: 'sample_nature_waterfall',
      name: 'Rapid Motion & Particles',
      badge: '720p · 60fps · 5s',
      originalName: 'rapid_motion_720p.mp4',
      filePath: `${SAMPLES_DIR}/sample_nature_waterfall.mp4`,
    },
    {
      id: 'sample_action_sprint',
      name: 'Color Bars & Audio Pulse',
      badge: '480p · 30fps · 4s',
      originalName: 'smpte_testbars_480p.mp4',
      filePath: `${SAMPLES_DIR}/sample_action_sprint.mp4`,
    },
  ];

  const results = [];
  for (const s of samples) {
    if (fs.existsSync(s.filePath)) {
      const meta = await probeVideo(s.filePath);
      results.push({
        ...s,
        metadata: meta,
      });
    }
  }
  res.json({ samples: results });
});

// API: Upload Video
app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No video file provided' });
      return;
    }
    const meta = await probeVideo(req.file.path);
    res.json({
      fileId: req.file.filename,
      originalName: req.file.originalname,
      sizeBytes: req.file.size,
      metadata: meta,
      streamUrl: `/api/stream/${req.file.filename}`,
    });
  } catch (err: any) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: err.message || 'Upload processing failed' });
  }
});

// API: Probe specific file
app.get('/api/probe/:fileId', async (req, res) => {
  const { fileId } = req.params;
  let targetPath = path.join(UPLOADS_DIR, fileId);
  if (!fs.existsSync(targetPath)) {
    targetPath = path.join(SAMPLES_DIR, `${fileId}.mp4`);
  }
  if (!fs.existsSync(targetPath)) {
    targetPath = path.join(OUTPUTS_DIR, fileId);
  }
  if (!fs.existsSync(targetPath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  const meta = await probeVideo(targetPath);
  res.json(meta);
});

// API: Compress Video with Zero Limits
app.post('/api/compress', async (req, res) => {
  try {
    const { fileId, settings } = req.body;
    if (!fileId) {
      res.status(400).json({ error: 'fileId is required' });
      return;
    }

    // Locate source file
    let sourcePath = path.join(UPLOADS_DIR, fileId);
    if (!fs.existsSync(sourcePath)) {
      sourcePath = path.join(SAMPLES_DIR, `${fileId}.mp4`);
    }
    if (!fs.existsSync(sourcePath)) {
      sourcePath = path.join(SAMPLES_DIR, fileId);
    }
    if (!fs.existsSync(sourcePath)) {
      sourcePath = path.join(OUTPUTS_DIR, fileId);
    }
    if (!fs.existsSync(sourcePath)) {
      res.status(404).json({ error: 'Source video file not found' });
      return;
    }

    const inputMeta = await probeVideo(sourcePath);

    // Compute target dimensions
    const { width: targetW, height: targetH } = calculateTargetDimensions(
      inputMeta.width,
      inputMeta.height,
      settings
    );

    // Compute Audio Resolution
    // If syncAudioResolution is enabled, scale audio sample rate & bitrate down to match video height!
    let targetSampleRate = 44100;
    let targetAudioBitrateKbps = 128;
    let audioBitDepth = 16;
    let audioTierLabel = 'Custom';

    if (settings.syncAudioResolution) {
      const synced = getSyncedAudioResolution(targetH);
      targetSampleRate = synced.sampleRate;
      targetAudioBitrateKbps = synced.bitrateKbps;
      audioTierLabel = synced.tierName;
      // Derive bit depth resolution based on target height
      if (targetH <= 1) {
        audioBitDepth = 1; // absolute 1-bit subatomic
      } else if (targetH <= 24) {
        audioBitDepth = 2; // extreme 2-bit death
      } else if (targetH <= 48) {
        audioBitDepth = 4; // 4-bit deep fry
      } else if (targetH <= 144) {
        audioBitDepth = 8; // 8-bit retro crunch
      } else {
        audioBitDepth = 16;
      }
    } else {
      // Respect explicitly passed audioSampleRate, audioBitDepth, audioBitrateKbps, and meme presets
      if (settings.audioSampleRate !== undefined && settings.audioSampleRate !== null) {
        targetSampleRate = Math.max(1, Number(settings.audioSampleRate));
      }
      if (settings.audioBitrateKbps !== undefined && settings.audioBitrateKbps !== null) {
        targetAudioBitrateKbps = Math.max(1, Number(settings.audioBitrateKbps));
      }
      if (settings.audioBitDepth !== undefined && settings.audioBitDepth !== null) {
        audioBitDepth = Math.max(1, Math.min(16, Number(settings.audioBitDepth)));
      }
    }

    // Formulate output filename
    const outFilename = `compressed_${Date.now()}_${targetW}x${targetH}.mp4`;
    const outputPath = path.join(OUTPUTS_DIR, outFilename);

    // Build FFmpeg command arguments
    const ffmpegArgs: string[] = ['-y', '-i', sourcePath];

    // Video Filters (Resolution & FPS)
    const vfParts: string[] = [];
    
    // Check FreeConvert compressionFocus:
    // If 'quality_only', do NOT downscale resolution (preserve full original pixel canvas)
    // If 'resolution_only' or 'both', apply target dimensions!
    if (settings.compressionFocus !== 'quality_only') {
      if (settings.chunkyPixelUpscale) {
        // Nearest-neighbor downscale + nearest-neighbor upscale back to original canvas:
        // This renders the EXACT razor-sharp, massive blocky mosaic pixels seen in the Gumball meme video!
        vfParts.push(`scale=${targetW}:${targetH}:flags=neighbor,scale=${inputMeta.width}:${inputMeta.height}:flags=neighbor`);
      } else {
        const scaleFlag = targetH <= 144 ? 'neighbor' : 'bicubic';
        // If target dimensions are odd (e.g. 1px or 1x1), pad to even numbers for libx264 compatibility
        if (targetW % 2 !== 0 || targetH % 2 !== 0) {
          vfParts.push(`scale=${targetW}:${targetH}:flags=${scaleFlag},pad=ceil(iw/2)*2:ceil(ih/2)*2:0:0`);
        } else {
          vfParts.push(`scale=${targetW}:${targetH}:flags=${scaleFlag}`);
        }
      }
    }

    if (settings.fpsMode === 'custom' && settings.fps) {
      const targetFps = Math.max(0.5, Number(settings.fps));
      vfParts.push(`fps=${targetFps}`);
    }

    if (vfParts.length > 0) {
      ffmpegArgs.push('-vf', vfParts.join(','));
    }

    // Codec & Quality flags
    ffmpegArgs.push('-c:v', 'libx264');
    ffmpegArgs.push('-pix_fmt', 'yuv420p');
    ffmpegArgs.push('-preset', 'veryfast');

    if (settings.compressionFocus === 'resolution_only') {
      // Resolution Only: preserve high visual encoding quality, only reduce dimensions!
      ffmpegArgs.push('-crf', '18');
    } else if (settings.mode === 'crf') {
      const crf = Math.max(0, Math.min(63, Number(settings.crf ?? 28)));
      ffmpegArgs.push('-crf', crf.toString());
    } else if (settings.mode === 'bitrate') {
      const vBitrate = Math.max(1, Number(settings.videoBitrateKbps || 200));
      ffmpegArgs.push('-b:v', `${vBitrate}k`, '-maxrate', `${vBitrate * 1.5}k`, '-bufsize', `${vBitrate * 2}k`);
    } else if (settings.mode === 'target_size' && settings.targetSizeMB) {
      const targetBytes = settings.targetSizeMB * 1024 * 1024;
      const vBitrate = estimateBitrateForTargetSize(targetBytes, inputMeta.durationSeconds, targetAudioBitrateKbps);
      ffmpegArgs.push('-b:v', `${vBitrate}k`, '-maxrate', `${vBitrate * 1.2}k`, '-bufsize', `${vBitrate * 2}k`);
    } else if (settings.mode === 'percentage' && settings.targetPercent) {
      // Reduce original file size by targetPercent
      const targetBytes = inputMeta.sizeBytes * (1 - settings.targetPercent / 100);
      const vBitrate = estimateBitrateForTargetSize(targetBytes, inputMeta.durationSeconds, targetAudioBitrateKbps);
      ffmpegArgs.push('-b:v', `${vBitrate}k`, '-maxrate', `${vBitrate * 1.2}k`, '-bufsize', `${vBitrate * 2}k`);
    } else {
      // Default balanced CRF
      ffmpegArgs.push('-crf', '32');
    }

    // Audio Filters & Settings
    if (settings.audioMode === 'mute') {
      ffmpegArgs.push('-an');
    } else {
      ffmpegArgs.push('-c:a', 'aac');

      const afFilters: string[] = [];

      // Set audio tier label for meme modes
      if (settings.memeAudioMode === 'gumball_meme') {
        audioTierLabel = '💫 Gumball Meme Sound (+12dB Hardclip / Comb Echo)';
      } else if (settings.memeAudioMode === 'demonic_worst') {
        audioTierLabel = '☠️ Demonic Audio Extinction (+24dB Blowout / 1-bit)';
      } else if (settings.memeAudioMode === 'telephone_radio') {
        audioTierLabel = '📻 1990s Lo-Fi Telephone Bandpass';
      }

      // 1. Audio Overdrive / Distortion Gain (boost input into clipping)
      const overdriveDb = Number(settings.audioOverdriveDb || 0);
      if (overdriveDb > 0) {
        afFilters.push(`volume=${overdriveDb}dB`);
      }

      // 2. Hard-clipping / speaker blowout saturation (essential for the Gumball meme singing drop)
      if (settings.audioHardClip || settings.memeAudioMode === 'gumball_meme' || settings.memeAudioMode === 'demonic_worst') {
        afFilters.push('asoftclip=type=hard');
      }

      // 3. Metallic comb echo / robotic resonance (character of low-bitrate MP3/AAC decoders in memes)
      if (settings.audioMetallicResonance || settings.memeAudioMode === 'gumball_meme') {
        afFilters.push('aecho=0.8:0.88:8:0.45');
      } else if (settings.memeAudioMode === 'demonic_worst') {
        afFilters.push('aecho=0.8:0.95:4|8:0.65|0.55');
      }

      // 4. Telephone / radio bandpass filter (lo-fi speech frequency cutoff)
      if (settings.audioBandpass || settings.memeAudioMode === 'gumball_meme') {
        afFilters.push('highpass=f=250,lowpass=f=3600');
      }

      // 5. Downsample to target sample rate (even down to 1 Hz!) then resample to 8000 Hz for AAC encoder compliance
      if (targetSampleRate < 8000) {
        afFilters.push(`aresample=${targetSampleRate},aresample=8000`);
      }

      // 6. Bitcrusher filter for reduced audio bit resolution (even down to 1-bit!) with aliasing aa=0
      if (audioBitDepth < 16) {
        afFilters.push(`acrusher=bits=${audioBitDepth}:mode=log:aa=0`);
      }

      // 7. Overall volume multiplier
      if (settings.audioVolumePercent && settings.audioVolumePercent !== 100) {
        const vol = (settings.audioVolumePercent / 100).toFixed(2);
        afFilters.push(`volume=${vol}`);
      }

      if (afFilters.length > 0) {
        ffmpegArgs.push('-af', afFilters.join(','));
      }

      // AAC requires sample rate >= 8000
      const safeAacSampleRate = Math.max(8000, targetSampleRate);
      ffmpegArgs.push('-ar', safeAacSampleRate.toString());
      ffmpegArgs.push('-b:a', `${Math.max(1, targetAudioBitrateKbps)}k`);
    }

    // Faststart for web streaming
    ffmpegArgs.push('-movflags', '+faststart');
    ffmpegArgs.push(outputPath);

    console.log('Spawning ffmpeg:', 'ffmpeg', ffmpegArgs.join(' '));

    const ffmpegProc = spawn('ffmpeg', ffmpegArgs);

    let stderrData = '';
    ffmpegProc.stderr.on('data', (d) => {
      stderrData += d.toString();
    });

    ffmpegProc.on('close', async (code) => {
      if (code !== 0) {
        console.error('FFmpeg failed with code', code, stderrData);
        res.status(500).json({
          error: `Compression failed (exit code ${code})`,
          details: stderrData.slice(-500),
        });
        return;
      }

      if (!fs.existsSync(outputPath)) {
        res.status(500).json({ error: 'Output file was not generated.' });
        return;
      }

      const outMeta = await probeVideo(outputPath);
      const savings = calculateSavings(inputMeta.sizeBytes, outMeta.sizeBytes);

      res.json({
        success: true,
        fileId: outFilename,
        downloadUrl: `/api/download/${outFilename}`,
        streamUrl: `/api/stream/${outFilename}`,
        original: inputMeta,
        compressed: {
          ...outMeta,
          targetWidth: targetW,
          targetHeight: targetH,
          audioSampleRate: targetSampleRate,
          audioBitDepth,
          audioTierLabel,
          memeAudioMode: settings.memeAudioMode || 'none',
          audioOverdriveDb: settings.audioOverdriveDb || 0,
        },
        savings,
      });
    });
  } catch (err: any) {
    console.error('Compress API error:', err);
    res.status(500).json({ error: err.message || 'Compression internal error' });
  }
});

// API: Stream video with partial Range support
app.get('/api/stream/:fileId', (req, res) => {
  const { fileId } = req.params;
  let filePath = path.join(OUTPUTS_DIR, fileId);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(UPLOADS_DIR, fileId);
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(SAMPLES_DIR, fileId);
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(SAMPLES_DIR, `${fileId}.mp4`);
  }

  if (!fs.existsSync(filePath)) {
    res.status(404).send('File not found');
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// API: Download video attachment
app.get('/api/download/:fileId', (req, res) => {
  const { fileId } = req.params;
  let filePath = path.join(OUTPUTS_DIR, fileId);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(UPLOADS_DIR, fileId);
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(SAMPLES_DIR, fileId);
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(SAMPLES_DIR, `${fileId}.mp4`);
  }

  if (!fs.existsSync(filePath)) {
    res.status(404).send('File not found');
    return;
  }

  const stat = fs.statSync(filePath);
  const cleanName = path.basename(fileId).replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeFilename = cleanName.endsWith('.mp4') ? cleanName : `${cleanName}.mp4`;

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

// Serve frontend with Vite in dev, or dist in prod
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
