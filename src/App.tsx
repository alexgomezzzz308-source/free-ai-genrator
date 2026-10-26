import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { VideoPlayer } from './components/VideoPlayer';
import { PromptEditor } from './components/PromptEditor';
import { PresetGallery } from './components/PresetGallery';
import { StoryboardModal } from './components/StoryboardModal';
import { HistoryGallery } from './components/HistoryGallery';
import {
  VideoGenerationConfig,
  GeneratedVideo,
  PresetTemplate,
  StoryboardScene,
} from './types/video';
import { videoRecorderService, RenderProgress } from './services/videoRecorder';
import { storageService, DEFAULT_PRESETS } from './services/storageService';
import { Sparkles, CheckCircle, AlertCircle, Film, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'presets' | 'storyboard' | 'history'>('generator');

  // Video Config
  const [config, setConfig] = useState<VideoGenerationConfig>({
    prompt: 'Mégalopole futuriste sous une pluie battante avec véhicules volants, reflets néons sur l\'asphalte mouillé et enseignes holographiques géantes',
    style: 'cyberpunk',
    cameraMotion: 'dolly_in',
    atmosphereFx: 'rain',
    audioMood: 'cyber_pulse',
    aspectRatio: '16:9',
    duration: 5,
    resolution: '720p',
    motionIntensity: 3,
    subtitle: 'Néo-Tokyo · 2099',
    sourceImage: '/src/assets/images/cyberpunk_neon_city_1793051405595.jpg',
  });

  // Current Video and History
  const [currentVideo, setCurrentVideo] = useState<GeneratedVideo | null>(null);
  const [videoList, setVideoList] = useState<GeneratedVideo[]>([]);

  // Rendering State
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load saved videos and check URL parameters on mount
  useEffect(() => {
    const saved = storageService.getVideos();
    setVideoList(saved);

    // Check shared URL parameters
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sharedVidId = params.get('v');
      const sharedPrompt = params.get('prompt');
      const sharedStyle = params.get('style');
      const sharedMotion = params.get('motion');

      if (sharedVidId) {
        const found = saved.find((v) => v.id === sharedVidId);
        if (found) {
          setCurrentVideo(found);
          showToast(`Vidéo partagée "${found.title}" chargée.`);
        }
      } else if (saved.length > 0) {
        setCurrentVideo(saved[0]);
      }

      if (sharedPrompt) {
        setConfig((prev) => ({
          ...prev,
          prompt: sharedPrompt,
          style: (sharedStyle as any) || prev.style,
          cameraMotion: (sharedMotion as any) || prev.cameraMotion,
        }));
      }
    } else if (saved.length > 0) {
      setCurrentVideo(saved[0]);
    }
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Main generation handler
  const handleGenerate = async (customConfig?: VideoGenerationConfig, titleOverride?: string) => {
    const activeConfig = customConfig || config;
    if (!activeConfig.prompt.trim()) {
      showToast('Veuillez renseigner un prompt de description visuelle.', 'error');
      return;
    }

    setIsRendering(true);
    setRenderProgress({
      percent: 0,
      currentFrame: 0,
      totalFrames: activeConfig.duration * 60,
      elapsedSec: 0,
      status: 'Initialisation des shaders et du moteur cinématique...',
    });

    try {
      const result = await videoRecorderService.recordVideo(activeConfig, (prog) => {
        setRenderProgress(prog);
      });

      const newVideo: GeneratedVideo = {
        id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: titleOverride || activeConfig.prompt.slice(0, 32).trim() + '...',
        prompt: activeConfig.prompt,
        style: activeConfig.style,
        cameraMotion: activeConfig.cameraMotion,
        aspectRatio: activeConfig.aspectRatio,
        duration: activeConfig.duration,
        resolution: activeConfig.resolution,
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        createdAt: Date.now(),
        sizeBytes: result.sizeBytes,
        sourceType: activeConfig.sourceImage ? 'image-to-video' : 'text-to-video',
      };

      storageService.saveVideo(newVideo);
      setCurrentVideo(newVideo);
      setVideoList((prev) => [newVideo, ...prev.filter((v) => v.id !== newVideo.id)]);
      setActiveTab('generator');
      showToast('Vidéo générée avec succès ! Vous pouvez la visionner et la télécharger.');

      // Scroll to video monitor
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Erreur génération vidéo:', err);
      if (err.message?.includes('annulée')) {
        showToast('Génération vidéo annulée.', 'error');
      } else {
        showToast(err.message || 'Erreur lors de la génération de la vidéo.', 'error');
      }
    } finally {
      setIsRendering(false);
      setRenderProgress(null);
    }
  };

  const handleCancelRender = () => {
    videoRecorderService.cancel();
    setIsRendering(false);
    setRenderProgress(null);
  };

  const handleSelectPreset = (preset: PresetTemplate, autoRender = false) => {
    const updated: VideoGenerationConfig = {
      ...config,
      prompt: preset.prompt,
      style: preset.style,
      cameraMotion: preset.cameraMotion,
      atmosphereFx: preset.atmosphereFx,
      audioMood: preset.audioMood,
      aspectRatio: preset.aspectRatio,
      duration: preset.duration,
      sourceImage: preset.previewImage,
    };
    setConfig(updated);
    setActiveTab('generator');

    if (autoRender) {
      handleGenerate(updated, preset.title);
    } else {
      showToast(`Modèle "${preset.title}" appliqué dans le studio.`);
    }
  };

  const handleGenerateStoryboardScene = (scene: StoryboardScene) => {
    const sceneConfig: VideoGenerationConfig = {
      ...config,
      prompt: scene.description,
      style: scene.style,
      cameraMotion: scene.cameraMotion,
      duration: scene.duration,
      audioMood: scene.audioMood,
      subtitle: scene.subtitle,
      sourceImage: undefined,
    };
    setConfig(sceneConfig);
    handleGenerate(sceneConfig, scene.title);
  };

  const handleDeleteVideo = (id: string) => {
    storageService.deleteVideo(id);
    const updated = videoList.filter((v) => v.id !== id);
    setVideoList(updated);
    if (currentVideo?.id === id) {
      setCurrentVideo(updated[0] || null);
    }
    showToast('Vidéo supprimée de votre historique.');
  };

  const handleClearAllVideos = () => {
    if (window.confirm('Voulez-vous vraiment effacer toutes vos vidéos générées ?')) {
      storageService.clearAll();
      setVideoList([]);
      setCurrentVideo(null);
      showToast('Historique effacé.');
    }
  };

  const handleRemixPrompt = (prompt: string) => {
    setConfig((prev) => ({ ...prev, prompt }));
    setActiveTab('generator');
    showToast('Prompt chargé dans l\'éditeur pour remix.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-medium text-slate-200">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navigation */}
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        videoCount={videoList.length}
        onQuickGenerate={() => handleGenerate()}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Sub-header Hero Kicker & Features Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>GÉNÉRATEUR VIDÉO IA HAUTE DÉFINITION · 60 FPS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Créez des Vidéos Cinématiques par IA Gratuitement
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Transformez vos idées de texte ou vos images en vidéos animées avec mouvements de caméra immersifs, particules atmosphériques et bandes sonores synchronisées.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0 bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="font-semibold text-white">100% Gratuit & Illimité</span>
              <span className="text-[11px] text-slate-500">Sans abonnement · Export direct WebM</span>
            </div>
          </div>
        </div>

        {/* Tab 1: Studio Generator */}
        {activeTab === 'generator' && (
          <div className="flex flex-col gap-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (Video Monitor & Controls): 7 cols */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <VideoPlayer
                  currentVideo={currentVideo}
                  isRendering={isRendering}
                  renderProgress={renderProgress}
                  onCancelRender={handleCancelRender}
                  aspectRatio={config.aspectRatio}
                  onRemixPrompt={handleRemixPrompt}
                />
              </div>

              {/* Right Column (Studio Console): 5 cols */}
              <div className="lg:col-span-5">
                <PromptEditor
                  config={config}
                  onChangeConfig={setConfig}
                  onGenerate={() => handleGenerate()}
                  isRendering={isRendering}
                />
              </div>
            </div>

            {/* Quick Inspiration Presets Strip Below */}
            <div className="flex flex-col gap-4 pt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-cyan-400" />
                  Inspirations Cinématiques Rapides
                </h3>
                <button
                  onClick={() => setActiveTab('presets')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
                >
                  Voir tous les modèles →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {DEFAULT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset, false)}
                    className="group flex flex-col text-left bg-[#0c101c] border border-slate-800 hover:border-cyan-500/50 rounded-xl overflow-hidden transition-all cursor-pointer"
                  >
                    <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                      <img
                        src={preset.previewImage}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <span className="absolute bottom-2 left-2 text-[10px] text-white font-medium bg-black/50 px-1.5 py-0.5 rounded">
                        {preset.category}
                      </span>
                    </div>
                    <div className="p-2.5">
                      <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {preset.title}
                      </span>
                      <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {preset.prompt}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Presets Catalog */}
        {activeTab === 'presets' && (
          <PresetGallery onSelectPreset={handleSelectPreset} />
        )}

        {/* Tab 3: Storyboard / Short Film Director */}
        {activeTab === 'storyboard' && (
          <StoryboardModal
            onGenerateScene={handleGenerateStoryboardScene}
            isRendering={isRendering}
          />
        )}

        {/* Tab 4: History / My Videos */}
        {activeTab === 'history' && (
          <HistoryGallery
            videos={videoList}
            onSelectVideo={(vid) => {
              setCurrentVideo(vid);
              setActiveTab('generator');
            }}
            onDeleteVideo={handleDeleteVideo}
            onClearAll={handleClearAllVideos}
            onGoToGenerator={() => setActiveTab('generator')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-[#060910] py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            CineGen AI · Studio Vidéo IA Haute Définition Gratuit
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Rendu WebCodecs & Canvas 60 FPS</span>
            <span aria-hidden="true">·</span>
            <span>Sans filigrane</span>
            <span aria-hidden="true">·</span>
            <span>Export WebM & MP4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
