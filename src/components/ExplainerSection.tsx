import React from 'react';

export const ExplainerSection: React.FC = () => {
  return (
    <section className="w-full space-y-12 py-10 border-t border-slate-800/80">
      {/* Title & Introduction */}
      <div className="max-w-3xl space-y-3">
        <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold tracking-wide">
          <span>DEATH COMPRESSION ARCHITECTURE</span>
          <span aria-hidden="true">·</span>
          <span>NO ARTIFICIAL CAPS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Why traditional video compressors cap you, and why we don&apos;t.
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Standard tools like FreeConvert and Handbrake prevent you from reducing video and audio quality below safe consumer thresholds. We removed every limit. You can squash a 4K film into a 16x16 pixel square with 2-bit audio and 1 kbps bitrate.
        </p>
      </div>

      {/* 3 Pillars Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pillar 1: Resolution & Dimensional Scaling */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-xl">
            📐
          </div>
          <h3 className="text-base font-bold text-white">
            01. Arbitrary Dimension Downscaling
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Scales frame buffers to exact arbitrary pixel widths and heights (down to 2x2) using nearest-neighbor interpolation, preserving crunchy pixel art macroblocks rather than blurry linear anti-aliasing.
          </p>
          <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2">
            <span>4K (3840×2160)</span>
            <span>→</span>
            <span>Dead (24×24)</span>
          </div>
        </div>

        {/* Pillar 2: Harmonic Audio Resolution & Bitcrusher */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-xl">
            🔊
          </div>
          <h3 className="text-base font-bold text-white">
            02. Dual Audio Resolution Scaling
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Reduces audio along two mathematical vectors: temporal resolution (Sample Rate in Hz, dropping Nyquist cutoff from 24kHz down to 1kHz) and amplitude resolution (Quantization bit-depth from 16-bit to 8-bit, 4-bit, or 2-bit via hardware acrusher).
          </p>
          <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2">
            <span>48 kHz / 16-bit</span>
            <span>→</span>
            <span>2 kHz / 2-bit</span>
          </div>
        </div>

        {/* Pillar 3: Bitrate & Quantization Annihilation */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-xl">
            ⚡
          </div>
          <h3 className="text-base font-bold text-white">
            03. Unbounded CRF & Rate Control
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            H.264 discrete cosine transform quantization matrix pushes Constant Rate Factor all the way to 63 and bitrates down to 2 kbps, stripping non-essential entropy until only pure motion ghosting remains.
          </p>
          <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2">
            <span>CRF 18 (Pristine)</span>
            <span>→</span>
            <span>CRF 63 (Demise)</span>
          </div>
        </div>
      </div>

      {/* Preset Guide Table */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>📊</span> Destruction Preset Reference Guide
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="pb-3 pr-4">Mode</th>
                <th className="pb-3 pr-4">Target Resolution</th>
                <th className="pb-3 pr-4">Audio Sample Rate</th>
                <th className="pb-3 pr-4">Audio Bit Depth</th>
                <th className="pb-3 pr-4">Framerate</th>
                <th className="pb-3">Use Case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              <tr>
                <td className="py-2.5 pr-4 text-emerald-400 font-bold">✨ Clean Squeeze</td>
                <td className="py-2.5 pr-4 text-slate-300">Original / 1080p</td>
                <td className="py-2.5 pr-4">44,100 Hz</td>
                <td className="py-2.5 pr-4">16-bit</td>
                <td className="py-2.5 pr-4">Original</td>
                <td className="py-2.5 text-slate-400 font-sans">High quality file size cut</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-cyan-400 font-bold">👾 Discord Free</td>
                <td className="py-2.5 pr-4 text-slate-300">720p</td>
                <td className="py-2.5 pr-4">44,100 Hz</td>
                <td className="py-2.5 pr-4">16-bit</td>
                <td className="py-2.5 pr-4">30 fps</td>
                <td className="py-2.5 text-slate-400 font-sans">Passes 8MB Discord attachment</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-yellow-400 font-bold">🥔 2007 Potato</td>
                <td className="py-2.5 pr-4 text-slate-300">360p (640×360)</td>
                <td className="py-2.5 pr-4">24,000 Hz</td>
                <td className="py-2.5 pr-4">12-bit</td>
                <td className="py-2.5 pr-4">24 fps</td>
                <td className="py-2.5 text-slate-400 font-sans">Classic early YouTube aesthetics</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-amber-500 font-bold">📹 90s CCTV</td>
                <td className="py-2.5 pr-4 text-slate-300">144p (256×144)</td>
                <td className="py-2.5 pr-4">11,025 Hz</td>
                <td className="py-2.5 pr-4">8-bit</td>
                <td className="py-2.5 pr-4">10 fps</td>
                <td className="py-2.5 text-slate-400 font-sans">Surveillance camera look</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-rose-400 font-bold">🔥 Deep-Fried</td>
                <td className="py-2.5 pr-4 text-slate-300">72p (128×72)</td>
                <td className="py-2.5 pr-4">8,000 Hz</td>
                <td className="py-2.5 pr-4">4-bit</td>
                <td className="py-2.5 pr-4">8 fps</td>
                <td className="py-2.5 text-slate-400 font-sans">Crushed meme content</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-red-500 font-extrabold">☠️ UNTIL IT&apos;S DEAD</td>
                <td className="py-2.5 pr-4 text-rose-300">24p (42×24)</td>
                <td className="py-2.5 pr-4 text-rose-300">4,000 Hz</td>
                <td className="py-2.5 pr-4 text-rose-300">2-bit</td>
                <td className="py-2.5 pr-4 text-rose-300">5 fps</td>
                <td className="py-2.5 text-slate-400 font-sans">True digital extinction</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
