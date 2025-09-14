import { type Node, Position } from 'reactflow';

// Returns the position (top,right,bottom or left) passed node compared to the other node
function getParams(nodeA: Node, nodeB: Node) {
  const centerA = getNodeCenter(nodeA);
  const centerB = getNodeCenter(nodeB);

  const horizontalDiff = Math.abs(centerA.x - centerB.x);
  const verticalDiff = Math.abs(centerA.y - centerB.y);

  let position;

  // If the horizontal difference is greater than the vertical, connect horizontally
  if (horizontalDiff > verticalDiff) {
    position = centerA.x > centerB.x ? Position.Left : Position.Right;
  } else {
    // Otherwise connect vertically
    position = centerA.y > centerB.y ? Position.Top : Position.Bottom;
  }

  const [x, y] = getHandleCoordsByPosition(nodeA, position);
  return [x, y, position];
}

function getHandleCoordsByPosition(node: Node, handlePosition: Position): [number, number] {
  // Use the position from the node internals if available, otherwise from the node data
  const x = node.positionAbsolute?.x || node.position.x;
  const y = node.positionAbsolute?.y || node.position.y;
  const width = node.width || 140;
  const height = node.height || 80;

  switch (handlePosition) {
    case Position.Top:
      return [x + width / 2, y];
    case Position.Right:
      return [x + width, y + height / 2];
    case Position.Bottom:
      return [x + width / 2, y + height];
    case Position.Left:
      return [x, y + height / 2];
    default:
      return [x, y];
  }
}

function getNodeCenter(node: Node) {
  const x = node.positionAbsolute?.x || node.position.x;
  const y = node.positionAbsolute?.y || node.position.y;
  const width = node.width || 140;
  const height = node.height || 80;

  return {
    x: x + width / 2,
    y: y + height / 2,
  };
}

export function getEdgeParams(source: Node, target: Node) {
  const [sx, sy, sourcePos] = getParams(source, target);
  const [tx, ty, targetPos] = getParams(target, source);

  return {
    sx,
    sy,
    tx,
    ty,
    sourcePos,
    targetPos,
  };
}