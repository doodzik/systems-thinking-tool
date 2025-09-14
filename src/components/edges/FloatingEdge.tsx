import { useCallback } from 'react';
import { useStore, getSmoothStepPath, Position, type EdgeProps, type Node } from 'reactflow';

import { getEdgeParams } from './utils';

function FloatingEdge({ id, source, target, markerEnd, style }: EdgeProps) {
  const sourceNode = useStore(useCallback((store) => store.nodeInternals.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeInternals.get(target), [target]));

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

  const [edgePath] = getSmoothStepPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
  });

  return (
    <g>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={style}
      />
      {/* Source connection dot */}
      <circle
        cx={sx}
        cy={sy}
        r={3}
        fill={style?.stroke || '#b1b1b7'}
        className="react-flow__edge-connection-dot"
      />
      {/* Target connection dot */}
      <circle
        cx={tx}
        cy={ty}
        r={3}
        fill={style?.stroke || '#b1b1b7'}
        className="react-flow__edge-connection-dot"
      />
    </g>
  );
}

export default FloatingEdge;