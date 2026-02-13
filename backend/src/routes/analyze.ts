// src/routes/analyze.ts
import { Router, Request, Response } from 'express';
import { analyzeDesigns } from '../services/anthropic.js';
import { loadStyleGuide } from '../services/styleGuide.js';
import { AnalyzeRequest } from '../types/index.js';

export const analyzeRouter = Router();

analyzeRouter.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { frames } = req.body as AnalyzeRequest;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({ error: 'No frames provided' });
    }

    if (frames.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 frames per request' });
    }

    // Load style guide corpus
    const styleGuide = await loadStyleGuide();

    // Analyze with Claude
    const analysisResult = await analyzeDesigns(frames, styleGuide);

    res.json(analysisResult);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Analysis failed' 
    });
  }
});
