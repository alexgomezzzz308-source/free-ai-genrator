import { GeneratedVideo, PresetTemplate } from '../types/video';

const STORAGE_KEY = 'cinegen_generated_videos_v1';

export const DEFAULT_PRESETS: PresetTemplate[] = [
  {
    id: 'preset-cyberpunk',
    title: 'Néo-Tokyo 2099',
    category: 'Cyberpunk & Sci-Fi',
    prompt: 'Mégalopole futuriste sous une pluie battante avec véhicules volants, reflets néons sur l\'asphalte mouillé et enseignes holographiques géantes',
    style: 'cyberpunk',
    cameraMotion: 'dolly_in',
    atmosphereFx: 'rain',
    audioMood: 'cyber_pulse',
    aspectRatio: '16:9',
    duration: 5,
    previewImage: '/src/assets/images/cyberpunk_neon_city_1793051405595.jpg',
  },
  {
    id: 'preset-cosmic',
    title: 'Supernova & Nébuleuse Cosmique',
    category: 'Espace & Astronomie',
    prompt: 'Explosion cosmique au cœur d\'une nébuleuse interstellaire, poussière d\'étoiles en rotation spirale et énergie galactique luminescente',
    style: 'space',
    cameraMotion: 'orbit',
    atmosphereFx: 'stardust',
    audioMood: 'cosmic_drone',
    aspectRatio: '16:9',
    duration: 5,
    previewImage: '/src/assets/images/cosmic_nebula_supernova_1793051405862.jpg',
  },
  {
    id: 'preset-wildlife',
    title: 'Roi de la Savane au Crépuscule',
    category: 'Nature & Documentaire',
    prompt: 'Lion majestueux trônant sur un rocher dans la savane africaine dorée, rayons du soleil couchant et herbes sauvages ondulant au vent',
    style: 'nature',
    cameraMotion: 'pan_right',
    atmosphereFx: 'fog',
    audioMood: 'epic_synth',
    aspectRatio: '16:9',
    duration: 5,
    previewImage: '/src/assets/images/wildlife_golden_savanna_1793051406064.jpg',
  },
  {
    id: 'preset-anime',
    title: 'Allée aux Cerisiers de Kyoto',
    category: 'Anime & Manga',
    prompt: 'Rue japonaise traditionnelle bordée de cerisiers en fleurs sakura tombant doucement dans la lumière rose d\'un coucher de soleil poétique',
    style: 'anime',
    cameraMotion: 'tilt_up',
    atmosphereFx: 'sakura',
    audioMood: 'lofi_chill',
    aspectRatio: '16:9',
    duration: 5,
    previewImage: '/src/assets/images/anime_cherry_blossom_1793051407020.jpg',
  },
];

export class StorageService {
  public getVideos(): GeneratedVideo[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error('Erreur lecture vidéos sauvegardées', e);
      return [];
    }
  }

  public saveVideo(video: GeneratedVideo): void {
    try {
      const list = this.getVideos();
      // Keep most recent first, max 25 to avoid local storage overflow
      const updated = [video, ...list.filter((v) => v.id !== video.id)].slice(0, 25);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Erreur sauvegarde vidéo', e);
    }
  }

  public deleteVideo(id: string): void {
    try {
      const list = this.getVideos();
      const updated = list.filter((v) => v.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Erreur suppression vidéo', e);
    }
  }

  public clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const storageService = new StorageService();
