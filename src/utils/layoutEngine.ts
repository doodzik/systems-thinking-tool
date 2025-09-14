import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';

export interface LayoutOptions {
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  nodeSpacing: number;
  rankSpacing: number;
}

const defaultOptions: LayoutOptions = {
  direction: 'TB', // Top to bottom
  nodeSpacing: 200, // Horizontal spacing between nodes
  rankSpacing: 150, // Vertical spacing between ranks
};

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: Partial<LayoutOptions> = {}
) {
  const { direction, nodeSpacing, rankSpacing } = { ...defaultOptions, ...options };

  // Create a new directed graph
  const g = new dagre.graphlib.Graph();

  // Set graph attributes
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: 50,
    marginy: 50,
  });

  // Add nodes to the graph
  nodes.forEach((node) => {
    // Set different sizes for different node types
    let width = 140;
    let height = 80;

    switch (node.type) {
      case 'stock':
        width = 140;
        height = 80;
        break;
      case 'flow':
        width = 80;
        height = 50;
        break;
      case 'cloud':
        width = 80;
        height = 80;
        break;
    }

    g.setNode(node.id, { width, height });
  });

  // Add edges to the graph (excluding information links for layout calculation)
  edges.forEach((edge) => {
    // Skip information/dependency edges for layout calculation
    if (!edge.id.startsWith('info-')) {
      g.setEdge(edge.source, edge.target);
    }
  });

  // Calculate layout
  dagre.layout(g);

  // Apply the layout to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    const newNode = {
      ...node,
      targetPosition: node.sourcePosition,
      sourcePosition: node.targetPosition,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    };

    return newNode;
  });

  return { nodes: layoutedNodes, edges };
}

export function getSmartHierarchicalLayout(nodes: Node[], edges: Edge[]) {
  // Separate nodes by type for better organization
  const stockNodes = nodes.filter(n => n.type === 'stock');
  const flowNodes = nodes.filter(n => n.type === 'flow');
  const cloudNodes = nodes.filter(n => n.type === 'cloud');
  const sourceNodes = cloudNodes.filter(n => n.data.label === 'Source');
  const sinkNodes = cloudNodes.filter(n => n.data.label === 'Sink');

  const config = {
    nodeSpacing: 250,
    sourceY: 100,
    stockY: 300,
    sinkY: 500,
    flowOffsetY: 75,
    startX: 150,
  };

  // Position source clouds at the top
  sourceNodes.forEach((node, index) => {
    node.position = {
      x: config.startX + index * config.nodeSpacing,
      y: config.sourceY,
    };
  });

  // Position stocks in the middle
  stockNodes.forEach((node, index) => {
    node.position = {
      x: config.startX + index * config.nodeSpacing,
      y: config.stockY,
    };
  });

  // Position sink clouds at the bottom
  sinkNodes.forEach((node, index) => {
    node.position = {
      x: config.startX + index * config.nodeSpacing,
      y: config.sinkY,
    };
  });

  // Position flows intelligently based on their connections
  flowNodes.forEach((flowNode, index) => {
    // Find physical connections (not information links)
    const incomingEdge = edges.find(e =>
      e.target === flowNode.id && !e.id.startsWith('info-')
    );
    const outgoingEdge = edges.find(e =>
      e.source === flowNode.id && !e.id.startsWith('info-')
    );

    let xPos = config.startX + index * config.nodeSpacing;
    let yPos = config.stockY - config.flowOffsetY;

    if (incomingEdge && outgoingEdge) {
      // Flow connects two elements - position between them
      const sourceNode = nodes.find(n => n.id === incomingEdge.source);
      const targetNode = nodes.find(n => n.id === outgoingEdge.target);

      if (sourceNode && targetNode) {
        xPos = (sourceNode.position.x + targetNode.position.x) / 2;
        yPos = (sourceNode.position.y + targetNode.position.y) / 2;
      }
    } else if (incomingEdge) {
      // Flow has input only
      const sourceNode = nodes.find(n => n.id === incomingEdge.source);
      if (sourceNode) {
        xPos = sourceNode.position.x;
        yPos = sourceNode.position.y + config.flowOffsetY;
      }
    } else if (outgoingEdge) {
      // Flow has output only
      const targetNode = nodes.find(n => n.id === outgoingEdge.target);
      if (targetNode) {
        xPos = targetNode.position.x;
        yPos = targetNode.position.y - config.flowOffsetY;
      }
    }

    flowNode.position = { x: xPos, y: yPos };
  });

  return { nodes, edges };
}