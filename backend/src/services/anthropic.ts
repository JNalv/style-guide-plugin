// src/services/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FrameData, AnalysisResult, DesignIssue, JourneyFeedback } from '../types/index.js';

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
): Promise<{ journeyFeedback: JourneyFeedback; results: AnalysisResult[] }> {
  const systemPrompt = loadSystemPrompt();

  // Build user prompt with multi-screen context
  const userPrompt = buildMultiScreenPrompt(frames, styleGuide);

  // Build multi-image content array
  const imageContent: Array<{type: 'image'; source: {type: 'base64'; media_type: 'image/jpeg'; data: string}}> = frames.map((frame) => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: 'image/jpeg' as const,
      data: frame.imageBase64
    }
  }));

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        ...imageContent
      ]
    }],
    system: systemPrompt
  });

  // Extract text response
  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const parsed = parseMultiScreenResponse(textContent.text);

  return {
    journeyFeedback: parsed.journeyFeedback,
    results: parsed.screenResults
  };
}

function buildMultiScreenPrompt(frames: FrameData[], styleGuide: string): string {
  const frameDescriptions = frames.map((frame, idx) =>
    `Screen ${idx + 1}: "${frame.name}" (${frame.metadata.width}×${frame.metadata.height})\n` +
    `Text content: ${frame.metadata.textNodes?.map((t: any) => t.characters).join(', ') || 'none'}`
  ).join('\n\n');

  return `<style_guide>
${styleGuide}
</style_guide>

You are analyzing ${frames.length} screen${frames.length > 1 ? 's' : ''} from a user flow.

The screens are provided in sequence order. For each screen, provide individual analysis. ${frames.length > 1 ? 'Additionally, provide journey-level feedback that considers:\n- **Cross-screen consistency**: Does terminology, tone, and visual language remain consistent?\n- **Flow logic**: Is the progression clear and logical? Do steps build on each other?\n- **Transitions**: Are there jarring shifts in content, tone, or expectations between screens?' : ''}

Screens in this flow:
${frameDescriptions}

Respond with JSON matching this schema:
{
  "journeyFeedback": {
    "summary": "${frames.length > 1 ? '2-3 sentences on overall journey quality' : 'Overall assessment of this screen'}",
    "issues": [
      {
        "id": "string",
        "element": "string (e.g., 'Terminology shift from Screen 1 to 3')",
        "location": "string (e.g., 'Across screens 1, 3, 4')",
        "category": "tone | understandability | technical | layout",
        "severity": "high | medium | low",
        "recommendations": ["string"]
      }
    ]
  },
  "screenResults": [
    {
      "frameName": "string",
      "issues": [
        {
          "id": "string",
          "element": "string",
          "location": "string",
          "category": "tone | understandability | technical | layout",
          "severity": "high | medium | low",
          "recommendations": ["string"]
        }
      ],
      "summary": "string"
    }
  ]
}

Return ONLY valid JSON, no markdown or explanation.`;
}

function parseMultiScreenResponse(responseText: string): {
  journeyFeedback: JourneyFeedback;
  screenResults: AnalysisResult[];
} {
  let jsonText = responseText.trim();
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const parsed = JSON.parse(jsonText);

    return {
      journeyFeedback: {
        summary: parsed.journeyFeedback.summary,
        issues: parsed.journeyFeedback.issues.map((issue: any, idx: number) => ({
          ...issue,
          id: issue.id || `journey-issue-${idx}`
        }))
      },
      screenResults: parsed.screenResults.map((result: any, idx: number) => ({
        frameName: result.frameName,
        issues: result.issues.map((issue: any, issueIdx: number) => ({
          ...issue,
          id: issue.id || `issue-${idx}-${issueIdx}`
        })),
        summary: result.summary
      }))
    };
  } catch (parseError) {
    console.error('Failed to parse Claude response:', jsonText);
    throw new Error('Failed to parse analysis response');
  }
}
