import { useEffect, useState, useRef } from 'react';
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
import { SystemModel } from '../models/SystemModel';

interface SystemGraphProps {
  model: SystemModel;
  isRunning: boolean;
  currentTime: number;
}

export function SystemGraph({ model }: SystemGraphProps) {
  const [data, setData] = useState<any[]>([]);
  const [showTable, setShowTable] = useState(false);
  const dataRef = useRef<any[]>([]);

  // Colors for each stock
  const colors = ['#3182bd', '#31a354', '#fd8d3c', '#756bb1', '#e6550d'];

  // Update graph data when model changes
  useEffect(() => {
    // Check if model was reset (time back to 0 or near 0)
    if (model.time < 0.1 && data.length > 0) {
      // Model was reset, clear graph data
      setData([]);
      return;
    }

    if (model.history.length > 0) {
      const latestPoint = model.history[model.history.length - 1];
      const newPoint: any = { time: latestPoint.time.toFixed(1) };

      latestPoint.state.forEach((value, stockName) => {
        newPoint[stockName] = Number(value.toFixed(2));
      });

      setData(prev => {
        // If time went backwards, it's a reset - start fresh
        if (prev.length > 0 && latestPoint.time < Number(prev[prev.length - 1].time)) {
          return [newPoint];
        }

        const updated = [...prev, newPoint];
        // Keep all points to show complete simulation
        return updated;
      });
    }

    // Listen for model updates
    const handleModelUpdate = () => {
      // Check if model was reset
      if (model.time < 0.1) {
        setData([]);
        return;
      }

      if (model.history.length > 0) {
        const latestPoint = model.history[model.history.length - 1];
        const newPoint: any = { time: latestPoint.time.toFixed(1) };

        latestPoint.state.forEach((value, stockName) => {
          newPoint[stockName] = Number(value.toFixed(2));
        });

        setData(prev => {
          // If time went backwards, it's a reset
          if (prev.length > 0 && latestPoint.time < Number(prev[prev.length - 1].time)) {
            return [newPoint];
          }

          // Check if this point already exists
          const lastPoint = prev[prev.length - 1];
          if (lastPoint && lastPoint.time === newPoint.time) {
            // Update existing point
            return [...prev.slice(0, -1), newPoint];
          } else {
            // Add new point
            const updated = [...prev, newPoint];
            return updated;
          }
        });
      }
    };

    window.addEventListener('modelUpdate', handleModelUpdate);
    return () => {
      window.removeEventListener('modelUpdate', handleModelUpdate);
    };
  }, [model]);

  // Get stock names for legend
  const stockNames = Array.from(model.stocks.keys());

  return (
    <div style={{ padding: '20px', background: 'white', height: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h3 style={{ margin: 0 }}>System Behavior</h3>
        <button
          onClick={() => setShowTable(!showTable)}
          style={{
            padding: '5px 10px',
            background: '#ecf0f1',
            border: '1px solid #bdc3c7',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {showTable ? 'Show Graph' : 'Show Table'}
        </button>
      </div>

      {!showTable ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
            <XAxis
              dataKey="time"
              label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
            />
            <YAxis />
            <Tooltip />
            <Legend />

            {stockNames.map((name, index) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{
          height: '200px',
          overflow: 'auto',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#ecf0f1', position: 'sticky', top: 0 }}>
                <th style={{ padding: '5px', textAlign: 'left' }}>Time</th>
                {stockNames.map(name => (
                  <th key={name} style={{ padding: '5px', textAlign: 'right' }}>
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice().reverse().map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #ecf0f1' }}>
                  <td style={{ padding: '5px' }}>{row.time}</td>
                  {stockNames.map(name => (
                    <td key={name} style={{ padding: '5px', textAlign: 'right' }}>
                      {row[name]?.toFixed(2) || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}