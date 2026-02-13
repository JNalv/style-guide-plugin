// ui.tsx
import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import './ui.css';

// Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Types
interface FrameData {
  id: string;
  name: string;
  imageBase64: string;
  metadata: any;
}

interface DesignIssue {
  id: string;
  element: string;
  location: string;
  nodeId?: string;
  category: 'tone' | 'understandability' | 'technical' | 'layout';
  actual: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

interface AnalysisResult {
  frameName: string;
  overallScore: number;
  issues: DesignIssue[];
  summary: string;
}

type AppState = 'idle' | 'extracting' | 'analyzing' | 'complete' | 'error';

function App() {
  const [state, setState] = useState<AppState>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0, frameName: '' });
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for messages from main thread
    window.onmessage = async (event) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;

      switch (msg.type) {
        case 'error':
          setError(msg.message);
          setState('error');
          break;
          
        case 'analysis-started':
          setState('extracting');
          setProgress({ current: 0, total: msg.frameCount, frameName: '' });
          setResults([]);
          setError(null);
          break;
          
        case 'processing-frame':
          setProgress({
            current: msg.current,
            total: msg.total,
            frameName: msg.frameName
          });
          break;
          
        case 'frames-ready':
          setState('analyzing');
          await analyzeFrames(msg.frames);
          break;
          
        case 'frame-error':
          console.error(`Error processing ${msg.frameName}:`, msg.error);
          break;
      }
    };
  }, []);

  async function analyzeFrames(frames: FrameData[]) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames })
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.results);
      setState('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setState('error');
    }
  }

  function handleAnalyze() {
    parent.postMessage({ pluginMessage: { type: 'analyze-selection' } }, '*');
  }

  function handleLocate(nodeId: string) {
    parent.postMessage({ 
      pluginMessage: { type: 'locate-node', payload: { nodeId } } 
    }, '*');
  }

  return (
    <div className="container">
      <header>
        <h1>Design Style Checker</h1>
      </header>

      {state === 'idle' && (
        <div className="idle-state">
          <p>Select one or more frames to analyze against your style guide.</p>
          <button onClick={handleAnalyze} className="primary-btn">
            Analyze Selection
          </button>
        </div>
      )}

      {state === 'extracting' && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Extracting frame {progress.current} of {progress.total}</p>
          <p className="frame-name">{progress.frameName}</p>
        </div>
      )}

      {state === 'analyzing' && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Analyzing designs with Claude AI...</p>
          <p className="subtext">This may take 10-30 seconds</p>
        </div>
      )}

      {state === 'error' && (
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button onClick={handleAnalyze} className="primary-btn">
            Try Again
          </button>
        </div>
      )}

      {state === 'complete' && (
        <div className="results">
          {results.map((result, idx) => (
            <div key={idx} className="frame-result">
              <div className="frame-header">
                <h2>{result.frameName}</h2>
                <span className={`score score-${getScoreClass(result.overallScore)}`}>
                  {result.overallScore}/100
                </span>
              </div>
              
              <p className="summary">{result.summary}</p>
              
              {result.issues.length > 0 && (
                <div className="issues">
                  {result.issues.map((issue, issueIdx) => (
                    <div 
                      key={issueIdx} 
                      className={`issue-card severity-${issue.severity}`}
                    >
                      <div className="issue-header">
                        <span className="issue-element">{issue.element}</span>
                        <span className={`severity-badge ${issue.severity}`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className="issue-location">{issue.location}</p>
                      <div className="issue-detail">
                        <span className="category-badge">{issue.category}</span>
                        <p className="actual">{issue.actual}</p>
                      </div>
                      <p className="recommendation">{issue.recommendation}</p>
                      {issue.nodeId && (
                        <button 
                          onClick={() => handleLocate(issue.nodeId!)}
                          className="locate-btn"
                        >
                          Locate in Figma
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          <button onClick={handleAnalyze} className="primary-btn">
            Analyze Again
          </button>
        </div>
      )}
    </div>
  );
}

function getScoreClass(score: number): string {
  if (score >= 80) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}

render(<App />, document.getElementById('root')!);
