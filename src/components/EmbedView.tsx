import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SystemDiagram } from './SystemDiagram';
import { SimulationControls } from './SimulationControls';
import { SystemModel } from '../models/SystemModel';
import { parseDSL } from '../parser/DSLParser';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type ViewMode = 'graph' | 'canvas' | 'dsl';

export function EmbedView() {
  const [searchParams] = useSearchParams();
  const [model, setModel] = useState<SystemModel>(new SystemModel());
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [modelVersion, setModelVersion] = useState(0);
  const [dataUpdateTrigger, setDataUpdateTrigger] = useState(0);
  const [dslCode, setDslCode] = useState('');
  const [isCompact, setIsCompact] = useState(false);

  // Initialize view mode from URL parameter or default to graph
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const viewParam = searchParams.get('view') as ViewMode;
    return viewParam === 'canvas' || viewParam === 'graph' || viewParam === 'dsl' ? viewParam : 'graph';
  });

  // Decode DSL from URL parameter and initialize model immediately
  useEffect(() => {
    const encoded = searchParams.get('dsl');
    
    if (!encoded) {
      // No DSL parameter - leave model empty
      setDslCode('');
      return;
    }
    
    let code = '';
    try {
      const decoded = atob(encoded);
      code = decoded;
    } catch (error) {
      console.error('Failed to decode DSL:', error);
      code = '// Invalid DSL encoding';
    }
    
    setDslCode(code);
    
    // Parse and initialize model immediately
    try {
      const newModel = parseDSL(code);
      
      // Run simulation to completion (like "fast run")
      const maxSteps = 10000;
      let steps = 0;
      while (!newModel.isTerminated && steps < maxSteps) {
        newModel.step(1);
        steps++;
      }
      
      setModel(newModel);
      setModelVersion(prev => prev + 1);
      setDataUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to parse DSL:', error);
    }
  }, [searchParams]);

  // Prepare graph data from model history
  const graphData = useMemo(() => {
    if (model.history.length === 0) return [];

    return model.history.map(point => {
      const dataPoint: any = { time: point.time.toFixed(1) };
      point.state.forEach((value, stockName) => {
        dataPoint[stockName] = Number(value.toFixed(2));
      });
      return dataPoint;
    });
  }, [model.history, dataUpdateTrigger]);

  // Detect iframe size for responsive layout
  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      // Compact mode if width < 600px or height < 400px
      setIsCompact(width < 600 || height < 400);
    };

    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  // Colors for graphs
  const colors = ['#3182bd', '#31a354', '#fd8d3c', '#756bb1', '#e6550d'];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#1a1a2e',
      color: '#fff',
      overflow: 'hidden',
    }}>
      {/* Header with view switcher */}
      {!isCompact && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          background: '#16213e',
          borderBottom: '1px solid #0f3460',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
            System Model Viewer
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('graph')}
              style={{
                padding: '6px 12px',
                background: viewMode === 'graph' ? '#3b82f6' : '#0f3460',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Graph
            </button>
            <button
              onClick={() => setViewMode('canvas')}
              style={{
                padding: '6px 12px',
                background: viewMode === 'canvas' ? '#3b82f6' : '#0f3460',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Canvas
            </button>
            <a
              href={`${window.location.origin}/?dsl=${searchParams.get('dsl') || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '6px 12px',
                background: '#0f3460',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Open Editor
            </a>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {!dslCode ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <div style={{ fontSize: '24px', opacity: 0.5 }}>📊</div>
            <div style={{ fontSize: '16px', opacity: 0.7 }}>No model provided</div>
            <div style={{ fontSize: '12px', opacity: 0.5 }}>
              Add a DSL parameter to the URL to view a model
            </div>
          </div>
        ) : viewMode === 'graph' && (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            gap: '16px',
            padding: '16px',
            overflow: 'auto'
          }}>
            {Array.from(model.graphs.values()).map((graphConfig, index) => (
              <div key={`${graphConfig.name}-${modelVersion}-${index}`} style={{ minHeight: '300px', flex: '1 0 auto' }}>
                <div style={{ background: 'white', borderRadius: '8px', padding: '16px', height: '100%' }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>{graphConfig.title || graphConfig.name}</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
                      <XAxis
                        dataKey="time"
                        label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis label={{ value: graphConfig.yAxisLabel || '', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      {graphConfig.variables.map((varName, varIndex) => (
                        <Line
                          key={varName}
                          type="monotone"
                          dataKey={varName}
                          stroke={graphConfig.variables.length === 1 && graphConfig.color ? graphConfig.color : colors[varIndex % colors.length]}
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'canvas' && (
          <div style={{ width: '100%', height: '100%' }}>
            <SystemDiagram model={model} />
          </div>
        )}


        {/* Compact mode: floating view switcher */}
        {isCompact && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            gap: '4px',
            zIndex: 10,
          }}>
            <button
              onClick={() => setViewMode('graph')}
              style={{
                padding: '4px 8px',
                background: viewMode === 'graph' ? '#3b82f6' : 'rgba(15, 52, 96, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
              }}
              title="Graph View"
            >
              📊
            </button>
            <button
              onClick={() => setViewMode('canvas')}
              style={{
                padding: '4px 8px',
                background: viewMode === 'canvas' ? '#3b82f6' : 'rgba(15, 52, 96, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
              }}
              title="Canvas View"
            >
              🎨
            </button>
            <a
              href={`${window.location.origin}/?dsl=${searchParams.get('dsl') || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '4px 8px',
                background: 'rgba(15, 52, 96, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
              title="Open Editor"
            >
              📝
            </a>
          </div>
        )}
      </div>

      {/* Simulation controls */}
      <div style={{
        background: '#16213e',
        borderTop: '1px solid #0f3460',
        padding: isCompact ? '4px' : '8px',
      }}>
        <SimulationControls
          model={model}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          onTimeUpdate={(time) => {
            setCurrentTime(time);
            setDataUpdateTrigger(prev => prev + 1);
          }}
        />
      </div>
    </div>
  );
}
