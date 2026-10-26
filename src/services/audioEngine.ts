import { AudioMood } from '../types/video';

export class CinematicAudioEngine {
  private ctx: AudioContext | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private activeNodes: Array<{ stop?: () => void; disconnect: () => void }> = [];

  constructor() {
    // AudioContext will be initialized on user gesture or render start
  }

  private initContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getAudioStreamDestination(): MediaStreamAudioDestinationNode {
    const ctx = this.initContext();
    if (!this.destinationNode) {
      this.destinationNode = ctx.createMediaStreamDestination();
    }
    return this.destinationNode;
  }

  public playSoundtrack(mood: AudioMood, durationSec: number, alsoPlayToSpeakers = false): MediaStreamTrack | null {
    if (mood === 'mute') return null;

    const ctx = this.initContext();
    const dest = this.getAudioStreamDestination();
    this.stopAll();

    // Master bus
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    // Smooth cinematic fade in
    masterGain.gain.exponentialRampToValueAtTime(0.45, ctx.currentTime + 1.2);
    // Smooth fade out at end
    masterGain.gain.setValueAtTime(0.45, ctx.currentTime + Math.max(1, durationSec - 1.5));
    masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

    masterGain.connect(dest);
    if (alsoPlayToSpeakers) {
      masterGain.connect(ctx.destination);
    }

    const now = ctx.currentTime;

    switch (mood) {
      case 'epic_synth':
        this.generateEpicSynth(ctx, masterGain, now, durationSec);
        break;
      case 'cyber_pulse':
        this.generateCyberPulse(ctx, masterGain, now, durationSec);
        break;
      case 'cosmic_drone':
        this.generateCosmicDrone(ctx, masterGain, now, durationSec);
        break;
      case 'nature_whisper':
        this.generateNatureWhisper(ctx, masterGain, now, durationSec);
        break;
      case 'dramatic_tension':
        this.generateDramaticTension(ctx, masterGain, now, durationSec);
        break;
      case 'lofi_chill':
        this.generateLofiChill(ctx, masterGain, now, durationSec);
        break;
      default:
        this.generateCosmicDrone(ctx, masterGain, now, durationSec);
        break;
    }

    return dest.stream.getAudioTracks()[0] || null;
  }

  private generateEpicSynth(ctx: AudioContext, output: AudioNode, start: number, duration: number) {
    // Root base drone (D minor: 73.4Hz - D2)
    const baseFreqs = [73.4, 110.0, 146.8, 220.0];
    baseFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, start);
      filter.frequency.exponentialRampToValueAtTime(1400, start + duration * 0.7);
      filter.frequency.exponentialRampToValueAtTime(400, start + duration);

      gain.gain.setValueAtTime(0.2 / baseFreqs.length, start);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(output);

      osc.start(start);
      osc.stop(start + duration);
      this.activeNodes.push(osc);
    });

    // Sub rumble
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(45, start);
    subGain.gain.setValueAtTime(0.35, start);
    sub.connect(subGain);
    subGain.connect(output);
    sub.start(start);
    sub.stop(start + duration);
    this.activeNodes.push(sub);
  }

  private generateCyberPulse(ctx: AudioContext, output: AudioNode, start: number, duration: number) {
    // 120 BPM pulse (every 0.5s)
    const interval = 0.5;
    const pulseCount = Math.floor(duration / interval);

    for (let i = 0; i < pulseCount; i++) {
      const pulseTime = start + i * interval;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(i % 2 === 0 ? 65.4 : 98.0, pulseTime);
      osc.frequency.exponentialRampToValueAtTime(30, pulseTime + 0.3);

      gain.gain.setValueAtTime(0.28, pulseTime);
      gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.35);

      osc.connect(gain);
      gain.connect(output);

      osc.start(pulseTime);
      osc.stop(pulseTime + 0.4);
      this.activeNodes.push(osc);
    }

    // High tech arpeggio
    const arpNotes = [261.6, 329.6, 392.0, 523.2];
    const arpInterval = 0.25;
    const arpCount = Math.floor(duration / arpInterval);
    for (let i = 0; i < arpCount; i++) {
      const noteTime = start + i * arpInterval;
      const note = arpNotes[i % arpNotes.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, noteTime);

      gain.gain.setValueAtTime(0.08, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);

      osc.connect(gain);
      gain.connect(output);

      osc.start(noteTime);
      osc.stop(noteTime + 0.22);
      this.activeNodes.push(osc);
    }
  }

  private generateCosmicDrone(ctx: AudioContext, output: AudioNode, start: number, duration: number) {
    // Rich detuned pad: 55Hz, 110Hz, 164.8Hz
    const freqs = [55, 110, 165, 277.2];
    freqs.forEach((f) => {
      [-1.5, 0, 1.5].forEach((detune) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f + detune, start);

        gain.gain.setValueAtTime(0.06, start);

        osc.connect(gain);
        gain.connect(output);

        osc.start(start);
        osc.stop(start + duration);
        this.activeNodes.push(osc);
      });
    });
  }

  private generateNatureWhisper(ctx: AudioContext, output: AudioNode, start: number, duration: number) {
    // Noise buffer for atmospheric wind
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, start);
    filter.Q.setValueAtTime(2.5, start);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, start);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(output);

    noise.start(start);
    noise.stop(start + duration);
    this.activeNodes.push(noise);
  }

  private generateDramaticTension(ctx: AudioContext, output: AudioNode, start: number, duration: number) {
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65.4, start);
    osc.frequency.exponentialRampToValueAtTime(110, start + duration);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(3.5, start);
    lfo.frequency.linearRampToValueAtTime(8, start + duration);

    lfoGain.gain.setValueAtTime(8, start);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, start);
    filter.frequency.exponentialRampToValueAtTime(900, start + duration * 0.85);

    gain.gain.setValueAtTime(0.25, start);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(output);

    lfo.start(start);
    lfo.stop(start + duration);
    osc.start(start);
    osc.stop(start + duration);

    this.activeNodes.push(lfo, osc);
  }

  private generateLofiChill(ctx: AudioContext, output: AudioNode, start: number, duration: number) {
    const chords = [
      [220, 261.6, 329.6, 392], // Am7
      [174.6, 220, 261.6, 329.6], // Fmaj7
      [196, 246.9, 293.7, 349.2], // G7
      [164.8, 196, 246.9, 293.7], // Em7
    ];

    const chordDuration = Math.min(3, duration / chords.length);
    chords.forEach((chord, chordIdx) => {
      const chordStart = start + chordIdx * chordDuration;
      if (chordStart >= start + duration) return;

      chord.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note, chordStart);

        gain.gain.setValueAtTime(0.08, chordStart);
        gain.gain.exponentialRampToValueAtTime(0.001, chordStart + chordDuration);

        osc.connect(gain);
        gain.connect(output);

        osc.start(chordStart);
        osc.stop(chordStart + chordDuration);
        this.activeNodes.push(osc);
      });
    });
  }

  public stopAll() {
    this.activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch (e) {
        // ignore already stopped
      }
    });
    this.activeNodes = [];
  }
}

export const audioEngine = new CinematicAudioEngine();
