import { Handle, Position } from 'reactflow';

export function CloudNode({ data }: any) {
  const isSource = data.label === 'Source';
  const cloudColor = isSource ? '#10b981' : '#f59e0b';
  const bgColor = isSource
    ? 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #dcfce7 100%)'
    : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)';

  return (
    <div style={{
      background: bgColor,
      border: `2px dashed ${cloudColor}`,
      borderRadius: '50%',
      width: '80px',
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      color: '#374151',
      position: 'relative',
      opacity: 0.9,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* All sides for auto-alignment */}
      {isSource ? (
        <>
          <Handle
            id="top"
            type="source"
            position={Position.Top}
            style={{
              top: -8,
              background: cloudColor,
              border: '2px solid white',
              width: '12px',
              height: '12px',
            }}
          />
          <Handle
            id="right"
            type="source"
            position={Position.Right}
            style={{
              right: -8,
              background: cloudColor,
              border: '2px solid white',
              width: '12px',
              height: '12px',
            }}
          />
          <Handle
            id="bottom"
            type="source"
            position={Position.Bottom}
            style={{
              bottom: -8,
              background: cloudColor,
              border: '2px solid white',
              width: '12px',
              height: '12px',
            }}
          />
          <Handle
            id="left"
            type="source"
            position={Position.Left}
            style={{
              left: -8,
              background: cloudColor,
              border: '2px solid white',
              width: '12px',
              height: '12px',
            }}
          />
        </>
      ) : (
        <>
          <Handle
            id="top"
            type="target"
            position={Position.Top}
            style={{
              top: -8,
              background: cloudColor,
              border: '2px solid white',
              width: '12px',
              height: '12px',
            }}
          />
          <Handle
            id="right"
            type="target"
            position={Position.Right}
            style={{
              right: -8,
              background: cloudColor,
              border: '2px solid white',
              width: '12px',
              height: '12px',
            }}
          />
          <Handle
            id="bottom"
            type="target"
            position={Position.Bottom}
            style={{
              bottom: -8,
              background: cloudColor,
              border: '2px solid white',
              width: '12px',
              height: '12px',
            }}
          />
          <Handle
            id="left"
            type="target"
            position={Position.Left}
            style={{
              left: -8,
              background: cloudColor,
              border: '2px solid white',
              width: '12px',
              height: '12px',
            }}
          />
        </>
      )}

      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '20px',
          marginBottom: '2px',
          filter: 'grayscale(20%)',
        }}>
          {isSource ? '☁️' : '🌤️'}
        </div>
        <div style={{
          fontWeight: '600',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
          color: cloudColor,
        }}>
          {data.label}
        </div>
      </div>
    </div>
  );
}