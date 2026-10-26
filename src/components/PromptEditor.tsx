import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Camera,
  Layers,
  Music,
  Maximize,
  Clock,
  Gauge,
  Film,
  Upload,
  Image as ImageIcon,
  Check,
  Type,
  Wand2,
  X,
  Volume2,
} from 'lucide-react';
import {
  VideoGenerationConfig,
  VideoStyle,
  CameraMotion,
  AtmosphereFx,
  AudioMood,
  AspectRatio,
  Resolution,
} from '../types/video';

interface PromptEditorProps {
  config: VideoGenerationConfig;
  onChangeConfig: (newConfig: VideoGenerationConfig) => void;
  onGenerate: () => void;
  isRendering: boolean;
}

const STYLES: Array<{ id: VideoStyle; label: string; desc: string }> = [
  { id: 'cinematic', label: 'Cinématique', desc: 'Éclairage dramatique, optique anamorphique' },
  { id: 'cyberpunk', label: 'Cyberpunk', desc: 'Néons vifs, reflets de pluie, cité nocturne' },
  { id: 'space', label: 'Cosmique', desc: 'Galaxies spirales, supernovas et nébuleuses' },
  { id: 'nature', label: 'Documentaire', desc: 'Heure dorée, faune et flore réalistes' },
  { id: 'anime', label: 'Anime 2D', desc: 'Couleurs pastel, pétales sakura, poésie' },
  { id: 'quantum', label: 'Quantique', desc: 'Hologrammes, lasers et géométrie sacrée' },
  { id: 'ocean', label: 'Abysses', desc: 'Bioluminescence marine et caustiques' },
  { id: 'vintage', label: 'Rétro 35mm', desc: 'Grain argentique, sépia, pellicule vintage' },
];

const MOTIONS: Array<{ id: CameraMotion; label: string }> = [
  { id: 'dolly_in', label: 'Dolly In (Zoom avant)' },
  { id: 'dolly_out', label: 'Dolly Out (Zoom arrière)' },
  { id: 'pan_right', label: 'Panoramique Droite' },
  { id: 'pan_left', label: 'Panoramique Gauche' },
  { id: 'tilt_up', label: 'Travelling Haut' },
  { id: 'tilt_down', label: 'Travelling Bas' },
  { id: 'orbit', label: 'Orbite 360°' },
  { id: 'handheld', label: 'Caméra Épaule' },
  { id: 'hyperlapse', label: 'Hyperlapse' },
];

const ATMOSPHERES: Array<{ id: AtmosphereFx; label: string }> = [
  { id: 'none', label: 'Aucune' },
  { id: 'rain', label: 'Pluie & Reflets' },
  { id: 'embers', label: 'Braises de Feu' },
  { id: 'sakura', label: 'Pétales Sakura' },
  { id: 'stardust', label: 'Poussière Stellaire' },
  { id: 'fog', label: 'Brume Volumétrique' },
];

const AUDIO_MOODS: Array<{ id: AudioMood; label: string }> = [
  { id: 'epic_synth', label: 'Synthwave Épique' },
  { id: 'cyber_pulse', label: 'Cyber Pulse 120bpm' },
  { id: 'cosmic_drone', label: 'Drone Spatial 432Hz' },
  { id: 'nature_whisper', label: 'Atmosphère Nature' },
  { id: 'dramatic_tension', label: 'Tension Dramatique' },
  { id: 'lofi_chill', label: 'Lofi Chords' },
  { id: 'mute', label: 'Muet (Sans audio)' },
];

const SAMPLE_IMAGES = [
  {
    name: 'Cyberpunk Metropolis',
    url: '/src/assets/images/cyberpunk_neon_city_1793051405595.jpg',
  },
  {
    name: 'Cosmic Supernova',
    url: '/src/assets/images/cosmic_nebula_supernova_1793051405862.jpg',
  },
  {
    name: 'Savanna Sunset Lion',
    url: '/src/assets/images/wildlife_golden_savanna_1793051406064.jpg',
  },
  {
    name: 'Kyoto Cherry Blossom',
    url: '/src/assets/images/anime_cherry_blossom_1793051407020.jpg',
  },
];

