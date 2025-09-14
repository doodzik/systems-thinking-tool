import { useMemo } from 'react';
import { Handle, Position } from 'reactflow';

interface StockNodeProps {
  data: {
    name: string;
    value: number;
    units?: string;
    history?: Array<{ time: number; value: number }>;
    initialValue?: number;
    min?: number;
    max?: number;
  };
}

function Sparkline({ data, width = 60, height = 20 }: {
  data: number[];
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  if (range === 0) {
    const y = height / 2;
    return (
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <line x1={0} y1={y} x2={width} y2={y} stroke="#9ca3af" strokeWidth={1} />
      </svg>
    );
  }

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const trend = data[data.length - 1] > data[0] ? '#10b981' : '#ef4444';

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        points={points}
        fill="none"
        stroke={trend}
        strokeWidth={1.5}
        opacity={0.8}
      />
    </svg>
  );
}

export function StockNode({ data }: StockNodeProps) {
  const { changeRate, changeColor, changeIcon, trendValues, constraintStatus, constraintIndicator } = useMemo(() => {
    const history = data.history || [];
    const currentValue = data.value || 0;
    const initialValue = data.initialValue || currentValue;

    // Calculate percentage change from initial
    const totalChangePercent = initialValue !== 0
      ? ((currentValue - initialValue) / initialValue) * 100
      : 0;

    // Calculate recent trend (last 5 data points for rate)
    const recentHistory = history.slice(-10);
    let recentChangeRate = 0;

    if (recentHistory.length >= 2) {
      const recent = recentHistory[recentHistory.length - 1]?.value || currentValue;
      const previous = recentHistory[recentHistory.length - 2]?.value || recent;

      if (previous !== 0) {
        recentChangeRate = ((recent - previous) / Math.abs(previous)) * 100;
      }
    }

    // Determine colors and icons based on recent trend
    let changeColor = '#6b7280'; // gray for no change
    let changeIcon = '—';

    if (Math.abs(recentChangeRate) > 0.1) { // Only show change if > 0.1%
      if (recentChangeRate > 0) {
        changeColor = '#10b981'; // green for positive
        changeIcon = '↗';
      } else {
        changeColor = '#ef4444'; // red for negative
        changeIcon = '↘';
      }
    }

    // Extract values for sparkline (last 20 points)
    const sparklineData = recentHistory.length > 0
      ? recentHistory.slice(-20).map(h => h.value)
      : [currentValue];

    // Check for constraint boundaries
    const tolerance = 0.001; // Small tolerance for floating point comparison
    let constraintStatus: 'none' | 'floor' | 'ceiling' = 'none';
    let constraintIndicator = '';

    if (data.min !== undefined && Math.abs(currentValue - data.min) < tolerance) {
      constraintStatus = 'floor';
      constraintIndicator = '⚠️ Floor';
    } else if (data.max !== undefined && Math.abs(currentValue - data.max) < tolerance) {
      constraintStatus = 'ceiling';
      constraintIndicator = '⚠️ Ceiling';
    }

    return {
      changeRate: Math.abs(recentChangeRate),
      changeColor,
      changeIcon,
      trendValues: sparklineData,
      constraintStatus,
      constraintIndicator,
    };
  }, [data.value, data.history, data.initialValue, data.min, data.max]);

  const backgroundGradient = constraintStatus === 'floor'
    ? 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)' // Amber for floor constraint
    : constraintStatus === 'ceiling'
    ? 'linear-gradient(135deg, #ffffff 0%, #fde68a 100%)' // Yellow for ceiling constraint
    : changeColor === '#10b981'
    ? 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)'
    : changeColor === '#ef4444'
    ? 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)'
    : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)';

  return (
    <div style={{
      background: backgroundGradient,
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      padding: '12px 16px',
      minWidth: '140px',
      minHeight: '80px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      position: 'relative',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* East/West handles only */}
      <Handle id="in-1" type="target" position={Position.Left} style={{ top: '15%', background: '#3b82f6', width: '6px', height: '6px' }} />
      <Handle id="in-2" type="target" position={Position.Left} style={{ top: '30%', background: '#3b82f6', width: '6px', height: '6px' }} />
      <Handle id="in-3" type="target" position={Position.Left} style={{ top: '45%', background: '#3b82f6', width: '6px', height: '6px' }} />
      <Handle id="in-4" type="target" position={Position.Left} style={{ top: '60%', background: '#3b82f6', width: '6px', height: '6px' }} />
      <Handle id="in-5" type="target" position={Position.Left} style={{ top: '75%', background: '#3b82f6', width: '6px', height: '6px' }} />
      <Handle id="in-6" type="target" position={Position.Left} style={{ top: '85%', background: '#3b82f6', width: '6px', height: '6px' }} />

      <Handle id="out-1" type="source" position={Position.Right} style={{ top: '15%', background: '#3b82f6', width: '6px', height: '6px' }} />
      <Handle id="out-2" type="source" position={Position.Right} style={{ top: '30%', background: '#3b82f6', width: '6px', height: '6px' }} />
      <Handle id="out-3" type="source" position={Position.Right} style={{ top: '45%', background: '#3b82f6', width: '6px', height: '6px' }} />
      <Handle id="out-4" type="source" position={Position.Right} style={{ top: '60%', background: '#3b82f6', width: '6px', height: '6px' }} />
      <Handle id="out-5" type="source" position={Position.Right} style={{ top: '75%', background: '#3b82f6', width: '6px', height: '6px' }} />
      <Handle id="out-6" type="source" position={Position.Right} style={{ top: '85%', background: '#3b82f6', width: '6px', height: '6px' }} />

      <Handle id="info-1" type="source" position={Position.Right} style={{ top: '25%', background: '#6b7280', width: '4px', height: '4px' }} />
      <Handle id="info-2" type="source" position={Position.Right} style={{ top: '35%', background: '#6b7280', width: '4px', height: '4px' }} />
      <Handle id="info-3" type="source" position={Position.Right} style={{ top: '65%', background: '#6b7280', width: '4px', height: '4px' }} />
      <Handle id="info-4" type="source" position={Position.Right} style={{ top: '55%', background: '#6b7280', width: '4px', height: '4px' }} />

      {/* Header with name and change indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: '#3b82f6',
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
        }}>
          {data.name}
        </div>

        {(constraintStatus !== 'none' || changeRate > 0.1) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '10px',
            fontWeight: '600',
            color: constraintStatus !== 'none' ? '#f59e0b' : changeColor,
            gap: '2px',
          }}>
            {constraintStatus !== 'none' ? (
              <span>{constraintIndicator}</span>
            ) : (
              <>
                <span>{changeIcon}</span>
                <span>{changeRate.toFixed(1)}%</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main value */}
      <div style={{
        fontSize: '28px',
        fontWeight: '700',
        color: '#1f2937',
        textAlign: 'center',
        lineHeight: '1',
        marginBottom: '4px',
      }}>
        {data.value?.toLocaleString(undefined, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }) || '0.0'}
      </div>

      {/* Units */}
      {data.units && (
        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          textAlign: 'center',
          marginBottom: '8px',
          fontWeight: '500',
        }}>
          {data.units}
        </div>
      )}

      {/* Mini sparkline */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '6px',
      }}>
        <Sparkline data={trendValues} />
      </div>

    </div>
  );
}