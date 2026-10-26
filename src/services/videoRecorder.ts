import { VideoGenerationConfig } from '../types/video';
import { videoRenderer } from './videoRenderer';
import { audioEngine } from './audioEngine';

export interface RenderProgress {
  percent: number;
  currentFrame: number;
  totalFrames: number;
  elapsedSec: number;
  status: string;
}

export class VideoRecorderService {
  private isCancelled = false;

  public cancel() {
    this.isCancelled = true;
    audioEngine.stopAll();
  }

  public getResolutionDimensions(
    aspectRatio: VideoGenerationConfig['aspectRatio'],
    resolution: VideoGenerationConfig['resolution']
  ): { width: number; height: number } {
    const is1080p = resolution === '1080p';

    switch (aspectRatio) {
      case '16:9':
        return is1080p ? { width: 1920, height: 1080 } : { width: 1280, height: 720 };
      case '9:16':
        return is1080p ? { width: 1080, height: 1920 } : { width: 720, height: 1280 };
      case '1:1':
        return is1080p ? { width: 1080, height: 1080 } : { width: 720, height: 720 };
      case '4:3':
        return is1080p ? { width: 1440, height: 1080 } : { width: 960, height: 720 };
      default:
        return { width: 1280, height: 720 };
    }
  }

  public async recordVideo(
    config: VideoGenerationConfig,
    onProgress: (prog: RenderProgress) => void
  ): Promise<{ videoUrl: string; thumbnailUrl: string; sizeBytes: number }> {
    this.isCancelled = false;
    const { width, height } = this.getResolutionDimensions(config.aspectRatio, config.resolution);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Impossible d\'initialiser le contexte 2D pour le rendu.');
    }

    // Load source image if provided
    let sourceImg: HTMLImageElement | null = null;
    if (config.sourceImage) {
      onProgress({
        percent: 5,
        currentFrame: 0,
        totalFrames: 1,
        elapsedSec: 0,
        status: 'Chargement de l\'image source...',
      });
      try {
        sourceImg = await videoRenderer.loadImage(config.sourceImage);
      } catch (e) {
        console.warn('Impossible de charger l\'image source, passage en mode procédural', e);
      }
    }

    if (this.isCancelled) throw new Error('Génération annulée.');

    // Prepare audio track
    onProgress({
      percent: 10,
      currentFrame: 0,
      totalFrames: 1,
      elapsedSec: 0,
      status: 'Synthèse de la bande sonore cinématique...',
    });

    const audioTrack = audioEngine.playSoundtrack(config.audioMood, config.duration, false);

    // Prepare canvas video stream
    const fps = 60;
    const totalFrames = Math.floor(config.duration * fps);
    const canvasStream = canvas.captureStream(fps);

    // Combine video stream with audio track if available
    const combinedStream = new MediaStream();
    canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
    if (audioTrack) {
      combinedStream.addTrack(audioTrack);
    }

    // Select supported mimeType
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    let selectedMime = 'video/webm';
    for (const m of mimeTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
        selectedMime = m;
        break;
      }
    }

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMime,
      videoBitsPerSecond: config.resolution === '1080p' ? 12000000 : 7000000,
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.start(200); // 200ms slice for stable streaming

    // Render frame 0 and take a thumbnail
    videoRenderer.renderFrame(ctx, width, height, 0.35, config, sourceImg);
    const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Real-time animation loop synchronized to target duration
    const frameIntervalMs = 1000 / fps;
    const startTime = performance.now();

    for (let frame = 0; frame < totalFrames; frame++) {
      if (this.isCancelled) {
        mediaRecorder.stop();
        audioEngine.stopAll();
        throw new Error('Génération annulée par l\'utilisateur.');
      }

      const progress = frame / totalFrames;
      videoRenderer.renderFrame(ctx, width, height, progress, config, sourceImg);

      // Report progress
      const percent = Math.min(99, Math.round(15 + progress * 80));
      const elapsedSec = (performance.now() - startTime) / 1000;
      onProgress({
        percent,
        currentFrame: frame + 1,
        totalFrames,
        elapsedSec: Math.round(elapsedSec * 10) / 10,
        status: `Génération trame ${frame + 1}/${totalFrames} (60 FPS)...`,
      });

      // Synchronize frame pacing to maintain real-time MediaRecorder capture
      const expectedTime = startTime + (frame + 1) * frameIntervalMs;
      const delay = Math.max(0, expectedTime - performance.now());
      if (delay > 0) {
        await new Promise((res) => setTimeout(res, delay));
      } else {
        // Yield thread to avoid blocking UI
        await new Promise((res) => requestAnimationFrame(res));
      }
    }

    onProgress({
      percent: 98,
      currentFrame: totalFrames,
      totalFrames,
      elapsedSec: (performance.now() - startTime) / 1000,
      status: 'Finalisation et encodage du conteneur vidéo...',
    });

    // Stop recording and wait for final blob
    const result = await new Promise<{ videoUrl: string; thumbnailUrl: string; sizeBytes: number }>(
      (resolve) => {
        mediaRecorder.onstop = () => {
          audioEngine.stopAll();
          const videoBlob = new Blob(recordedChunks, { type: selectedMime });
          const videoUrl = URL.createObjectURL(videoBlob);
          resolve({
            videoUrl,
            thumbnailUrl,
            sizeBytes: videoBlob.size,
          });
        };
        mediaRecorder.stop();
      }
    );

    onProgress({
      percent: 100,
      currentFrame: totalFrames,
      totalFrames,
      elapsedSec: (performance.now() - startTime) / 1000,
      status: 'Vidéo générée avec succès !',
    });

    return result;
  }
}

export const videoRecorderService = new VideoRecorderService();
