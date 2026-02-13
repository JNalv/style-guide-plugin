// src/services/styleGuide.ts
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CORPUS_DIR = join(__dirname, '../../corpus');

let cachedStyleGuide: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache

export async function loadStyleGuide(): Promise<string> {
  const now = Date.now();
  
  // Return cached if fresh
  if (cachedStyleGuide && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedStyleGuide;
  }

  try {
    const entries = await readdir(CORPUS_DIR);
    const contents: string[] = [];

    for (const entry of entries) {
      // Skip archive directory and other directories
      if (entry === 'archive') continue;

      const entryPath = join(CORPUS_DIR, entry);
      const stats = await stat(entryPath);

      // Only process files with .md or .txt extensions
      if (stats.isFile() && (entry.endsWith('.md') || entry.endsWith('.txt'))) {
        const content = await readFile(entryPath, 'utf-8');
        const sectionName = entry.replace(/\.(md|txt)$/, '').toUpperCase();
        contents.push(`## ${sectionName}\n\n${content}`);
      }
    }
    
    cachedStyleGuide = contents.join('\n\n---\n\n');
    cacheTimestamp = now;
    
    return cachedStyleGuide;
  } catch (error) {
    console.error('Error loading style guide:', error);
    throw new Error('Failed to load style guide corpus');
  }
}
