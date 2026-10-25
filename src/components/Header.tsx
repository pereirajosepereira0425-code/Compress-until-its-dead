import React from 'react';

interface HeaderProps {
  onStartCrushing?: () => void;
  activeSection?: string;
  onNavigate?: (section: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onStartCrushing, onNavigate }) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0b0f17]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <a
          href="/"
          className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="text-xl">☠️</span>
          <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
            compresss until it&apos;s dead
          </span>
        </a>

        {/* Zone 2: Concise Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate?.('compressor')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer text-left"
          >
            Compressor
          </button>
          <button
            onClick={() => onNavigate?.('presets')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer text-left"
          >
            Death Presets
          </button>
          <button
            onClick={() => onNavigate?.('audio-resolution')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer text-left"
          >
            Audio Bitcrush
          </button>
          <button
            onClick={() => onNavigate?.('compare')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer text-left"
          >
            Compare Player
          </button>
          <button
            onClick={() => onNavigate?.('how-it-works')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer text-left"
          >
            How It Works
          </button>
        </nav>

        {/* Zone 3: 1 Primary CTA Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onStartCrushing}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400 hover:from-rose-300 hover:to-emerald-300 rounded-lg shadow-lg shadow-rose-950/30 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>⚡</span>
            <span>Compress Video</span>
          </button>
        </div>
      </div>
    </header>
  );
};
