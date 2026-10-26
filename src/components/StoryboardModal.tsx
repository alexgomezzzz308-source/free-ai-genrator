import React, { useState } from 'react';
import {
  Clapperboard,
  Sparkles,
  Play,
  Film,
  Plus,
  Trash2,
  Clock,
  Camera,
  Layers,
  Wand2,
} from 'lucide-react';
import { StoryboardProject, StoryboardScene, CameraMotion, VideoStyle, AudioMood } from '../types/video';

interface StoryboardModalProps {
  onGenerateScene: (scene: StoryboardScene) => void;
  isRendering: boolean;
}

const DEFAULT_THEMES = [
  'Une sonde spatiale découvre une mégastructure extraterrestre vivante',
  'Un samurai solitaire traversant Tokyo sous une pluie de néons cyberpunk',
  'Le réveil millénaire d\'une créature luminescente dans les abysses',
  'Un voyageur temporel arrivant dans une forêt préhistorique embrumée',
];

export const StoryboardModal: React.FC<StoryboardModalProps> = ({
  onGenerateScene,
  isRendering,
}) => {
  const [themeInput, setThemeInput] = useState<string>(
    'Une expédition spatiale atterrit sur une planète aux arbres de cristal violet'
  );
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [project, setProject] = useState<StoryboardProject>({
    title: 'Planète de Cristal',
    synopsis: 'L\'exploration d\'un monde extraterrestre aux forêts bioluminescentes.',
    scenes: [
      {
        id: 'scene-1',
        title: 'Plan d\'Établissement',
        description: 'La navette spatiale descend à travers les nuages pourpres d\'une exoplanète inconnue, révélant une canopée scintillante.',
        cameraMotion: 'dolly_in',
        duration: 4,
        audioMood: 'cosmic_drone',
        subtitle: 'Année 2184 · Exoplanète Kepler-452c',
        style: 'space',
      },
      {
        id: 'scene-2',
        title: 'Exploration au Sol',
        description: 'Gros plan sur les cristaux violacés vibrant d\'une lumière pulsante tandis que des spores lumineuses s\'élèvent dans l\'air.',
        cameraMotion: 'orbit',
        duration: 4,
        audioMood: 'cyber_pulse',
        subtitle: 'Une résonance organique inconnue...',
        style: 'quantum',
      },
      {
        id: 'scene-3',
        title: 'Révélation Finale',
        description: 'Travelling majestueux révélant une cité entière sculptée dans le quartz géant, baignée par la lueur de deux soleils dorés.',
        cameraMotion: 'pan_right',
        duration: 5,
        audioMood: 'epic_synth',
        subtitle: 'La cité des pionniers oubliés.',
        style: 'cinematic',
      },
    ],
  });

  const handleGenerateScript = async () => {
    if (!themeInput.trim()) return;
    setIsGeneratingScript(true);
    try {
      const res = await fetch('/api/ai/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: themeInput, sceneCount: 3 }),
      });
      const data = await res.json();
      if (data && data.scenes) {
        setProject({
          title: data.title || themeInput,
          synopsis: data.synopsis || 'Scénario cinématique généré par IA.',
          scenes: data.scenes.map((s: any, idx: number) => ({
            id: s.id || `scene-${idx + 1}`,
            title: s.title || `Scène ${idx + 1}`,
            description: s.description || '',
            cameraMotion: (s.cameraMotion as CameraMotion) || 'dolly_in',
            duration: s.duration || 4,
            audioMood: (s.audioMood as AudioMood) || 'epic_synth',
            subtitle: s.subtitle || '',
            style: idx === 0 ? 'space' : idx === 1 ? 'quantum' : 'cinematic',
          })),
        });
      }
    } catch (e) {
      console.error('Erreur génération scénario', e);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const updateScene = (idx: number, patch: Partial<StoryboardScene>) => {
    const updated = [...project.scenes];
    updated[idx] = { ...updated[idx], ...patch };
    setProject({ ...project, scenes: updated });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-cyan-400" />
            Réalisateur IA · Court-Métrage Multi-Plans
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Générez une séquence narrative complète de plans cinématiques articulés autour de votre histoire.
          </p>
        </div>
      </div>

      {/* Idea / Script Prompt Box */}
      <div className="p-5 bg-[#0c101c] border border-slate-800/80 rounded-2xl flex flex-col gap-3">
        <label htmlFor="theme-prompt" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
          Idée Principale ou Synopsis
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="theme-prompt"
            type="text"
            value={themeInput}
            onChange={(e) => setThemeInput(e.target.value)}
            placeholder="Ex : Une expédition sous la glace d'Europe découvre un temple sous-marin..."
            className="flex-1 bg-[#080c14] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            onClick={handleGenerateScript}
            disabled={isGeneratingScript || !themeInput.trim()}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            {isGeneratingScript ? 'Écriture du Scénario...' : 'Générer le Storyboard IA'}
          </button>
        </div>

        {/* Quick theme suggestions */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[11px] text-slate-500">Suggestions :</span>
          {DEFAULT_THEMES.map((theme, i) => (
            <button
              key={i}
              onClick={() => setThemeInput(theme)}
              className="text-[11px] text-slate-400 hover:text-cyan-300 bg-slate-900/60 hover:bg-slate-800 px-2.5 py-1 rounded-md transition-colors cursor-pointer border border-slate-800/60"
            >
              {theme.length > 40 ? `${theme.substring(0, 40)}...` : theme}
            </button>
          ))}
        </div>
      </div>

      {/* Script Summary */}
      <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-white">{project.title}</span>
          <span className="text-xs text-slate-400">{project.synopsis}</span>
        </div>
        <div className="text-xs font-mono text-cyan-400 tabular-nums">
          {project.scenes.length} plans · {project.scenes.reduce((acc, s) => acc + s.duration, 0)}s total
        </div>
      </div>

      {/* Scene Cards Sequence */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {project.scenes.map((scene, idx) => (
          <div
            key={scene.id}
            className="flex flex-col justify-between p-4 bg-[#0c101c] border border-slate-800 hover:border-slate-700 rounded-xl gap-3 transition-colors"
          >
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" />
                  Plan 0{idx + 1}
                </span>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {scene.duration}s · {scene.cameraMotion.replace('_', ' ')}
                </span>
              </div>

              <input
                type="text"
                value={scene.title}
                onChange={(e) => updateScene(idx, { title: e.target.value })}
                className="text-xs font-semibold text-white bg-transparent border-b border-slate-800 focus:border-cyan-500 pb-1 outline-none"
              />

              <textarea
                value={scene.description}
                onChange={(e) => updateScene(idx, { description: e.target.value })}
                rows={3}
                className="text-xs text-slate-300 bg-[#080c14] p-2 rounded-lg border border-slate-800 focus:border-cyan-500 outline-none resize-none leading-relaxed"
                placeholder="Description du plan..."
              />

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-medium">Sous-titre narratif :</span>
                <input
                  type="text"
                  value={scene.subtitle}
                  onChange={(e) => updateScene(idx, { subtitle: e.target.value })}
                  className="text-xs text-slate-300 bg-[#080c14] px-2 py-1 rounded border border-slate-800 focus:border-cyan-500 outline-none italic"
                  placeholder="Sous-titre..."
                />
              </div>
            </div>

            <button
              onClick={() => onGenerateScene(scene)}
              disabled={isRendering}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              Générer ce Plan ({scene.duration}s)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
