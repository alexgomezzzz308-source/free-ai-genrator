import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Copy,
  Check,
  Film,
  Sparkles,
  Sliders,
  AlertCircle,
  XCircle,
  Share2,
  Link2,
  Send,
  ExternalLink,
  X,
} from 'lucide-react';
import { GeneratedVideo, AspectRatio } from '../types/video';
import { RenderProgress } from '../services/videoRecorder';

interface VideoPlayerProps {
  currentVideo: GeneratedVideo | null;
  isRendering: boolean;
  renderProgress: RenderProgress | null;
  onCancelRender: () => void;
  aspectRatio: AspectRatio;
  onRemixPrompt?: (prompt: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  currentVideo,
  isRendering,
  renderProgress,
  onCancelRender,
  aspectRatio,
  onRemixPrompt,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  const getShareUrl = () => {
    if (!currentVideo) return '';
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set('v', currentVideo.id);
    params.set('prompt', currentVideo.prompt);
    params.set('style', currentVideo.style);
    params.set('motion', currentVideo.cameraMotion);
    return `${base}?${params.toString()}`;
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (!currentVideo) return;
    const url = getShareUrl();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: currentVideo.title,
          text: `Découvrez cette vidéo générée par IA : "${currentVideo.prompt}"`,
          url,
        });
      } catch (err) {
        // Ignorer si l'utilisateur annule le menu natif
      }
    } else {
      handleCopyLink();
    }
  };

  useEffect(() => {
    if (currentVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [currentVideo?.videoUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (!duration && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTo = parseFloat(e.target.value);
    videoRef.current.currentTime = seekTo;
    setCurrentTime(seekTo);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn('Erreur plein écran:', err);
      });
    }
  };

  const handleCopyPrompt = () => {
    if (!currentVideo) return;
    navigator.clipboard.writeText(currentVideo.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;
  };

  // Determine aspect ratio class
  const getAspectClass = (ratio: AspectRatio) => {
    switch (ratio) {
      case '9:16':
        return 'aspect-[9/16] max-w-[360px] mx-auto';
      case '1:1':
        return 'aspect-square max-w-[520px] mx-auto';
      case '4:3':
        return 'aspect-[4/3] max-w-[640px] mx-auto';
      case '16:9':
      default:
        return 'aspect-video w-full';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Video Monitor */}
      <div
        ref={containerRef}
        className="relative w-full bg-[#05070d] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl flex flex-col justify-center items-center min-h-[380px] lg:min-h-[460px]"
      >
        {isRendering ? (
          /* Live Render Progress Overlay */
          <div className="absolute inset-0 z-30 bg-[#080c14]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 mb-5 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-pulse">
              <Film className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              Génération Vidéo IA en Cours
            </h3>
            <p className="text-sm text-slate-400 mb-6 max-w-md">
              {renderProgress?.status || 'Initialisation du moteur de rendu...'}
            </p>

            {/* Progress Bar */}
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-200"
                style={{ width: `${renderProgress?.percent || 5}%` }}
              />
            </div>

            <div className="flex items-center justify-between w-full max-w-md text-xs font-mono tabular-nums text-slate-400 mb-6">
              <span>{renderProgress?.percent || 0}% complété</span>
              <span>
                Trame {renderProgress?.currentFrame || 0} / {renderProgress?.totalFrames || 300} (60 fps)
              </span>
              <span>{renderProgress?.elapsedSec || 0}s</span>
            </div>

            <button
              onClick={onCancelRender}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded-lg transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              Annuler la génération
            </button>
          </div>
        ) : currentVideo ? (
          /* Real Video Output */
          <div className={`relative flex items-center justify-center w-full ${getAspectClass(currentVideo.aspectRatio)}`}>
            <video
              ref={videoRef}
              src={currentVideo.videoUrl}
              loop={isLooping}
              muted={isMuted}
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain bg-black"
            />

            {/* Floating Top Info Tag */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 text-xs text-slate-300 bg-slate-950/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="font-semibold text-cyan-400">{currentVideo.aspectRatio}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono tabular-nums">{currentVideo.duration}s</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono tabular-nums">60 FPS</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>{currentVideo.resolution}</span>
            </div>
          </div>
        ) : (
          /* Empty / Standby State */
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
            <div className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
              <Film className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">
              Écran de Prévisualisation Cinéma
            </h3>
            <p className="text-sm text-slate-400 mb-5 leading-relaxed">
              Configurez votre prompt ou sélectionnez un modèle pour synthétiser votre première vidéo IA en haute définition 60 FPS gratuitement.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Rendu 100% Gratuit</span>
              <span aria-hidden="true">·</span>
              <span>Sans watermark</span>
              <span aria-hidden="true">·</span>
              <span>Export WebM / MP4</span>
            </div>
          </div>
        )}

        {/* Bottom Playback Control Bar (only when video exists and not rendering) */}
        {currentVideo && !isRendering && (
          <div className="w-full bg-[#080c14]/95 border-t border-slate-800 px-4 py-3 flex flex-col gap-2">
            {/* Scrubber Range */}
            <div className="w-full flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={duration || currentVideo.duration}
                step={0.01}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-slate-300 text-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Lecture'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      videoRef.current.play();
                      setIsPlaying(true);
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Recommencer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleMute}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Activer le son' : 'Couper le son'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <div className="font-mono tabular-nums text-slate-400 text-xs">
                  {formatTime(currentTime)} / {formatTime(duration || currentVideo.duration)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer font-medium ${
                    isLooping ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Boucle infinie"
                >
                  Boucle
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Plein écran"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Toolbar Below Player */}
      {currentVideo && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-[#0d131f] border border-slate-800/80 rounded-xl">
          <div className="flex flex-col gap-1 min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">
              {currentVideo.title}
            </h4>
            <p className="text-xs text-slate-400 line-clamp-1">
              {currentVideo.prompt}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-800/60 rounded-lg transition-colors cursor-pointer shadow-sm"
              title="Partager cette vidéo"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              Partager
            </button>

            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copié !' : 'Copier Prompt'}
            </button>

            {onRemixPrompt && (
              <button
                onClick={() => onRemixPrompt(currentVideo.prompt)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                Remixer
              </button>
            )}

            <a
              href={currentVideo.videoUrl}
              download={`${currentVideo.title.toLowerCase().replace(/\s+/g, '_')}.webm`}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Télécharger Vidéo (.webm)
            </a>
          </div>
        </div>
      )}

      {/* Share Modal Dialog */}
      {showShareModal && currentVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-md bg-[#0c101c] border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Share2 className="w-4 h-4 text-cyan-400" />
                Partager la Création Vidéo
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video preview summary */}
            <div className="flex items-center gap-3 p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
              <div className="w-14 h-10 rounded-lg bg-black overflow-hidden shrink-0 border border-slate-800">
                <img
                  src={currentVideo.thumbnailUrl}
                  alt={currentVideo.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">
                  {currentVideo.title}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {currentVideo.duration}s · {currentVideo.aspectRatio} · {currentVideo.resolution}
                </span>
              </div>
            </div>

            {/* Direct Link Copy */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Lien direct vers la vidéo</span>
                {linkCopied && (
                  <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Lien copié !
                  </span>
                )}
              </label>

              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-[#080c14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono overflow-hidden">
                  <Link2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{getShareUrl()}</span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {linkCopied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>

            {/* Social Share Grid */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-300">
                Partager sur les réseaux sociaux
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* X / Twitter */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Regardez cette vidéo générée par IA : "${currentVideo.title}"\n#CineGenAI #VideoAI`)}&url=${encodeURIComponent(getShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-center gap-1"
                >
                  <span className="text-xs font-bold">X (Twitter)</span>
                  <span className="text-[10px] text-slate-500">Poster un tweet</span>
                </a>

                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Vidéo IA CineGen : "${currentVideo.title}"\n${getShareUrl()}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-center gap-1"
                >
                  <span className="text-xs font-bold text-emerald-400">WhatsApp</span>
                  <span className="text-[10px] text-slate-500">Envoyer un message</span>
                </a>

                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(`Vidéo IA : ${currentVideo.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-center gap-1"
                >
                  <span className="text-xs font-bold text-sky-400">Telegram</span>
                  <span className="text-[10px] text-slate-500">Partager sur canal</span>
                </a>

                {/* Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(`Vidéo IA : ${currentVideo.title}`)}&body=${encodeURIComponent(`Bonjour,\n\nVoici une vidéo IA générée avec CineGen AI :\n"${currentVideo.prompt}"\n\nRegardez-la ici : ${getShareUrl()}`)}`}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-center gap-1"
                >
                  <span className="text-xs font-bold text-amber-400">E-mail</span>
                  <span className="text-[10px] text-slate-500">Envoyer par mail</span>
                </a>
              </div>
            </div>

            {/* Native Share button */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="w-full py-2.5 px-4 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                Ouvrir le menu de partage de l'appareil
              </button>
            )}

            {/* Footer close */}
            <div className="pt-2 border-t border-slate-800/80 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
