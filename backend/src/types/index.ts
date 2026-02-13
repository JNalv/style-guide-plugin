// Shared TypeScript types for backend

export interface FrameData {
  id: string;
  name: string;
  imageBase64: string;
  metadata: DesignMetadata;
}

export interface DesignMetadata {
  width: number;
  height: number;
  textNodes: TextNodeData[];
  colors: ColorData[];
}

export interface TextNodeData {
  characters: string;
  fontFamily: string | 'mixed';
  fontSize: number | 'mixed';
  fontWeight: number | 'mixed';
  lineHeight: LineHeight | 'mixed';
}

export interface ColorData {
  hex: string;
  opacity: number;
  usage: 'fill' | 'stroke';
}

export interface DesignIssue {
  id: string;
  element: string;
  location: string;
  nodeId?: string;
  category: 'tone' | 'understandability' | 'technical' | 'layout';
  actual: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface AnalysisResult {
  frameName: string;
  overallScore: number;
  issues: DesignIssue[];
  summary: string;
}

export interface AnalyzeRequest {
  frames: FrameData[];
}

export interface AnalyzeResponse {
  results: AnalysisResult[];
}

// Type helper for LineHeight (can be number or AutoLayoutMixin)
type LineHeight = number | { value: number; unit: 'PIXELS' | 'PERCENT' } | 'AUTO';
