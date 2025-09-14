import { useCallback } from 'react';
import { getBezierPath, type EdgeProps } from 'reactflow';

export default function FlowEdge({
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
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Check if this should use orthogonal rendering
  // Use orthogonal when going from right to left (regardless of loop type)
  const isGoingRightToLeft = sourceX > targetX;
  const shouldUseOrthogonal = isGoingRightToLeft;
  let finalPath = edgePath;

  if (shouldUseOrthogonal) {
    // Use straight lines with 90-degree turns for right-to-left connections
    // Route around nodes to avoid crossing through them
    const nodeWidth = 140; // Approximate node width
    const nodeHeight = 80; // Approximate node height
    const clearance = 40; // Extra space to clear nodes
    const approachDistance = 20; // Distance to approach target straight-on

    // Route above nodes with extra clearance to avoid touching other nodes
    const routeY = Math.min(sourceY, targetY) - nodeHeight/2 - clearance;

    // Calculate departure and approach points - outside the nodes
    const departureX = sourceX + approachDistance; // Outside source node on the right side
    const approachX = targetX - approachDistance; // Outside target node on the left side

    // Create path: straight out → up → across → down to approach point → straight in
    finalPath = `M ${sourceX} ${sourceY} L ${departureX} ${sourceY} L ${departureX} ${routeY} L ${approachX} ${routeY} L ${approachX} ${targetY} L ${targetX} ${targetY}`;
  }

  return (
    <g className="react-flow__edge-flow">
      <path
        id={id}
        style={{
          stroke: '#2563eb', // Blue color for flows
          strokeWidth: 3,
          fill: 'none',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
          ...style,
        }}
        className="react-flow__edge-path"
        d={finalPath}
        markerEnd={markerEnd}
      />

      {/* Flow animation */}
      <path
        style={{
          stroke: '#60a5fa',
          strokeWidth: 2,
          fill: 'none',
          strokeDasharray: '5,10',
          strokeDashoffset: 0,
          opacity: 0.6,
          animation: 'flow-animation 2s linear infinite',
        }}
        d={finalPath}
      />

      <style jsx>{`
        @keyframes flow-animation {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -15;
          }
        }
      `}</style>
    </g>
  );
}