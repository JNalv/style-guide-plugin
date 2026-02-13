// src/services/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FrameData, AnalysisResult, DesignIssue } from '../types/index.js';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = resolve(__dirname, '../../prompt.txt');

function loadSystemPrompt(): string {
  return readFileSync(PROMPT_PATH, 'utf-8');
}

export async function analyzeDesigns(
  frames: FrameData[],
  styleGuide: string
): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];

  // Process frames individually for clearer feedback
  // (Could batch for cost savings, but individual gives better results)
  for (const frame of frames) {
    const result = await analyzeFrame(frame, styleGuide);
    results.push(result);
  }

  return results;
}

async function analyzeFrame(
  frame: FrameData,
  styleGuide: string
): Promise<AnalysisResult> {
  const systemPrompt = loadSystemPrompt();

  const userPrompt = `<style_guide>
${styleGuide}
</style_guide>

<design_metadata>
Frame: ${frame.name}
Dimensions: ${frame.metadata.width}x${frame.metadata.height}px
Text elements: ${frame.metadata.textNodes?.length || 0}
Colors used: ${frame.metadata.colors?.map((c: any) => c.hex).join(', ') || 'none extracted'}
</design_metadata>

Analyze this design for style guide compliance. Review:
1. Typography: font families, sizes, weights, line heights
2. Colors: verify against palette definitions
3. Spacing: check alignment and consistent margins/padding
4. Components: button styles, input fields, card patterns
5. Hierarchy: visual weight, contrast, focal points

Return ONLY valid JSON, no markdown or explanation.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: frame.imageBase64
          }
        }
      ]
    }],
    system: systemPrompt
  });

  // Extract text response
  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse JSON response (handle markdown code blocks if present)
  let jsonText = textContent.text.trim();
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const parsed = JSON.parse(jsonText);
    return {
      frameName: frame.name,
      overallScore: parsed.overallScore,
      issues: parsed.issues.map((issue: any, idx: number) => ({
        ...issue,
        id: issue.id || `issue-${idx}`
      })),
      summary: parsed.summary
    };
  } catch (parseError) {
    console.error('Failed to parse Claude response:', jsonText);
    throw new Error('Failed to parse analysis response');
  }
}
