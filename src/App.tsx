import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
// import SplitPane from 'react-split-pane-v2';
import { DSLEditor } from './components/DSLEditor';
import { SystemDiagram } from './components/SystemDiagram';
import { SimulationControls } from './components/SimulationControls';
import { SystemGraph } from './components/SystemGraph';
import { GraphSidebar } from './components/GraphSidebar';
import { EmbedGenerator } from './components/EmbedGenerator';
import { SystemModel } from './models/SystemModel';
import './App.css';

function App() {
  const [searchParams] = useSearchParams();
  const [model, setModel] = useState<SystemModel>(new SystemModel());
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [modelVersion, setModelVersion] = useState(0);
  const [dataUpdateTrigger, setDataUpdateTrigger] = useState(0);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isGraphSidebarCollapsed, setIsGraphSidebarCollapsed] = useState(false);
  const [editorWidth, setEditorWidth] = useState(35); // percentage
  const [sidebarWidth, setSidebarWidth] = useState(350); // pixels
  const [isDragging, setIsDragging] = useState<'editor' | 'sidebar' | null>(null);

  // Default DSL code
  const defaultDslCode = `// Population Growth with Resource Constraints
// Model-level constants
const BirthRate = 0.02
const DeathRate = 0.01
const DeathRateStressed = 0.25
const ConsumptionRate = 0.1
const ResourceThreshold = 50
const MaxSteps = 100

stock Population {
  initial: 100
  min: 0
  units: "people"
}

stock Resources {
  initial: 100
  min: 0
  units: "units"
}

flow Births {
  from: Population
  to: Population
  rate: Population * BirthRate
}

flow Deaths {
  from: Population
  to: sink
  rate: Population * (DeathRate + (Resources < ResourceThreshold ? DeathRateStressed : 0))
  units: "people/year"
}

flow Consumption {
  from: Resources
  to: sink
  rate: Population * ConsumptionRate
}

terminate {
  when: Population <= 5 || Resources <= 0 || TIME >= MaxSteps
}

graph Population_vs_Resources {
  title: "Population vs Resources"
  variables: Population, Resources
  type: line
  yAxisLabel: "Count"
}

graph Resources_Only {
  title: "Resource Depletion"
  variables: Resources
  type: line
  yAxisLabel: "Units"
  color: "#ef4444"
}`;

  const [dslCode, setDslCode] = useState(defaultDslCode);

  // Load DSL from URL parameter on mount
  useEffect(() => {
    const encoded = searchParams.get('dsl');
    if (encoded) {
      try {
        const decoded = atob(encoded);
        setDslCode(decoded);
      } catch (error) {
        console.error('Failed to decode DSL from URL:', error);
      }
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

  return (
    <div className="app">
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Systems Thinking Tool</h1>
        <EmbedGenerator dslCode={dslCode} />
      </header>

      {/* Main content area with collapsible layout */}
      <div className="main-content">
        <div
          style={{ display: 'flex', height: '100%' }}
          onMouseMove={(e) => {
            if (isDragging === 'editor') {
              const containerWidth = e.currentTarget.getBoundingClientRect().width;
              const newWidth = Math.max(20, Math.min(60, (e.clientX / containerWidth) * 100));
              setEditorWidth(newWidth);
            } else if (isDragging === 'sidebar') {
              const containerRect = e.currentTarget.getBoundingClientRect();
              const newWidth = Math.max(250, Math.min(600, containerRect.right - e.clientX));
              setSidebarWidth(newWidth);
            }
          }}
          onMouseUp={() => setIsDragging(null)}
        >
          {/* Left: DSL Editor with collapse functionality */}
          <div style={{
            width: isEditorCollapsed ? '48px' : `${editorWidth}%`,
            minWidth: isEditorCollapsed ? '48px' : '250px',
            position: 'relative',
            transition: isDragging === 'editor' ? 'none' : 'width 0.3s ease',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditorCollapsed(!isEditorCollapsed);
              }}
              style={{
                position: 'absolute',
                top: '12px',
                right: isEditorCollapsed ? '50%' : '12px',
                transform: isEditorCollapsed ? 'translateX(50%)' : 'none',
                zIndex: 10,
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'right 0.3s ease, transform 0.3s ease',
              }}
              title={isEditorCollapsed ? "Show Editor" : "Hide Editor"}
            >
              {isEditorCollapsed ? '→' : '←'}
            </button>
            
            <div style={{
              display: isEditorCollapsed ? 'none' : 'flex',
              flexDirection: 'column',
              height: '100%',
              width: '100%',
            }}>
              <DSLEditor
                code={dslCode}
                onChange={setDslCode}
                onModelUpdate={useCallback((newModel) => {
                  setModel(newModel);
                  setModelVersion(prev => prev + 1);
                }, [])}
              />
            </div>
            
            <div style={{
              display: isEditorCollapsed ? 'flex' : 'none',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f9fafb',
              borderRight: '1px solid #e5e7eb',
            }} />
          </div>

          {/* Resizer - always present but hidden when collapsed */}
          <div
            className="Resizer"
            style={{
              width: isEditorCollapsed ? '0px' : '6px',
              background: isDragging === 'editor' ? '#3b82f6' : '#ddd',
              cursor: isEditorCollapsed ? 'default' : 'col-resize',
              flexShrink: 0,
              transition: isDragging === 'editor' ? 'none' : 'all 0.3s ease',
              position: 'relative',
            }}
            onMouseDown={(e) => {
              if (!isEditorCollapsed) {
                setIsDragging('editor');
                e.preventDefault();
              }
            }}
          >
            {!isEditorCollapsed && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '2px',
                height: '20px',
                background: '#999',
                borderRadius: '1px',
              }} />
            )}
          </div>


          {/* Center: Diagram */}
          <div className="visualization-panel" style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div className="diagram-container" style={{ flex: 1 }}>
              <SystemDiagram model={model} />
            </div>
          </div>

          {/* Right: Graph Sidebar */}
          <GraphSidebar
            model={model}
            data={graphData}
            isCollapsed={isGraphSidebarCollapsed}
            onToggleCollapse={() => setIsGraphSidebarCollapsed(!isGraphSidebarCollapsed)}
            width={sidebarWidth}
            isDragging={isDragging === 'sidebar'}
            onStartResize={() => setIsDragging('sidebar')}
          />
        </div>
      </div>

      {/* Bottom: Controls */}
      <div className="controls-bar">
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

export default App;
