import { useState, useEffect, useRef } from 'react';
import { SystemModel } from '../models/SystemModel';

interface SimulationControlsProps {
  model: SystemModel;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  onTimeUpdate: (time: number) => void;
}

export function SimulationControls({
  model,
  isRunning,
  setIsRunning,
  onTimeUpdate
}: SimulationControlsProps) {
  const [speed, setSpeed] = useState(100);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Step function
  const step = () => {
    if (model.isTerminated) return;
    model.step(0.1);
    onTimeUpdate(model.time);
    // Force re-render by updating state
    window.dispatchEvent(new CustomEvent('modelUpdate'));
  };

  // Start/stop simulation
  const toggleRun = () => {
    if (isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsRunning(false);
    } else {
      intervalRef.current = setInterval(step, speed);
      setIsRunning(true);
    }
  };

  // Reset model
  const reset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    model.reset();
    onTimeUpdate(0);
    window.dispatchEvent(new CustomEvent('modelUpdate'));
  };

  // Fast simulation - run many steps quickly but capture intermediate states
  const runFast = (steps: number = 10000) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);

    // Run steps in batches to capture intermediate states for smooth graph
    const batchSize = Math.max(1, Math.floor(steps / 100)); // Capture ~100 points
    let completed = 0;

    const runBatch = () => {
      const stepsToRun = Math.min(batchSize, steps - completed);

      for (let i = 0; i < stepsToRun; i++) {
        if (model.isTerminated) break;
        model.step(0.1);
      }

      completed += stepsToRun;
      onTimeUpdate(model.time);
      window.dispatchEvent(new CustomEvent('modelUpdate'));

      if (completed < steps && !model.isTerminated) {
        // Use setTimeout to allow UI to update between batches
        setTimeout(runBatch, 0);
      }
    };

    runBatch();
  };

  // Update interval when speed changes
  useEffect(() => {
    if (isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(step, speed);
    }
  }, [speed]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      color: 'white',
    }}>
      <button
        onClick={step}
        disabled={isRunning}
        style={{
          padding: '8px 20px',
          background: isRunning ? '#7f8c8d' : '#27ae60',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          fontSize: '14px',
        }}
      >
        Step
      </button>

      <button
        onClick={toggleRun}
        style={{
          padding: '8px 20px',
          background: isRunning ? '#e74c3c' : '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        {isRunning ? '⏸ Pause' : '▶ Run'}
      </button>

      <button
        onClick={reset}
        style={{
          padding: '8px 20px',
          background: '#95a5a6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Reset
      </button>

      <button
        onClick={() => runFast(10000)}
        disabled={isRunning}
        style={{
          padding: '8px 20px',
          background: isRunning ? '#7f8c8d' : '#9b59b6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          fontSize: '14px',
        }}
      >
        ⚡ Fast (10k)
      </button>

      <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '10px' }}>Speed:</span>
        <input
          type="range"
          min="10"
          max="500"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          style={{ width: '150px' }}
        />
        <span style={{ marginLeft: '10px' }}>{speed}ms</span>
      </div>

      <div style={{ marginLeft: 'auto', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div>Time: {model.time.toFixed(1)}</div>
        {model.isTerminated && (
          <div style={{
            color: '#e74c3c',
            fontWeight: 'bold',
            padding: '4px 8px',
            background: 'rgba(231, 76, 60, 0.1)',
            borderRadius: '4px',
            border: '1px solid rgba(231, 76, 60, 0.3)',
          }}>
            TERMINATED
            {model.terminationExpression && (
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                ({model.terminationExpression})
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}