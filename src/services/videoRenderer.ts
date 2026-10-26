import { VideoGenerationConfig, CameraMotion, AtmosphereFx, VideoStyle } from '../types/video';

export interface Particle {
  x: number;
  y: number;
  z: number; // 0 to 1 (depth)
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rot: number;
  vRot: number;
  color?: string;
}

export class VideoRenderer {
  private particles: Particle[] = [];
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private noiseSeed = Math.random() * 1000;

  constructor() {
    this.initParticles(160);
  }

  private initParticles(count: number) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.05,
        vy: Math.random() * 0.15 + 0.05,
        size: Math.random() * 4 + 1.5,
        alpha: Math.random() * 0.7 + 0.3,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.08,
      });
    }
  }

  public async loadImage(src: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src)!;
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  }

  public renderFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number, // 0 to 1
    config: VideoGenerationConfig,
    sourceImg?: HTMLImageElement | null
  ) {
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // 1. Calculate camera transforms based on motion and intensity
    const intensity = (config.motionIntensity || 3) / 3;
    const { scale, translateX, translateY, rotate } = this.calculateCamera(
      config.cameraMotion,
      progress,
      intensity,
      width,
      height
    );

    // Apply camera transformation centered
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rotate);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2 + translateX, -height / 2 + translateY);

    // 2. Render Main Layer (either source image or procedural style canvas)
    if (sourceImg && sourceImg.complete) {
      this.renderImageLayer(ctx, width, height, sourceImg, progress, intensity);
    } else {
      this.renderProceduralStyle(ctx, width, height, progress, config.style, intensity);
    }

    // 3. Render Atmospheric Overlays & Particles
    this.renderAtmosphere(ctx, width, height, progress, config.atmosphereFx, config.style);

    // Restore from camera transforms before HUD/post-processing
    ctx.restore();

    // 4. Cinematic Post-Processing (Vignette, Letterbox/Aspect Ratio mask, Subtitles)
    this.renderCinematicOverlays(ctx, width, height, progress, config);
  }

  private calculateCamera(
    motion: CameraMotion,
    t: number,
    intensity: number,
    w: number,
    h: number
  ) {
    let scale = 1.0;
    let translateX = 0;
    let translateY = 0;
    let rotate = 0;

    const smoothT = Math.sin((t * Math.PI) / 2); // Ease out
    const linearT = t;

    switch (motion) {
      case 'dolly_in':
        scale = 1.0 + 0.18 * smoothT * intensity;
        break;
      case 'dolly_out':
        scale = 1.18 - 0.18 * smoothT * intensity;
        break;
      case 'pan_right':
        scale = 1.08;
        translateX = -(w * 0.08 * linearT * intensity);
        break;
      case 'pan_left':
        scale = 1.08;
        translateX = w * 0.08 * linearT * intensity;
        break;
      case 'tilt_up':
        scale = 1.08;
        translateY = h * 0.07 * linearT * intensity;
        break;
      case 'tilt_down':
        scale = 1.08;
        translateY = -(h * 0.07 * linearT * intensity);
        break;
      case 'orbit':
        scale = 1.12;
        translateX = Math.sin(t * Math.PI * 2) * (w * 0.04 * intensity);
        translateY = Math.cos(t * Math.PI * 2) * (h * 0.02 * intensity);
        rotate = Math.sin(t * Math.PI * 2) * 0.015 * intensity;
        break;
      case 'handheld':
        scale = 1.06;
        translateX = (Math.sin(t * 12) * 4 + Math.cos(t * 7) * 3) * intensity;
        translateY = (Math.cos(t * 10) * 3 + Math.sin(t * 5) * 2) * intensity;
        rotate = Math.sin(t * 8) * 0.005 * intensity;
        break;
      case 'hyperlapse':
        scale = 1.0 + 0.35 * Math.pow(t, 1.4) * intensity;
        translateX = (Math.random() - 0.5) * 2 * intensity;
        translateY = (Math.random() - 0.5) * 2 * intensity;
        break;
      default:
        scale = 1.0 + 0.12 * smoothT * intensity;
    }

    return { scale, translateX, translateY, rotate };
  }

  private renderImageLayer(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    img: HTMLImageElement,
    t: number,
    intensity: number
  ) {
    // Parallax & aspect fill
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;
    let renderW = width;
    let renderH = height;

    if (canvasRatio > imgRatio) {
      renderW = width;
      renderH = width / imgRatio;
    } else {
      renderH = height;
      renderW = height * imgRatio;
    }

    const offsetX = (width - renderW) / 2;
    const offsetY = (height - renderH) / 2;

    // Draw main image
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

    // Subtle 2.5D lighting shimmer pass
    const shimmer = ctx.createLinearGradient(
      -width + t * width * 2,
      0,
      t * width * 2,
      height
    );
    shimmer.addColorStop(0, 'rgba(255, 255, 255, 0)');
    shimmer.addColorStop(0.5, `rgba(255, 255, 255, ${0.04 * intensity})`);
    shimmer.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = shimmer;
    ctx.fillRect(0, 0, width, height);
  }

  private renderProceduralStyle(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    style: VideoStyle,
    intensity: number
  ) {
    switch (style) {
      case 'cyberpunk':
        this.renderCyberpunkCity(ctx, w, h, t, intensity);
        break;
      case 'space':
        this.renderCosmicSpace(ctx, w, h, t, intensity);
        break;
      case 'nature':
        this.renderSavannaSunset(ctx, w, h, t, intensity);
        break;
      case 'anime':
        this.renderAnimeSakura(ctx, w, h, t, intensity);
        break;
      case 'quantum':
        this.renderQuantumCore(ctx, w, h, t, intensity);
        break;
      case 'ocean':
        this.renderBioluminescentOcean(ctx, w, h, t, intensity);
        break;
      case 'vintage':
        this.renderVintageFilm(ctx, w, h, t, intensity);
        break;
      case 'cinematic':
      default:
        this.renderCinematicAtmosphere(ctx, w, h, t, intensity);
        break;
    }
  }

  private renderCyberpunkCity(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, intensity: number) {
    // Dark neon sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#060814');
    sky.addColorStop(0.5, '#120c29');
    sky.addColorStop(0.8, '#1e1136');
    sky.addColorStop(1, '#050711');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Distant skyscraper silhouettes with illuminated windows
    const buildingCount = 18;
    for (let i = 0; i < buildingCount; i++) {
      const bx = (i / buildingCount) * w * 1.2 - w * 0.1;
      const bw = (w / buildingCount) * 1.1;
      const bh = h * (0.35 + Math.sin(i * 3.7 + this.noiseSeed) * 0.25);
      const by = h - bh;

      ctx.fillStyle = i % 2 === 0 ? '#0b0f1e' : '#080b18';
      ctx.fillRect(bx, by, bw, bh);

      // Neon window grid
      ctx.fillStyle = i % 3 === 0 ? 'rgba(6, 182, 212, 0.45)' : 'rgba(236, 72, 153, 0.35)';
      const winRows = Math.floor(bh / 18);
      const winCols = Math.floor(bw / 12);
      for (let r = 0; r < winRows; r++) {
        for (let c = 0; c < winCols; c++) {
          if ((r * 7 + c * 3 + i) % 4 === 0) {
            ctx.fillRect(bx + c * 12 + 2, by + r * 18 + 2, 4, 6);
          }
        }
      }
    }

    // Wet road reflection perspective grid
    const roadY = h * 0.72;
    const roadGrad = ctx.createLinearGradient(0, roadY, 0, h);
    roadGrad.addColorStop(0, '#0a0d18');
    roadGrad.addColorStop(1, '#020408');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, roadY, w, h - roadY);

    // Flying vehicles light trails (cyan and magenta streaks)
    for (let v = 0; v < 6; v++) {
      const speed = (0.3 + (v % 3) * 0.25) * intensity;
      const trailT = (t * speed + v * 0.17) % 1;
      const trailX = trailT * w * 1.4 - w * 0.2;
      const trailY = h * (0.2 + (v * 0.08));
      const color = v % 2 === 0 ? 'rgba(6, 182, 212, 0.85)' : 'rgba(244, 63, 94, 0.85)';

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(trailX - 120, trailY);
      ctx.lineTo(trailX, trailY);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderCosmicSpace(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, intensity: number) {
    // Deep black canvas
    ctx.fillStyle = '#020208';
    ctx.fillRect(0, 0, w, h);

    // Glowing Nebula swirls
    const cx = w * 0.5;
    const cy = h * 0.48;

    const nebulaGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, w * 0.65);
    nebulaGrad.addColorStop(0, 'rgba(236, 72, 153, 0.45)');
    nebulaGrad.addColorStop(0.3, 'rgba(147, 51, 234, 0.35)');
    nebulaGrad.addColorStop(0.6, 'rgba(59, 130, 246, 0.2)');
    nebulaGrad.addColorStop(1, 'rgba(2, 2, 8, 0)');

    ctx.fillStyle = nebulaGrad;
    ctx.fillRect(0, 0, w, h);

    // Swirling spiral galaxy arms
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.3 * intensity);

    for (let arm = 0; arm < 3; arm++) {
      const armAngle = (arm * Math.PI * 2) / 3;
      for (let s = 0; s < 40; s++) {
        const dist = (s / 40) * (w * 0.4);
        const theta = armAngle + (s * 0.12);
        const sx = Math.cos(theta) * dist;
        const sy = Math.sin(theta) * dist * 0.55; // inclined plane
        const size = Math.max(1, (1 - s / 40) * 4);

        ctx.fillStyle = s % 2 === 0 ? 'rgba(192, 132, 252, 0.8)' : 'rgba(56, 189, 248, 0.85)';
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Brilliant core star
    const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
    coreGlow.addColorStop(0, '#ffffff');
    coreGlow.addColorStop(0.2, '#fef08a');
    coreGlow.addColorStop(0.6, 'rgba(249, 115, 22, 0.4)');
    coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderSavannaSunset(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, intensity: number) {
    // Golden hour sky
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#7c2d12');
    sky.addColorStop(0.4, '#c2410c');
    sky.addColorStop(0.7, '#ea580c');
    sky.addColorStop(0.85, '#f59e0b');
    sky.addColorStop(1, '#451a03');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Sun setting slowly
    const sunY = h * (0.35 + t * 0.08 * intensity);
    const sunX = w * 0.35;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 160);
    sunGlow.addColorStop(0, '#ffffff');
    sunGlow.addColorStop(0.2, '#fed7aa');
    sunGlow.addColorStop(0.6, 'rgba(251, 146, 60, 0.5)');
    sunGlow.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 160, 0, Math.PI * 2);
    ctx.fill();

    // Distant mountain ranges
    ctx.fillStyle = '#2d1307';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.75);
    for (let x = 0; x <= w; x += 40) {
      const my = h * 0.72 + Math.sin(x * 0.008 + 1) * 25 + Math.cos(x * 0.004) * 15;
      ctx.lineTo(x, my);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Foreground savanna ground & acacia silhouette
    ctx.fillStyle = '#170902';
    ctx.fillRect(0, h * 0.8, w, h * 0.2);

    // Acacia tree silhouette
    const treeX = w * 0.78;
    const treeY = h * 0.8;
    ctx.fillStyle = '#0f0501';
    ctx.beginPath();
    ctx.moveTo(treeX - 10, treeY);
    ctx.lineTo(treeX + 10, treeY);
    ctx.lineTo(treeX + 6, treeY - 100);
    ctx.lineTo(treeX - 6, treeY - 100);
    ctx.fill();

    // Flat canopy branches
    ctx.beginPath();
    ctx.ellipse(treeX + 30, treeY - 110, 80, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(treeX - 40, treeY - 105, 70, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderAnimeSakura(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, intensity: number) {
    // Soft romantic pastel dusk
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#312e81');
    sky.addColorStop(0.35, '#831843');
    sky.addColorStop(0.65, '#db2777');
    sky.addColorStop(0.85, '#f472b6');
    sky.addColorStop(1, '#fbcfe8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Japanese pagoda / traditional houses silhouettes
    ctx.fillStyle = '#1e1b4b';
    const houseBaseY = h * 0.75;
    ctx.fillRect(w * 0.1, houseBaseY, w * 0.35, h * 0.25);
    // Roof eaves
    ctx.beginPath();
    ctx.moveTo(w * 0.06, houseBaseY);
    ctx.quadraticCurveTo(w * 0.27, houseBaseY - 35, w * 0.48, houseBaseY);
    ctx.lineTo(w * 0.44, houseBaseY - 10);
    ctx.quadraticCurveTo(w * 0.27, houseBaseY - 45, w * 0.1, houseBaseY - 10);
    ctx.closePath();
    ctx.fill();

    // Glowing warm paper lanterns
    const lanternX = w * 0.28;
    const lanternY = houseBaseY + 25;
    const lGlow = ctx.createRadialGradient(lanternX, lanternY, 4, lanternX, lanternY, 45);
    lGlow.addColorStop(0, '#fef08a');
    lGlow.addColorStop(0.4, 'rgba(249, 115, 22, 0.6)');
    lGlow.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = lGlow;
    ctx.beginPath();
    ctx.arc(lanternX, lanternY, 45, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderQuantumCore(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, intensity: number) {
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;

    // Concentric rotating energy rings
    for (let r = 0; r < 5; r++) {
      const radius = 60 + r * 50;
      const ringAngle = (t * (r % 2 === 0 ? 1 : -1) * (0.8 + r * 0.2) * intensity);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ringAngle);

      ctx.strokeStyle = r % 2 === 0 ? 'rgba(6, 182, 212, 0.7)' : 'rgba(168, 85, 247, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius, radius * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Nodes on ring
      for (let n = 0; n < 4; n++) {
        const nodeAngle = (n * Math.PI) / 2;
        const nx = Math.cos(nodeAngle) * radius;
        const ny = Math.sin(nodeAngle) * radius * 0.45;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(nx, ny, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderBioluminescentOcean(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, intensity: number) {
    const sea = ctx.createLinearGradient(0, 0, 0, h);
    sea.addColorStop(0, '#022c43');
    sea.addColorStop(0.5, '#051923');
    sea.addColorStop(1, '#000814');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 0, w, h);

    // Caustics light rays from top
    ctx.save();
    for (let ray = 0; ray < 5; ray++) {
      const rx = (ray / 5) * w + Math.sin(t * 3 + ray) * 30;
      const rayGrad = ctx.createLinearGradient(rx, 0, rx + 100, h);
      rayGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
      rayGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(rx - 20, 0);
      ctx.lineTo(rx + 60, 0);
      ctx.lineTo(rx + 180, h);
      ctx.lineTo(rx + 40, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private renderVintageFilm(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, intensity: number) {
    // Sepia / 35mm tone
    const sepia = ctx.createLinearGradient(0, 0, w, h);
    sepia.addColorStop(0, '#422006');
    sepia.addColorStop(0.5, '#78350f');
    sepia.addColorStop(1, '#1c1917');
    ctx.fillStyle = sepia;
    ctx.fillRect(0, 0, w, h);

    // Film scratches
    if (Math.random() < 0.4) {
      const scratchX = Math.random() * w;
      ctx.strokeStyle = 'rgba(254, 243, 199, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(scratchX, 0);
      ctx.lineTo(scratchX + (Math.random() - 0.5) * 6, h);
      ctx.stroke();
    }
  }

  private renderCinematicAtmosphere(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, intensity: number) {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Anamorphic horizontal lens flare
    const flareY = h * 0.45;
    const flareX = w * (0.3 + t * 0.4 * intensity);
    const flareGrad = ctx.createRadialGradient(flareX, flareY, 5, flareX, flareY, 180);
    flareGrad.addColorStop(0, '#67e8f9');
    flareGrad.addColorStop(0.3, 'rgba(6, 182, 212, 0.4)');
    flareGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = flareGrad;
    ctx.beginPath();
    ctx.arc(flareX, flareY, 180, 0, Math.PI * 2);
    ctx.fill();

    // Horizontal anamorphic streak
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, flareY);
    ctx.lineTo(w, flareY);
    ctx.stroke();
  }

  private renderAtmosphere(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    fx: AtmosphereFx,
    style: VideoStyle
  ) {
    if (fx === 'none') return;

    this.particles.forEach((p, idx) => {
      // Update particle positions based on type
      let px = ((p.x + p.vx * t * 4) % 1) * w;
      let py = 0;

      if (fx === 'rain') {
        py = ((p.y + t * 4 * (1 + p.z)) % 1) * h;
        ctx.strokeStyle = `rgba(186, 230, 253, ${p.alpha * 0.6})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 4, py + 18 * (1 + p.z));
        ctx.stroke();
      } else if (fx === 'embers') {
        // Floating upward sparks
        py = h - (((p.y + t * 2 * (1 + p.z)) % 1) * h);
        px += Math.sin(t * 8 + idx) * 15;
        const emberColor = idx % 2 === 0 ? 'rgba(249, 115, 22, ' : 'rgba(239, 68, 68, ';
        ctx.fillStyle = `${emberColor}${p.alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size * (1 + p.z * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else if (fx === 'sakura') {
        // Fluttering petals falling gently
        py = ((p.y + t * 0.8 * (0.8 + p.z * 0.5)) % 1) * h;
        px += Math.sin(t * 4 + idx * 0.5) * 35;
        const rot = p.rot + t * p.vRot * 20;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rot);
        ctx.fillStyle = `rgba(244, 114, 182, ${p.alpha * 0.75})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 2, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (fx === 'stardust') {
        py = ((p.y + t * 0.3) % 1) * h;
        px = ((p.x + t * 0.2) % 1) * w;
        const twinkle = Math.abs(Math.sin(t * 10 + idx));
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (fx === 'fog') {
        // Soft rolling mist
        py = ((p.y + Math.sin(t * 2 + idx) * 0.05) % 1) * h;
        px = ((p.x + t * 0.25) % 1) * w;
        const fogGrad = ctx.createRadialGradient(px, py, 10, px, py, 120);
        fogGrad.addColorStop(0, `rgba(226, 232, 240, ${p.alpha * 0.12})`);
        fogGrad.addColorStop(1, 'rgba(226, 232, 240, 0)');
        ctx.fillStyle = fogGrad;
        ctx.beginPath();
        ctx.arc(px, py, 120, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  private renderCinematicOverlays(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    config: VideoGenerationConfig
  ) {
    // 1. Vignette
    const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.75);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // 2. Subtitles if present
    if (config.subtitle) {
      ctx.save();
      const fontSize = Math.max(16, Math.floor(h * 0.038));
      ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const subY = h - Math.max(36, h * 0.09);
      const text = config.subtitle;
      const textWidth = ctx.measureText(text).width;

      // Subtle backing scrim
      ctx.fillStyle = 'rgba(3, 7, 18, 0.65)';
      ctx.roundRect(
        w / 2 - textWidth / 2 - 16,
        subY - fontSize * 0.8,
        textWidth + 32,
        fontSize * 1.6,
        6
      );
      ctx.fill();

      // Text glow and fill
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, w / 2, subY);
      ctx.restore();
    }
  }
}

export const videoRenderer = new VideoRenderer();
