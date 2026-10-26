import React from 'react';
import { Play, Sparkles, Wand2, Compass } from 'lucide-react';
import { PresetTemplate } from '../types/video';
import { DEFAULT_PRESETS } from '../services/storageService';

interface PresetGalleryProps {
  onSelectPreset: (preset: PresetTemplate, autoRender?: boolean) => void;
}

export const PresetGallery: React.FC<PresetGalleryProps> = ({ onSelectPreset }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            Modèles & Inspirations de Vidéos IA
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Sélectionnez un modèle pré-optimisé pour explorer les capacités cinématiques ou générer en un clic.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          <span className="font-semibold text-cyan-400">{DEFAULT_PRESETS.length}</span> modèles prêts à l'emploi
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {DEFAULT_PRESETS.map((preset) => (
          <div
            key={preset.id}
            className="group flex flex-col bg-[#0c101c] border border-slate-800 hover:border-cyan-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10"
          >
            {/* Image Preview Container */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
              <img
                src={preset.previewImage}
                alt={preset.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Category chip and duration */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-white">
                <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                  {preset.category}
                </span>
                <span className="font-mono tabular-nums bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                  {preset.duration}s · 60fps
                </span>
              </div>

              {/* Quick Play Trigger Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <button
                  onClick={() => onSelectPreset(preset, true)}
                  className="w-12 h-12 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform cursor-pointer hover:bg-cyan-300"
                  title="Générer immédiatement"
                >
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </button>
              </div>
            </div>

            {/* Content Details */}
            <div className="flex flex-col flex-1 p-4 justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {preset.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {preset.prompt}
                </p>
              </div>

              {/* Metadata row */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                <span className="capitalize">{preset.style}</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{preset.cameraMotion.replace('_', ' ')}</span>
                <span aria-hidden="true">·</span>
                <span>{preset.aspectRatio}</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => onSelectPreset(preset, false)}
                  className="py-2 px-3 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Wand2 className="w-3 h-3 text-cyan-400" />
                  Modifier
                </button>

                <button
                  onClick={() => onSelectPreset(preset, true)}
                  className="py-2 px-3 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors text-center cursor-pointer flex items-center justify-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Générer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
