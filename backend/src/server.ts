// src/server.ts
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { analyzeRouter } from './routes/analyze.js';

config();

const app = express();

// CORS for Figma plugin (null origin from iframe)
app.use(cors({ origin: '*' }));

// Parse JSON with generous limit for base64 images
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main analysis endpoint
app.use('/api', analyzeRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
