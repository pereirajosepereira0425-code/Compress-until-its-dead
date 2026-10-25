import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>☠️</span>
          <span className="font-bold text-slate-300">compresss until it&apos;s dead</span>
          <span aria-hidden="true">·</span>
          <span>Limitless Video & Audio Compression Studio</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span>H.264 & HEVC Encoders</span>
          <span aria-hidden="true">·</span>
          <span>FFmpeg Native Backend</span>
          <span aria-hidden="true">·</span>
          <span>Zero File Size Limits</span>
        </div>
      </div>
    </footer>
  );
};
