export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3';

export type VideoStyle =
  | 'cinematic'
  | 'cyberpunk'
  | 'nature'
  | 'anime'
  | 'space'
  | 'quantum'
  | 'ocean'
  | 'vintage';

export type CameraMotion =
  | 'dolly_in'
  | 'dolly_out'
  | 'pan_right'
  | 'pan_left'
  | 'tilt_up'
  | 'tilt_down'
  | 'orbit'
  | 'handheld'
  | 'hyperlapse';

export type AtmosphereFx =
  | 'none'
  | 'embers'
  | 'rain'
  | 'sakura'
  | 'stardust'
  | 'fog'
  | 'lens_flare';

export type AudioMood =
  | 'epic_synth'
  | 'cyber_pulse'
  | 'cosmic_drone'
  | 'nature_whisper'
  | 'dramatic_tension'
  | 'lofi_chill'
  | 'mute';

export type Resolution = '720p' | '1080p';

export interface VideoGenerationConfig {
  prompt: string;
  style: VideoStyle;
  cameraMotion: CameraMotion;
  atmosphereFx: AtmosphereFx;
  audioMood: AudioMood;
  aspectRatio: AspectRatio;
  duration: number; // in seconds (3 - 15)
  resolution: Resolution;
  motionIntensity: number; // 1 to 5
  subtitle?: string;
  sourceImage?: string; // base64 or URL for image-to-video
}

export interface GeneratedVideo {
  id: string;
  title: string;
  prompt: string;
  style: VideoStyle;
  cameraMotion: CameraMotion;
  aspectRatio: AspectRatio;
  duration: number;
  resolution: Resolution;
  videoUrl: string;
  thumbnailUrl: string;
  createdAt: number;
  sizeBytes?: number;
  sourceType: 'text-to-video' | 'image-to-video' | 'storyboard';
}

export interface StoryboardScene {
  id: string;
  title: string;
  description: string;
  cameraMotion: CameraMotion;
  duration: number;
  audioMood: AudioMood;
  subtitle: string;
  style: VideoStyle;
  generatedVideoUrl?: string;
}

export interface StoryboardProject {
  title: string;
  synopsis: string;
  scenes: StoryboardScene[];
}

export interface PresetTemplate {
  id: string;
  title: string;
  category: string;
  prompt: string;
  style: VideoStyle;
  cameraMotion: CameraMotion;
  atmosphereFx: AtmosphereFx;
  audioMood: AudioMood;
  aspectRatio: AspectRatio;
  duration: number;
  previewImage: string;
}
