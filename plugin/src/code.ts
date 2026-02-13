// Show the UI
figma.showUI(__html__, { 
  width: 420, 
  height: 600, 
  themeColors: true 
});

// Types
interface FrameData {
  id: string;
  name: string;
  imageBase64: string;
  metadata: DesignMetadata;
}

interface DesignMetadata {
  width: number;
  height: number;
  textNodes: TextNodeData[];
  colors: ColorData[];
}

interface TextNodeData {
  characters: string;
  fontFamily: string | 'mixed';
  fontSize: number | 'mixed';
  fontWeight: number | 'mixed';
  lineHeight: LineHeight | 'mixed';
}

interface ColorData {
  hex: string;
  opacity: number;
  usage: 'fill' | 'stroke';
}

// Handle messages from UI
figma.ui.onmessage = async (msg: { type: string; payload?: any }) => {
  switch (msg.type) {
    case 'analyze-selection':
      await handleAnalyzeSelection();
      break;
    case 'locate-node':
      locateNode(msg.payload.nodeId);
      break;
    case 'close':
      figma.closePlugin();
      break;
  }
};

async function handleAnalyzeSelection() {
  const selection = figma.currentPage.selection;
  
  // Filter to only frame nodes
  const frames = selection.filter(
    (node): node is FrameNode => node.type === 'FRAME'
  );
  
  if (frames.length === 0) {
    figma.ui.postMessage({ 
      type: 'error', 
      message: 'Please select at least one frame to analyze.' 
    });
    return;
  }
  
  // Sort frames by name for sequential analysis
  const sortedFrames = [...frames].sort((a, b) => 
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );
  
  figma.ui.postMessage({ 
    type: 'analysis-started', 
    frameCount: sortedFrames.length 
  });
  
  // Process each frame
  const frameDataList: FrameData[] = [];
  
  for (let i = 0; i < sortedFrames.length; i++) {
    const frame = sortedFrames[i];
    
    figma.ui.postMessage({ 
      type: 'processing-frame', 
      current: i + 1, 
      total: sortedFrames.length,
      frameName: frame.name 
    });
    
    try {
      const frameData = await extractFrameData(frame);
      frameDataList.push(frameData);
    } catch (error) {
      figma.ui.postMessage({ 
        type: 'frame-error', 
        frameName: frame.name,
        error: String(error)
      });
    }
  }
  
  // Send all frame data to UI for API call
  figma.ui.postMessage({ 
    type: 'frames-ready', 
    frames: frameDataList 
  });
}

async function extractFrameData(frame: FrameNode): Promise<FrameData> {
  // Export frame as JPG at 1x scale (sufficient for content/layout review, much smaller payload)
  const exportScale = Math.min(1, 4096 / Math.max(frame.width, frame.height));

  const imageBytes = await frame.exportAsync({
    format: 'JPG',
    constraint: { type: 'SCALE', value: exportScale }
  });
  
  // Convert to base64
  const imageBase64 = figma.base64Encode(imageBytes);
  
  // Extract design metadata
  const metadata = extractMetadata(frame);
  
  return {
    id: frame.id,
    name: frame.name,
    imageBase64,
    metadata
  };
}

function extractMetadata(frame: FrameNode): DesignMetadata {
  // Extract text nodes
  const textNodes = frame.findAll(n => n.type === 'TEXT') as TextNode[];
  const textData: TextNodeData[] = textNodes.map(node => ({
    characters: node.characters,
    fontFamily: node.fontName === figma.mixed ? 'mixed' : node.fontName.family,
    fontSize: node.fontSize === figma.mixed ? 'mixed' : node.fontSize,
    fontWeight: node.fontName === figma.mixed ? 'mixed' : 
      (node.fontName.style.includes('Bold') ? 700 : 
       node.fontName.style.includes('Medium') ? 500 : 400),
    lineHeight: node.lineHeight === figma.mixed ? 'mixed' : node.lineHeight
  }));
  
  // Extract colors from fills
  const colorSet = new Map<string, ColorData>();
  
  function extractColors(node: SceneNode) {
    if ('fills' in node && Array.isArray(node.fills)) {
      for (const fill of node.fills as Paint[]) {
        if (fill.type === 'SOLID' && fill.visible !== false) {
          const hex = rgbToHex(fill.color);
          if (!colorSet.has(hex)) {
            colorSet.set(hex, {
              hex,
              opacity: fill.opacity ?? 1,
              usage: 'fill'
            });
          }
        }
      }
    }
    if ('strokes' in node && Array.isArray(node.strokes)) {
      for (const stroke of node.strokes as Paint[]) {
        if (stroke.type === 'SOLID' && stroke.visible !== false) {
          const hex = rgbToHex(stroke.color);
          if (!colorSet.has(hex + '-stroke')) {
            colorSet.set(hex + '-stroke', {
              hex,
              opacity: stroke.opacity ?? 1,
              usage: 'stroke'
            });
          }
        }
      }
    }
  }
  
  frame.findAll().forEach(extractColors);
  extractColors(frame);
  
  return {
    width: frame.width,
    height: frame.height,
    textNodes: textData,
    colors: Array.from(colorSet.values())
  };
}

function rgbToHex(color: RGB): string {
  const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
}

function locateNode(nodeId: string) {
  const node = figma.getNodeById(nodeId);
  if (node && 'type' in node && node.type !== 'DOCUMENT' && node.type !== 'PAGE') {
    const sceneNode = node as SceneNode;
    figma.currentPage.selection = [sceneNode];
    figma.viewport.scrollAndZoomIntoView([sceneNode]);
  }
}
