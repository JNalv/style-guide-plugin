// src/services/styleGuide.ts
import { readdir, readFile } from 'fs/promises';
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
    const files = await readdir(CORPUS_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.txt'));
    
    const contents: string[] = [];
    
    for (const file of mdFiles) {
      const filePath = join(CORPUS_DIR, file);
      const content = await readFile(filePath, 'utf-8');
      const sectionName = file.replace(/\.(md|txt)$/, '').toUpperCase();
      contents.push(`## ${sectionName}\n\n${content}`);
    }
    
    cachedStyleGuide = contents.join('\n\n---\n\n');
    cacheTimestamp = now;
    
    return cachedStyleGuide;
  } catch (error) {
    console.error('Error loading style guide:', error);
    throw new Error('Failed to load style guide corpus');
  }
}
