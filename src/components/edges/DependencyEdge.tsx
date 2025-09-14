import { getBezierPath, type EdgeProps } from 'reactflow';

export default function DependencyEdge({
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
    const clearance = 50; // Extra space to clear nodes (dependencies use lower route)
    const approachDistance = 20; // Distance to approach target straight-on

    // Route below nodes with extra clearance to avoid touching other nodes (dependencies use lower route)
    const routeY = Math.max(sourceY, targetY) + nodeHeight/2 + clearance;

    // Calculate departure and approach points - outside the nodes
    const departureX = sourceX + approachDistance; // Outside source node on the right side
    const approachX = targetX - approachDistance; // Outside target node on the left side

    // Create path: straight out → down → across → up to approach point → straight in
    finalPath = `M ${sourceX} ${sourceY} L ${departureX} ${sourceY} L ${departureX} ${routeY} L ${approachX} ${routeY} L ${approachX} ${targetY} L ${targetX} ${targetY}`;
  }

  return (
    <g className="react-flow__edge-dependency">
      <path
        id={id}
        style={{
          stroke: '#6b7280', // Gray color for dependencies
          strokeWidth: 2,
          fill: 'none',
          strokeDasharray: '5,5',
          opacity: 0.7,
          strokeLinecap: 'round',
          ...style,
        }}
        className="react-flow__edge-path"
        d={finalPath}
        markerEnd={markerEnd}
      />

      {/* Subtle glow effect */}
      <path
        style={{
          stroke: '#9ca3af',
          strokeWidth: 4,
          fill: 'none',
          strokeDasharray: '5,5',
          opacity: 0.1,
        }}
        d={finalPath}
      />
    </g>
  );
}