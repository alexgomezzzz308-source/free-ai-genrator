import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Shared Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Prompt enhancer for cinematic video synthesis
app.post('/api/ai/enhance-prompt', async (req: Request, res: Response) => {
  try {
    const { prompt, style, cameraMotion } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt manquant' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Graceful offline enhancement
      const fallbackPrompt = `${prompt}, style visuel ${style || 'cinématique'}, mouvement de caméra ${cameraMotion || 'dolly in'}, éclairage volumétrique doux, détails précis 8k, composition cinématographique épique.`;
      return res.json({ enhancedPrompt: fallbackPrompt, generatedWithFallback: true });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Tu es un réalisateur et directeur de la photographie expert en génération vidéo IA.
Transforme et sublime le prompt utilisateur suivant en une directive visuelle cinématique ultra-détaillée (en français, ou avec les termes techniques universels de cinéma) prête pour la génération vidéo.
Inclus des détails sur :
- Le sujet principal et l'action dynamique
- Le cadrage et mouvement de caméra (${cameraMotion || 'mouvement fluide'})
- L'éclairage, la colorimétrie et l'ambiance (${style || 'cinématique'})
- La texture, la météo ou les particules atmosphériques

Prompt de départ : "${prompt}"
Style souhaité : "${style || 'cinématique'}"
Mouvement de caméra : "${cameraMotion || 'automatique'}"

Réponds UNIQUEMENT par le texte enrichi du prompt final, sans guillemets, sans explications ni préambule, 2 à 4 phrases percutantes.`,
    });

    const enhanced = response.text?.trim() || prompt;
    res.json({ enhancedPrompt: enhanced });
  } catch (error: any) {
    console.warn('Fallback enhance-prompt suite à indisponibilité temporaire:', error.message);
    const { prompt, style, cameraMotion } = req.body;
    const styleDescriptions: Record<string, string> = {
      cyberpunk: 'mégalopole néon futuriste, reflets humides sur l\'asphalte nocturne, brume volumétrique et hologrammes vibrants',
      space: 'immensité cosmique interstellaire, nébuleuse luminescente, poussière d\'étoiles en spirale gravitationnelle',
      nature: 'lumière dorée rasante de fin d\'après-midi, détails organiques ultra-fins, brume atmosphérique naturelle',
      anime: 'esthétique d\'animation japonaise vibrante, teintes pastel crépusculaires, pétales en apesanteur',
      quantum: 'géométrie sacrée luminescente, lasers et anneaux énergétiques en rotation fluide',
      ocean: 'abysses sous-marines mystérieuses, bioluminescence aquatique et rayons caustiques réfractés',
      vintage: 'texture pellicule 35mm argentique, grain subtil et teintes chaudes nostalgiques',
      cinematic: 'composition anamorphique cinématographique 8k, éclairage dramatique chiaroscuro, profondeur de champ prononcée',
    };
    const desc = styleDescriptions[style] || 'composition cinématique soignée et éclairage immersif';
    const smartFallback = `${prompt}. Cadrage avec ${cameraMotion || 'dolly in fluide'}, atmosphère ${desc}, rendu haute définition ultra-réaliste 60 FPS.`;
    res.json({ enhancedPrompt: smartFallback, fallbackApplied: true });
  }
});

// Multi-scene storyboard generator
app.post('/api/ai/generate-storyboard', async (req: Request, res: Response) => {
  try {
    const { theme, sceneCount = 3 } = req.body;
    if (!theme) {
      return res.status(400).json({ error: 'Thème manquant' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback storyboard
      return res.json({
        title: theme,
        synopsis: `Un voyage visuel immersif explorant ${theme}.`,
        scenes: [
          {
            id: 'scene-1',
            title: 'Plan d\'ouverture',
            description: `Vue d'ensemble établissant l'atmosphère de ${theme}, brume matinale et lumière rasante.`,
            cameraMotion: 'dolly_in',
            duration: 4,
            audioMood: 'epic_synth',
            subtitle: 'Le commencement d\'une nouvelle ère...',
          },
          {
            id: 'scene-2',
            title: 'Point culminant',
            description: `Rapprochement dynamique sur le cœur de l'action avec particules en mouvement et reflets néons.`,
            cameraMotion: 'orbit',
            duration: 4,
            audioMood: 'cyber_pulse',
            subtitle: 'L\'énergie se concentre à l\'horizon.',
          },
          {
            id: 'scene-3',
            title: 'Dénouement',
            description: `Travelling arrière majestueux révélant l'immensité du paysage baigné de soleil doré.`,
            cameraMotion: 'pan_right',
            duration: 4,
            audioMood: 'ambient_peace',
            subtitle: 'Un silence magistral s\'installe.',
          },
        ],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Tu es un scénariste et réalisateur de courts-métrages IA.
Crée un storyboard cinématique de ${sceneCount} scènes cohérentes basé sur l'idée : "${theme}".
Renvoie STRICTEMENT un objet JSON valide avec cette structure :
{
  "title": "Titre du film",
  "synopsis": "Résumé en une phrase",
  "scenes": [
    {
      "id": "scene-1",
      "title": "Titre du plan",
      "description": "Description visuelle détaillée prête pour la génération vidéo",
      "cameraMotion": "dolly_in" | "pan_right" | "pan_left" | "orbit" | "tilt_up" | "hyperlapse",
      "duration": 4,
      "audioMood": "epic_synth" | "cyber_pulse" | "ambient_peace" | "nature_whisper" | "dramatic_tension",
      "subtitle": "Court sous-titre narratif pour la vidéo (max 10 mots)"
    }
  ]
}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Erreur generate-storyboard:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la génération du storyboard' });
  }
});

// Generate frame image with Gemini Image model
app.post('/api/ai/generate-frame', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '16:9' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt requis' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: 'Clé API non configurée' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            text: `High cinematic quality frame for video generation: ${prompt}`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio === '9:16' ? '9:16' : aspectRatio === '1:1' ? '1:1' : '16:9',
        },
      },
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'Aucune image générée par le modèle' });
    }

    res.json({ imageUrl });
  } catch (error: any) {
    console.error('Erreur generate-frame:', error);
    res.status(500).json({ error: error.message || 'Erreur de génération d\'image' });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 CineGen Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
