import { useMemo } from 'react';
import { Handle, Position } from 'reactflow';

interface FlowNodeProps {
  data: {
    name: string;
    rate: number | (() => number) | string;
    currentRate?: number;
    flowType?: 'inflow' | 'outflow' | 'internal';
    units?: string;
  };
}

function FlowIcon({ isAnimated = true, flowType = 'internal' }: {
  isAnimated?: boolean;
  flowType?: 'inflow' | 'outflow' | 'internal';
}) {
  const flowColor = flowType === 'inflow'
    ? '#10b981' // Green for inflows
    : flowType === 'outflow'
    ? '#f59e0b' // Orange for outflows
    : '#6366f1'; // Purple for internal flows

  return (
    <div style={{
      position: 'relative',
      width: '24px',
      height: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Animated flow pipe */}
      <div style={{
        width: '20px',
        height: '3px',
        background: flowColor,
        borderRadius: '2px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {isAnimated && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-8px',
              width: '8px',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${flowColor}, transparent)`,
              animation: 'flowAnimation 2s linear infinite',
            }}
          />
        )}
      </div>

      {/* Valve controls */}
      <div style={{
        position: 'absolute',
        top: '-4px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '0',
        height: '0',
        borderLeft: '3px solid transparent',
        borderRight: '3px solid transparent',
        borderBottom: `3px solid ${flowColor}`,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-4px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '0',
        height: '0',
        borderLeft: '3px solid transparent',
        borderRight: '3px solid transparent',
        borderTop: `3px solid ${flowColor}`,
      }} />

      <style>{`
        @keyframes flowAnimation {
          0% { left: -8px; }
          100% { left: 20px; }
        }
      `}</style>
    </div>
  );
}

export function FlowNode({ data }: FlowNodeProps) {
  const { displayRate, isFunction, flowColor, flowType } = useMemo(() => {
    const currentRate = data.currentRate || 0;
    const isFunc = typeof data.rate === 'function';

    let displayText = '0.0';
    let color = '#6366f1';
    let type: 'inflow' | 'outflow' | 'internal' = 'internal';

    if (isFunc) {
      displayText = currentRate.toFixed(1);
    } else if (typeof data.rate === 'number') {
      displayText = data.rate.toFixed(1);
    } else if (typeof data.rate === 'string') {
      displayText = data.rate;
    }

    // Determine flow type based on rate
    const rateValue = isFunc ? currentRate : (Number(data.rate) || 0);
    if (rateValue > 0) {
      type = data.name?.toLowerCase().includes('birth') || data.name?.toLowerCase().includes('inflow') ? 'inflow' : 'internal';
      color = type === 'inflow' ? '#10b981' : '#6366f1';
    } else if (rateValue < 0) {
      type = 'outflow';
      color = '#f59e0b';
    }

    return {
      displayRate: displayText,
      isFunction: isFunc,
      flowColor: color,
      flowType: type,
    };
  }, [data.rate, data.currentRate, data.name]);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      border: `2px solid ${flowColor}`,
      borderRadius: '8px',
      minWidth: '80px',
      height: '50px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      transition: 'all 0.2s ease',
    }}>
      {/* East/West handles only */}
      <Handle id="source-in-1" type="target" position={Position.Left} style={{ top: '25%', background: '#6366f1', width: '6px', height: '6px' }} />
      <Handle id="source-in-2" type="target" position={Position.Left} style={{ top: '45%', background: '#6366f1', width: '6px', height: '6px' }} />
      <Handle id="source-in-3" type="target" position={Position.Left} style={{ top: '65%', background: '#6366f1', width: '6px', height: '6px' }} />

      <Handle id="target-out-1" type="source" position={Position.Right} style={{ top: '25%', background: '#6366f1', width: '6px', height: '6px' }} />
      <Handle id="target-out-2" type="source" position={Position.Right} style={{ top: '45%', background: '#6366f1', width: '6px', height: '6px' }} />
      <Handle id="target-out-3" type="source" position={Position.Right} style={{ top: '65%', background: '#6366f1', width: '6px', height: '6px' }} />

      <Handle id="rate-control-1" type="target" position={Position.Left} style={{ top: '35%', background: '#f59e0b', width: '4px', height: '4px' }} />
      <Handle id="rate-control-2" type="target" position={Position.Left} style={{ top: '55%', background: '#f59e0b', width: '4px', height: '4px' }} />
      <Handle id="rate-control-3" type="target" position={Position.Left} style={{ top: '75%', background: '#f59e0b', width: '4px', height: '4px' }} />

      {/* Flow name */}
      <div style={{
        fontWeight: '600',
        fontSize: '10px',
        color: '#374151',
        marginBottom: '2px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '70px',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
      }}>
        {data.name || 'Flow'}
      </div>

      {/* Animated flow icon */}
      <div style={{ marginBottom: '3px' }}>
        <FlowIcon isAnimated={true} flowType={flowType} />
      </div>

      {/* Rate display with function indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
      }}>
        <span style={{
          fontSize: '9px',
          fontWeight: '600',
          color: flowColor,
          textAlign: 'center',
        }}>
          {displayRate}
        </span>
        {isFunction && (
          <span style={{
            fontSize: '8px',
            color: '#9ca3af',
            fontStyle: 'italic',
          }}>
            (f)
          </span>
        )}
      </div>

      {/* Units display */}
      {data.units && (
        <div style={{
          fontSize: '7px',
          color: '#9ca3af',
          textAlign: 'center',
          marginTop: '1px',
        }}>
          {data.units}
        </div>
      )}

    </div>
  );
}
