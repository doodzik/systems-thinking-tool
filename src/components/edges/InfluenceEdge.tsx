import { getSmoothStepPath, type EdgeProps } from 'reactflow';

export default function InfluenceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
    offset: 15,
  });

  // Use ELK bend points if available
  const elkPoints = data?.elkPoints || [];
  let pathWithBendPoints = edgePath;

  if (elkPoints.length > 0) {
    // Create smooth path with ELK bend points
    let pathString = `M ${sourceX} ${sourceY}`;

    if (elkPoints.length > 0) {
      // Add curves for smooth transitions
      pathString += ` Q ${elkPoints[0].x} ${elkPoints[0].y}`;

      for (let i = 1; i < elkPoints.length; i++) {
        const prev = elkPoints[i - 1];
        const curr = elkPoints[i];
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        pathString += ` ${midX} ${midY} Q ${curr.x} ${curr.y}`;
      }
    }

    pathString += ` ${targetX} ${targetY}`;
    pathWithBendPoints = pathString;
  }

  return (
    <g className="react-flow__edge-influence">
      <path
        id={id}
        style={{
          stroke: '#f97316', // Orange color for influences
          strokeWidth: 2,
          fill: 'none',
          strokeDasharray: '3,3',
          opacity: 0.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          ...style,
        }}
        className="react-flow__edge-path"
        d={pathWithBendPoints}
        markerEnd={markerEnd}
      />

      {/* Pulsing animation */}
      <path
        style={{
          stroke: '#fb923c',
          strokeWidth: 1,
          fill: 'none',
          strokeDasharray: '3,3',
          opacity: 0.4,
          animation: 'influence-pulse 3s ease-in-out infinite',
        }}
        d={pathWithBendPoints}
      />

      <style jsx>{`
        @keyframes influence-pulse {
          0%, 100% {
            opacity: 0.2;
            stroke-width: 1;
          }
          50% {
            opacity: 0.6;
            stroke-width: 3;
          }
        }
      `}</style>
    </g>
  );
}