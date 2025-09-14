import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { SystemModel } from '../models/SystemModel';

interface GraphConfig {
  name: string;
  title?: string;
  variables: string[];
  type?: 'line' | 'area';
  yAxisLabel?: string;
  color?: string;
}

interface CustomGraphProps {
  model: SystemModel;
  graphConfig: GraphConfig;
  data: any[];
}

export function CustomGraph({ model, graphConfig, data }: CustomGraphProps) {
  const [showTable, setShowTable] = useState(false);

  // Colors for different variables
  const colors = ['#3182bd', '#31a354', '#fd8d3c', '#756bb1', '#e6550d', '#c6dbef', '#6baed6'];

  // Filter data to only include the variables specified in the graph config
  const filteredData = data.map(point => {
    const newPoint: any = { time: point.time };
    graphConfig.variables.forEach(variable => {
      if (point[variable] !== undefined) {
        newPoint[variable] = point[variable];
      }
    });
    return newPoint;
  });

  const ChartComponent = graphConfig.type === 'area' ? AreaChart : LineChart;
  const DataComponent = graphConfig.type === 'area' ? Area : Line;

  return (
    <div style={{
      padding: '16px',
      background: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginBottom: '16px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h4 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
        }}>
          {graphConfig.title}
        </h4>
        <button
          onClick={() => setShowTable(!showTable)}
          style={{
            padding: '4px 8px',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#6b7280',
          }}
        >
          {showTable ? 'Graph' : 'Table'}
        </button>
      </div>

      {!showTable ? (
        <ResponsiveContainer width="100%" height={180}>
          <ChartComponent data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={{ stroke: '#d1d5db' }}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={{ stroke: '#d1d5db' }}
              label={{
                value: graphConfig.yAxisLabel || '',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '10px' }
              }}
            />
            <Tooltip
              contentStyle={{
                fontSize: '12px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '10px' }}
            />

            {graphConfig.variables.map((variable, index) => (
              <DataComponent
                key={variable}
                type="monotone"
                dataKey={variable}
                stroke={graphConfig.color || colors[index % colors.length]}
                fill={graphConfig.type === 'area' ? (graphConfig.color || colors[index % colors.length]) : undefined}
                fillOpacity={graphConfig.type === 'area' ? 0.3 : undefined}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </ChartComponent>
        </ResponsiveContainer>
      ) : (
        <div style={{
          height: '180px',
          overflow: 'auto',
          fontSize: '11px',
          fontFamily: 'monospace',
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                  Time
                </th>
                {graphConfig.variables.map(variable => (
                  <th key={variable} style={{
                    padding: '4px',
                    textAlign: 'right',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    {variable}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.slice().reverse().map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '4px' }}>{row.time}</td>
                  {graphConfig.variables.map(variable => (
                    <td key={variable} style={{ padding: '4px', textAlign: 'right' }}>
                      {row[variable]?.toFixed(2) || '-'}
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