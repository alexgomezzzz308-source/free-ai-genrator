import { Film, Sparkles, Video, Clapperboard, Compass } from 'lucide-react';

interface TopNavProps {
  activeTab: 'generator' | 'presets' | 'storyboard' | 'history';
  onSelectTab: (tab: 'generator' | 'presets' | 'storyboard' | 'history') => void;
  videoCount: number;
  onQuickGenerate: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  videoCount,
  onQuickGenerate,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Film className="w-4 h-4 text-white" />
          </div>
          <button
            onClick={() => onSelectTab('generator')}
            className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 text-left"
          >
            CineGen AI
          </button>
        </div>

        {/* Zone 2: Navigation Links (Single-line, unboxed) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => onSelectTab('generator')}
            className={`flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'generator'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Studio de Génération
          </button>

          <button
            onClick={() => onSelectTab('presets')}
            className={`flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'presets'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            Modèles & Presets
          </button>

          <button
            onClick={() => onSelectTab('storyboard')}
            className={`flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'storyboard'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clapperboard className="w-4 h-4" />
            Court-Métrage IA
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'history'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            Mes Vidéos {videoCount > 0 && `(${videoCount})`}
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onQuickGenerate}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-lg shadow-sm hover:shadow-cyan-500/25 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            Créer une Vidéo Gratuite
          </button>
        </div>
      </div>
    </header>
  );
};
