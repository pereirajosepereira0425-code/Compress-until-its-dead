import React from 'react';
import { COMPRESSION_PRESETS, PresetDefinition } from '../utils/compressionMath';

interface PresetSelectorProps {
  selectedPresetId: string;
  onSelectPreset: (preset: PresetDefinition) => void;
  onOpenCustomSettings: () => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
  onOpenCustomSettings,
}) => {
  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🎚️</span> Compression Destruction Modes
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a quick destruction level or fine-tune dimensions and audio resolution.
          </p>
        </div>
        <button
          onClick={onOpenCustomSettings}
          className="self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>⚙️</span>
          <span>Fine-Tune Audio & Resolution</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {COMPRESSION_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          const isExtreme =
            preset.id === 'compress-until-dead' ||
            preset.id === 'oblivion-zero' ||
            preset.id === 'demonic-worst' ||
            preset.id === 'all-ones-30db';
          const isOneBit = preset.id === 'one-bit-singularity';
          const isZeroBit = preset.id === 'zero-bit-void';
          const isMeme = preset.id === 'gumball-meme';

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`p-3.5 rounded-xl text-left transition-all border relative flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? isZeroBit
                    ? 'bg-zinc-950/90 border-white/70 shadow-md shadow-black ring-1 ring-white/40'
                    : isExtreme
                    ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/50 ring-1 ring-rose-500/50'
                    : isOneBit
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-400/50'
                    : isMeme
                    ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/50 ring-1 ring-amber-500/50'
                    : 'bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-lg shrink-0">{preset.icon}</span>
                    <span className="text-xs font-bold text-white truncate">{preset.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 ${
                      isSelected
                        ? isZeroBit
                          ? 'bg-white/15 text-white border border-white/40'
                          : isExtreme
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : isOneBit
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : isMeme
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                  {preset.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                <span>
                  {preset.settings.totalPixels !== undefined
                    ? `${preset.settings.totalPixels} px`
                    : (preset.settings.resolutionPreset || 'Original Res')}
                </span>
                <span className="font-mono text-slate-400">
                  {preset.id === 'zero-bit-void'
                    ? '⚫ 0 bits (Void)'
                    : preset.id === 'one-bit-singularity'
                    ? '⚛️ 1 bit (0/1)'
                    : preset.id === 'all-ones-30db'
                    ? '1️⃣ All=1 +30dB'
                    : preset.settings.memeAudioMode === 'gumball_meme'
                    ? '💫 Meme Audio'
                    : preset.settings.memeAudioMode === 'demonic_worst'
                    ? '👹 Demonic Audio'
                    : preset.settings.syncAudioResolution
                    ? 'Synced Audio 📉'
                    : 'Std Audio'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
