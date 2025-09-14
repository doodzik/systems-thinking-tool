import { useState, useCallback } from 'react';
// import SplitPane from 'react-split-pane-v2';
import { DSLEditor } from './components/DSLEditor';
import { SystemDiagram } from './components/SystemDiagram';
import { SimulationControls } from './components/SimulationControls';
import { SystemGraph } from './components/SystemGraph';
// import { GraphSidebar } from './components/GraphSidebar';
import { SystemModel } from './models/SystemModel';
import './App.css';

function App() {
  const [model, setModel] = useState<SystemModel>(new SystemModel());
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [modelVersion, setModelVersion] = useState(0);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isMainViewCollapsed, setIsMainViewCollapsed] = useState(false);
  const [isGraphSidebarCollapsed, setIsGraphSidebarCollapsed] = useState(false);

  // Default DSL code
  const [dslCode, setDslCode] = useState(`// Population Growth with Resource Constraints
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
  from: source
  to: Population
  rate: Population * 0.02
}

flow Deaths {
  from: Population
  to: sink
  rate: Population * (0.01 + (Resources < 50 ? 0.25 : 0))
}

flow Consumption {
  from: Resources
  to: sink
  rate: Population * 0.1
}

terminate {
  when: Population <= 5 || Resources <= 0
}

graph Population_vs_Resources {
  title: "Population vs Resources"
  variables: Population, Resources
  type: line
  yAxisLabel: "Count"
}

graph Population_Only {
  title: "Population Growth"
  variables: Population
  type: area
  yAxisLabel: "People"
  color: "#10b981"
}

graph Resources_Only {
  title: "Resource Depletion"
  variables: Resources
  type: line
  yAxisLabel: "Units"
  color: "#ef4444"
}`);

  // Prepare graph data from model history
  // const graphData = useMemo(() => {
  //   if (model.history.length === 0) return [];

  //   return model.history.map(point => {
  //     const dataPoint: any = { time: point.time.toFixed(1) };
  //     point.state.forEach((value, stockName) => {
  //       dataPoint[stockName] = Number(value.toFixed(2));
  //     });
  //     return dataPoint;
  //   });
  // }, [model.history]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>System Dynamics Modeler</h1>
      </header>

      {/* Main content area with collapsible layout */}
      <div className="main-content">
        <div style={{ display: 'flex', height: '100%' }}>
          {/* Left: DSL Editor with collapse functionality */}
          {!isEditorCollapsed && (
            <>
              <div className="editor-panel" style={{
                width: '35%',
                minWidth: '300px',
                position: 'relative',
              }}>
                <button
                  onClick={() => setIsEditorCollapsed(true)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    zIndex: 10,
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                  title="Hide Editor"
                >
                  ←
                </button>
                <DSLEditor
                  code={dslCode}
                  onChange={setDslCode}
                  onModelUpdate={useCallback((newModel) => {
                    setModel(newModel);
                    setModelVersion(prev => prev + 1);
                  }, [])}
                />
              </div>

              {/* Resizer */}
              <div
                className="Resizer"
                style={{
                  width: '3px',
                  background: '#ddd',
                  cursor: 'col-resize',
                  flexShrink: 0
                }}
              />
            </>
          )}

          {/* Show Editor button when collapsed */}
          {isEditorCollapsed && (
            <button
              onClick={() => setIsEditorCollapsed(false)}
              style={{
                position: 'absolute',
                left: '12px',
                top: '80px',
                zIndex: 10,
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
              title="Show Editor"
            >
              Code ⚙️
            </button>
          )}

          {/* Center: Diagram and Graph with collapse functionality */}
          <div className="visualization-panel" style={{
            flex: 1,
            position: 'relative',
            display: isMainViewCollapsed ? 'none' : 'flex',
            flexDirection: 'column',
          }}>
            <button
              onClick={() => setIsMainViewCollapsed(true)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 10,
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              title="Hide Main View"
            >
              →
            </button>
            <div className="diagram-container">
              <SystemDiagram model={model} />
            </div>
            <div className="graph-container">
              <SystemGraph
                key={modelVersion}
                model={model}
                isRunning={isRunning}
                currentTime={currentTime}
              />
            </div>
          </div>

          {/* Show Main View button when collapsed */}
          {isMainViewCollapsed && (
            <button
              onClick={() => setIsMainViewCollapsed(false)}
              style={{
                position: 'absolute',
                left: '50%',
                top: '80px',
                transform: 'translateX(-50%)',
                zIndex: 10,
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
              title="Show Main View"
            >
              Main View 📊
            </button>
          )}

          {/* Right: Graph Sidebar */}
          {/* <GraphSidebar
            model={model}
            data={graphData}
            isCollapsed={isGraphSidebarCollapsed}
            onToggleCollapse={() => setIsGraphSidebarCollapsed(!isGraphSidebarCollapsed)}
          /> */}
        </div>
      </div>

      {/* Bottom: Controls */}
      <div className="controls-bar">
        <SimulationControls
          model={model}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          onTimeUpdate={setCurrentTime}
        />
      </div>
    </div>
  );
}

export default App;
