import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

// Load environment variables from .env (server-side only)
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/polish', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing GEMINI_API_KEY on server (.env).' });
    }

    const context = req.body?.context;
    if (typeof context !== 'string' || !context.trim()) {
      return res.status(400).json({ error: 'Body must be { context: string }' });
    }

    // Basic guardrails: prevent huge prompts / accidental file dumps
    const trimmed = context.trim();
    if (trimmed.length > 8000) {
      return res.status(413).json({ error: 'Context too large (max 8000 characters).' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = [
      'Ești un asistent care transformă notițe scurte în text formal pentru un PROCES-VERBAL (Română).',
      'Reguli:',
      '1) Folosește un ton profesional, impersonal.',
      '2) Nu inventa detalii. Dacă lipsește ceva, spune clar că "nu este precizat".',
      '3) Returnează DOAR blocul de observații, fără introduceri/meta.',
      '',
      'NOTIȚE (de formalizat):',
      trimmed,
    ].join('\n');

    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.4,
        topP: 0.9,
      },
    });

    const text = (result.text || '').trim();

    res.json({ text: text || trimmed });
  } catch (err) {
    console.error('Gemini /api/polish error:', err);
    res.status(500).json({ error: 'Gemini request failed', detail: String(err) });
  }
});

// In production, serve the built frontend
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
