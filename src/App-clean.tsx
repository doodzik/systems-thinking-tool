import { useState, useCallback } from 'react';
import { DSLEditor } from './components/DSLEditor';
import { SystemDiagram } from './components/SystemDiagram';
import { SimulationControls } from './components/SimulationControls';
import { SystemGraph } from './components/SystemGraph';
import { SystemModel } from './models/SystemModel';
import './App.css';

function App() {
  const [model, setModel] = useState<SystemModel>(new SystemModel());
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [modelVersion, setModelVersion] = useState(0);

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
}`);

  return (
    <div className="app">
      <header className="app-header">
        <h1>System Dynamics Modeler</h1>
      </header>

      {/* Main content area with split layout */}
      <div className="main-content">
        <div style={{ display: 'flex', height: '100%' }}>
          {/* Left: DSL Editor */}
          <div className="editor-panel" style={{ width: '40%', minWidth: '300px' }}>
            <DSLEditor
              code={dslCode}
              onChange={setDslCode}
              onModelUpdate={useCallback((newModel) => {
                setModel(newModel);
                setModelVersion(prev => prev + 1); // Increment version to force graph reset
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

          {/* Right: Diagram and Graph */}
          <div className="visualization-panel" style={{ flex: 1 }}>
            <div className="diagram-container">
              <SystemDiagram model={model} />
            </div>
            <div className="graph-container">
              <SystemGraph
                key={modelVersion} // Force re-render when model changes
                model={model}
                isRunning={isRunning}
                currentTime={currentTime}
              />
            </div>
          </div>
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