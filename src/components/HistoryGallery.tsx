import React, { useState } from 'react';
import {
  Video,
  Play,
  Download,
  Trash2,
  Calendar,
  Sparkles,
  Copy,
  Film,
  Share2,
  Check,
} from 'lucide-react';
import { GeneratedVideo } from '../types/video';

interface HistoryGalleryProps {
  videos: GeneratedVideo[];
  onSelectVideo: (video: GeneratedVideo) => void;
  onDeleteVideo: (id: string) => void;
  onClearAll: () => void;
  onGoToGenerator: () => void;
}

export const HistoryGallery: React.FC<HistoryGalleryProps> = ({
  videos,
  onSelectVideo,
  onDeleteVideo,
  onClearAll,
  onGoToGenerator,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShareVideo = (vid: GeneratedVideo) => {
    if (typeof window === 'undefined') return;
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set('v', vid.id);
    params.set('prompt', vid.prompt);
    params.set('style', vid.style);
    params.set('motion', vid.cameraMotion);
    const url = `${base}?${params.toString()}`;

    if (navigator.share) {
      navigator.share({
        title: vid.title,
        text: `Découvrez cette vidéo IA : "${vid.prompt}"`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedId(vid.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" />
            Mes Vidéos Générées
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Retrouvez, téléchargez ou rejouez l'historique complet de vos vidéos synthétisées en haute définition.
          </p>
        </div>

        {videos.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-900/60 bg-rose-950/20 hover:bg-rose-950/40 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Effacer tout l'historique
          </button>
        )}
      </div>

      {videos.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 bg-[#0c101c] border border-slate-800 rounded-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
            <Film className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5">
            Aucune vidéo générée pour le moment
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
            Vos créations vidéo apparaîtront ici automatiquement avec leur fichier de téléchargement et options de réutilisation.
          </p>
          <button
            onClick={onGoToGenerator}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 rounded-lg hover:from-cyan-300 hover:to-cyan-200 transition-all cursor-pointer"
          >
            Créer ma première vidéo
          </button>
        </div>
      ) : (
        /* Video Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="flex flex-col bg-[#0c101c] border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition-all group"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full bg-black overflow-hidden">
                <img
                  src={vid.thumbnailUrl}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-white">
                  <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 font-mono">
                    {vid.aspectRatio} · {vid.resolution}
                  </span>
                  <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 font-mono tabular-nums">
                    {vid.duration}s
                  </span>
                </div>

                {/* Play Trigger */}
                <button
                  onClick={() => onSelectVideo(vid)}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </button>
              </div>

              {/* Info & Details */}
              <div className="flex flex-col flex-1 p-4 justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white truncate">
                      {vid.title}
                    </h3>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3" />
                      {formatDate(vid.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {vid.prompt}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                  <button
                    onClick={() => onSelectVideo(vid)}
                    className="flex-1 py-1.5 px-3 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Lire
                  </button>

                  <button
                    onClick={() => handleShareVideo(vid)}
                    className="p-2 text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/50 rounded-lg transition-colors cursor-pointer"
                    title={copiedId === vid.id ? 'Lien copié !' : 'Partager la vidéo'}
                  >
                    {copiedId === vid.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  </button>

                  <a
                    href={vid.videoUrl}
                    download={`${vid.title.toLowerCase().replace(/\s+/g, '_')}.webm`}
                    className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Télécharger la vidéo (.webm)"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => onDeleteVideo(vid.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