export const PromptEditor: React.FC<PromptEditorProps> = ({
  config,
  onChangeConfig,
  onGenerate,
  isRendering,
}) => {
  const [mode, setMode] = useState<'text' | 'image'>(config.sourceImage ? 'image' : 'text');
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEnhancePrompt = async () => {
    if (!config.prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/ai/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: config.prompt,
          style: config.style,
          cameraMotion: config.cameraMotion,
        }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        onChangeConfig({ ...config, prompt: data.enhancedPrompt });
      }
    } catch (e) {
      console.error('Erreur amélioration prompt', e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onChangeConfig({
        ...config,
        sourceImage: result,
      });
      setMode('image');
    };
    reader.readAsDataURL(file);
  };

  const clearSourceImage = () => {
    onChangeConfig({
      ...config,
      sourceImage: undefined,
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#0c101c] border border-slate-800/80 rounded-2xl shadow-xl">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setMode('text');
              if (config.sourceImage) clearSourceImage();
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === 'text'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Texte vers Vidéo
          </button>
          <button
            onClick={() => setMode('image')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === 'image'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Animer une Image
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span>Rendu local instantané</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-400 font-medium">Gratuit & Illimité</span>
        </div>
      </div>

      {/* Image Upload / Selector if Image Mode */}
      {mode === 'image' && (
        <div className="flex flex-col gap-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              Image source à animer
            </span>
            {config.sourceImage && (
              <button
                onClick={clearSourceImage}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Supprimer
              </button>
            )}
          </div>

          {config.sourceImage ? (
            <div className="relative w-full h-36 rounded-lg overflow-hidden border border-slate-700 bg-black flex items-center justify-center">
              <img
                src={config.sourceImage}
                alt="Source preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                <span className="text-xs text-cyan-300 font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Image prête pour l'animation cinématique
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-900/30"
              >
                <Upload className="w-6 h-6 text-slate-500 mb-2" />
                <span className="text-xs font-semibold text-slate-300">
                  Déposez une image ou cliquez pour importer
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  JPG, PNG ou WEBP (Haute résolution recommandée)
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Sample images quick selection */}
              <div>
                <span className="text-[11px] font-medium text-slate-400 mb-2 block">
                  Ou essayez avec l'une de nos images de référence :
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {SAMPLE_IMAGES.map((sample) => (
                    <button
                      key={sample.url}
                      onClick={() => onChangeConfig({ ...config, sourceImage: sample.url })}
                      className="group relative h-16 rounded-lg overflow-hidden border border-slate-800 hover:border-cyan-400 transition-all cursor-pointer"
                      title={sample.name}
                    >
                      <img
                        src={sample.url}
                        alt={sample.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Prompt Input Area */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="video-prompt" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
            Description Visuelle / Prompt
          </label>
          <button
            onClick={handleEnhancePrompt}
            disabled={isEnhancing || !config.prompt.trim()}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isEnhancing ? 'Amélioration IA en cours...' : 'Améliorer avec l\'IA'}
          </button>
        </div>

        <textarea
          id="video-prompt"
          value={config.prompt}
          onChange={(e) => onChangeConfig({ ...config, prompt: e.target.value })}
          rows={3}
          placeholder="Décrivez votre scène avec précision : sujet, action, éclairage, ambiance..."
          className="w-full bg-[#080c14] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
        />
      </div>

      {/* Style Grid */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          Style Visuel Cinématique
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STYLES.map((st) => (
            <button
              key={st.id}
              onClick={() => onChangeConfig({ ...config, style: st.id })}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                config.style === st.id
                  ? 'bg-cyan-950/40 border-cyan-500/80 text-white shadow-sm shadow-cyan-500/10'
                  : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-semibold">{st.label}</div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{st.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Camera Motion & Atmosphere Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Camera Motion */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            Mouvement de Caméra
          </span>
          <select
            value={config.cameraMotion}
            onChange={(e) => onChangeConfig({ ...config, cameraMotion: e.target.value as CameraMotion })}
            className="w-full bg-[#080c14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
          >
            {MOTIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Atmosphere Particles */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Particules & Effets Atmosphériques
          </span>
          <select
            value={config.atmosphereFx}
            onChange={(e) => onChangeConfig({ ...config, atmosphereFx: e.target.value as AtmosphereFx })}
            className="w-full bg-[#080c14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
          >
            {ATMOSPHERES.map((atm) => (
              <option key={atm.id} value={atm.id}>
                {atm.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Soundtrack & Subtitle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Audio Soundtrack */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-cyan-400" />
            Bande Sonore Synthétisée
          </span>
          <select
            value={config.audioMood}
            onChange={(e) => onChangeConfig({ ...config, audioMood: e.target.value as AudioMood })}
            className="w-full bg-[#080c14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
          >
            {AUDIO_MOODS.map((am) => (
              <option key={am.id} value={am.id}>
                {am.label}
              </option>
            ))}
          </select>
        </div>

        {/* Optional Subtitle */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-cyan-400" />
            Sous-Titre Cinématique (Optionnel)
          </span>
          <input
            type="text"
            value={config.subtitle || ''}
            onChange={(e) => onChangeConfig({ ...config, subtitle: e.target.value })}
            placeholder="Ex : 'L'aventure ne fait que commencer...'"
            className="w-full bg-[#080c14] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Technical Controls: Format, Duration, Resolution, Intensity */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
        {/* Ratio */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-slate-400">Ratio Cadrage</span>
          <div className="grid grid-cols-2 gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            {(['16:9', '9:16', '1:1', '4:3'] as AspectRatio[]).map((r) => (
              <button
                key={r}
                onClick={() => onChangeConfig({ ...config, aspectRatio: r })}
                className={`py-1 text-[11px] font-mono font-medium rounded transition-colors cursor-pointer ${
                  config.aspectRatio === r
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-slate-400">Durée (Secondes)</span>
          <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            {[3, 5, 8].map((d) => (
              <button
                key={d}
                onClick={() => onChangeConfig({ ...config, duration: d })}
                className={`py-1 text-[11px] font-mono font-medium rounded transition-colors cursor-pointer ${
                  config.duration === d
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Resolution */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-slate-400">Résolution</span>
          <div className="grid grid-cols-2 gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            {(['720p', '1080p'] as Resolution[]).map((res) => (
              <button
                key={res}
                onClick={() => onChangeConfig({ ...config, resolution: res })}
                className={`py-1 text-[11px] font-mono font-medium rounded transition-colors cursor-pointer ${
                  config.resolution === res
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>

        {/* Intensity */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-slate-400 flex justify-between">
            <span>Dynamisme</span>
            <span className="font-mono tabular-nums text-cyan-400">{config.motionIntensity}/5</span>
          </span>
          <div className="flex items-center h-full px-1">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={config.motionIntensity}
              onChange={(e) => onChangeConfig({ ...config, motionIntensity: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Main Generate CTA */}
      <button
        onClick={onGenerate}
        disabled={isRendering || !config.prompt.trim()}
        className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer"
      >
        <Film className="w-4 h-4 text-slate-950" />
        <span>Générer la Vidéo Gratuitement (60 FPS)</span>
      </button>
    </div>
  );
};
