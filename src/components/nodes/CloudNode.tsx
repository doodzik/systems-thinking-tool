
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
      {/* Cloud connection handles */}
      {isSource ? (
        <Handle id="source-out" type="source" position={Position.Right} style={{ top: '50%', background: cloudColor, width: '8px', height: '8px' }} />
      ) : (
        <Handle id="sink-in" type="target" position={Position.Left} style={{ top: '50%', background: cloudColor, width: '8px', height: '8px' }} />
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