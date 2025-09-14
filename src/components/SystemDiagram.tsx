import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
  Panel,
  ConnectionMode,
  updateEdge,
  addEdge,
  getNodesBounds,
  getViewportForBounds,
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { SystemModel } from '../models/SystemModel';
import { StockNode } from './nodes/StockNode';
import { FlowNode } from './nodes/FlowNode';
import { CloudNode } from './nodes/CloudNode';
import { useEffect, useCallback, useState } from 'react';
import { getLayoutedElements, getSmartHierarchicalLayout } from '../utils/layoutEngine';
import { MetricsPanel } from './MetricsPanel';
import { DebugPanel } from './DebugPanel';
import FloatingEdge from './edges/FloatingEdge';

const nodeTypes = {
  stock: StockNode,
  flow: FlowNode,
  cloud: CloudNode,
};

const edgeTypes = {
  floating: FloatingEdge,
};


interface SystemDiagramProps {
  model: SystemModel;
}

// Auto-layout algorithms
const autoLayoutGrid = (nodes: Node[]): Node[] => {
  const gridSize = Math.ceil(Math.sqrt(nodes.length));
  const spacing = 250; // Increased spacing to prevent overlap
  const offsetX = 150;
  const offsetY = 150;

  return nodes.map((node, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    return {
      ...node,
      position: {
        x: offsetX + col * spacing,
        y: offsetY + row * spacing,
      },
    };
  });
};

const autoLayoutHierarchical = (nodes: Node[], edges: Edge[]): Node[] => {
  const stockNodes = nodes.filter(n => n.type === 'stock');
  const flowNodes = nodes.filter(n => n.type === 'flow');
  const cloudNodes = nodes.filter(n => n.type === 'cloud');

  const baseSpacing = 250;
  const stockY = 300;
  const sourceY = 150;
  const sinkY = 450;
  const flowOffsetY = 75; // Flows positioned between levels

  // Position stocks in the middle level with generous spacing
  stockNodes.forEach((node, index) => {
    node.position = {
      x: 150 + index * baseSpacing,
      y: stockY,
    };
  });

  // Collect sources and sinks separately
  const sourceNodes = cloudNodes.filter(n => n.data.label === 'Source');
  const sinkNodes = cloudNodes.filter(n => n.data.label === 'Sink');

  // Position source clouds at top level
  sourceNodes.forEach((node, index) => {
    node.position = {
      x: 100 + index * (baseSpacing * 0.8),
      y: sourceY,
    };
  });

  // Position sink clouds at bottom level
  sinkNodes.forEach((node, index) => {
    node.position = {
      x: 100 + index * (baseSpacing * 0.8),
      y: sinkY,
    };
  });

  // Position flows intelligently based on their connections
  flowNodes.forEach((flowNode, index) => {
    // Find incoming and outgoing edges for this flow
    const incomingEdge = edges.find(e => e.target === flowNode.id && !e.id.startsWith('info-'));
    const outgoingEdge = edges.find(e => e.source === flowNode.id && !e.id.startsWith('info-'));

    let xPos = 200 + index * baseSpacing; // Default fallback
    let yPos = stockY - flowOffsetY; // Default between source and stock level

    if (incomingEdge && outgoingEdge) {
      // Flow has both input and output - position between them
      const sourceNode = nodes.find(n => n.id === incomingEdge.source);
      const targetNode = nodes.find(n => n.id === outgoingEdge.target);

      if (sourceNode && targetNode) {
        xPos = (sourceNode.position.x + targetNode.position.x) / 2;
        yPos = (sourceNode.position.y + targetNode.position.y) / 2;
      }
    } else if (incomingEdge) {
      // Flow has input only - position slightly offset from source
      const sourceNode = nodes.find(n => n.id === incomingEdge.source);
      if (sourceNode) {
        xPos = sourceNode.position.x + 100;
        yPos = sourceNode.position.y + (stockY - sourceNode.position.y) / 2;
      }
    } else if (outgoingEdge) {
      // Flow has output only - position slightly offset from target
      const targetNode = nodes.find(n => n.id === outgoingEdge.target);
      if (targetNode) {
        xPos = targetNode.position.x - 100;
        yPos = targetNode.position.y - (targetNode.position.y - sourceY) / 2;
      }
    }

    flowNode.position = { x: xPos, y: yPos };
  });

  return [...stockNodes, ...flowNodes, ...cloudNodes];
};

const autoLayoutForceDirected = (nodes: Node[], edges: Edge[]): Node[] => {
  // Improved force-directed layout simulation
  const iterations = 200;
  const repulsionStrength = 12000;
  const attractionStrength = 0.015;
  const dampening = 0.88;
  const minDistance = 220; // Increased minimum distance between nodes

  // Start with a much better initial positioning to avoid chaos
  const stockNodes = nodes.filter(n => n.type === 'stock');
  const cloudNodes = nodes.filter(n => n.type === 'cloud');
  const flowNodes = nodes.filter(n => n.type === 'flow');

  // Hierarchical positioning for left-to-right flow alignment
  const sourceNodes = cloudNodes.filter(n => n.data.label === 'Source');
  const sinkNodes = cloudNodes.filter(n => n.data.label === 'Sink');

  // Layer 1: Sources on the left
  sourceNodes.forEach((node, index) => {
    node.position = {
      x: 100,
      y: 150 + index * 200,
    };
  });

  // Layer 2: Stocks in the center-left
  stockNodes.forEach((node, index) => {
    node.position = {
      x: 300 + (index % 2) * 300, // Side by side if multiple stocks
      y: 200 + Math.floor(index / 2) * 250,
    };
  });

  // Layer 3: Flows positioned between their connected stocks
  flowNodes.forEach((node, index) => {
    node.position = {
      x: 500 + index * 150,
      y: 200 + index * 100,
    };
  });

  // Layer 4: Sinks on the right
  sinkNodes.forEach((node, index) => {
    node.position = {
      x: 800,
      y: 150 + index * 200,
    };
  });

  // Initialize velocities
  const velocities = new Map<string, { vx: number; vy: number }>();
  nodes.forEach(node => {
    velocities.set(node.id, { vx: 0, vy: 0 });
  });

  for (let iter = 0; iter < iterations; iter++) {
    // Calculate repulsive forces between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        const dx = nodeB.position.x - nodeA.position.x;
        const dy = nodeB.position.y - nodeA.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        if (distance < minDistance) {
          const force = repulsionStrength / Math.max(distance * distance, 100);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          const velA = velocities.get(nodeA.id)!;
          const velB = velocities.get(nodeB.id)!;

          velA.vx -= fx;
          velA.vy -= fy;
          velB.vx += fx;
          velB.vy += fy;
        }
      }
    }

    // Calculate attractive forces along edges
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        const dx = targetNode.position.x - sourceNode.position.x;
        const dy = targetNode.position.y - sourceNode.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const idealDistance = 150;
        const force = attractionStrength * (distance - idealDistance);
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        // Add directional bias for left-to-right flow
        const leftToRightBias = 0.005;
        const topToBottomBias = 0.002;

        const velSource = velocities.get(sourceNode.id)!;
        const velTarget = velocities.get(targetNode.id)!;

        velSource.vx += fx;
        velSource.vy += fy;
        velTarget.vx -= fx;
        velTarget.vy -= fy;
      }
    });

    // Apply directional bias forces for left-to-right and top-to-bottom layout
    nodes.forEach(node => {
      const vel = velocities.get(node.id)!;

      // Sources should stay left, sinks should move right
      if (node.type === 'cloud') {
        if (node.data.label === 'Source') {
          vel.vx -= leftToRightBias * 2; // Keep sources left
        } else if (node.data.label === 'Sink') {
          vel.vx += leftToRightBias * 2; // Push sinks right
        }
      }

      // Stocks should be centered, flows should flow from left to right
      if (node.type === 'flow') {
        vel.vx += leftToRightBias; // Slight rightward bias for flows
        vel.vy += topToBottomBias; // Slight downward bias for hierarchical look
      }
    });

    // Update positions and apply dampening
    nodes.forEach(node => {
      const vel = velocities.get(node.id)!;

      node.position.x += vel.vx;
      node.position.y += vel.vy;

      vel.vx *= dampening;
      vel.vy *= dampening;

      // Keep nodes within bounds with padding
      node.position.x = Math.max(100, Math.min(1100, node.position.x));
      node.position.y = Math.max(80, Math.min(600, node.position.y));
    });
  }

  return nodes;
};

export function SystemDiagram({ model }: SystemDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutType, setLayoutType] = useState<'hierarchical' | 'grid' | 'force'>('hierarchical');
  const [showMetrics, setShowMetrics] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const generateLayout = useCallback(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Create nodes for stocks with history data
    model.stocks.forEach((stock, name) => {
      // Extract history for this specific stock
      const stockHistory = model.history.map(entry => ({
        time: entry.time,
        value: entry.state.get(name) || stock.value,
      }));

      // Get initial value from first history entry or current value
      const initialValue = model.history.length > 0
        ? model.history[0].state.get(name) || stock.value
        : stock.value;

      newNodes.push({
        id: `stock-${name}`,
        type: 'stock',
        position: { x: 100, y: 200 }, // Will be repositioned by layout
        data: {
          name,
          value: stock.value,
          units: stock.units,
          history: stockHistory,
          initialValue,
          min: stock.min,
          max: stock.max,
        },
        draggable: true,
      });
    });

    // Add flows and clouds with complete connection logic
    model.flows.forEach((flow, flowName) => {
      const valveId = `flow-${flowName}`;

      // Calculate current flow rate for display
      const currentRate = typeof flow.rate === 'function'
        ? flow.rate(model)
        : flow.rate;

      // Always create the flow valve first
      newNodes.push({
        id: valveId,
        type: 'flow',
        position: { x: 200, y: 175 }, // Will be repositioned by layout
        data: {
          name: flowName,
          rate: flow.rate,
          currentRate,
        },
        draggable: true,
      });

      // Handle source (from) - Physical flow connection
      if (!flow.from) {
        // Create source cloud
        const cloudId = `cloud-source-${flowName}`;
        newNodes.push({
          id: cloudId,
          type: 'cloud',
          position: { x: 50, y: 150 },
          data: { label: 'Source' },
          draggable: true,
        });

        // Connect source cloud to flow (physical connection)
        newEdges.push({
          id: `${cloudId}-${valveId}`,
          source: cloudId,
          target: valveId,
          type: 'floating',
          animated: true,
          style: { stroke: '#34495e', strokeWidth: 3 },
        });
      } else {
        // Connect from stock to flow (physical connection)
        newEdges.push({
          id: `stock-${flow.from.name}-${valveId}`,
          source: `stock-${flow.from.name}`,
          target: valveId,
          type: 'floating',
          animated: true,
          style: { stroke: '#34495e', strokeWidth: 3 },
        });
      }

      // Handle target (to) - Physical flow connection
      if (!flow.to) {
        // Create sink cloud
        const sinkId = `cloud-sink-${flowName}`;
        newNodes.push({
          id: sinkId,
          type: 'cloud',
          position: { x: 350, y: 150 },
          data: { label: 'Sink' },
          draggable: true,
        });

        // Connect flow to sink cloud (physical connection)
        newEdges.push({
          id: `${valveId}-${sinkId}`,
          source: valveId,
          target: sinkId,
          type: 'floating',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#34495e',
          },
          style: { stroke: '#34495e', strokeWidth: 3 },
        });
      } else {
        // Connect flow to target stock (physical connection)
        newEdges.push({
          id: `${valveId}-stock-${flow.to.name}`,
          source: valveId,
          target: `stock-${flow.to.name}`,
          type: 'floating',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#34495e',
          },
          style: { stroke: '#34495e', strokeWidth: 3 },
        });
      }

      // Handle information links for dynamic rates
      if (typeof flow.rate === 'function' && flow.rateExpression) {
        // Use the original DSL expression to find dependencies
        const rateExpr = flow.rateExpression;

        // Look for stock names in the rate expression
        model.stocks.forEach((stock, stockName) => {
          // Check if this stock name appears in the expression and isn't the source/target stock
          const stockRegex = new RegExp('\\b' + stockName + '\\b');
          if (stockRegex.test(rateExpr) && stockName !== flow.from?.name && stockName !== flow.to?.name) {
            // Add floating information link from stock to flow
            newEdges.push({
              id: `info-${stockName}-${valveId}`,
              source: `stock-${stockName}`,
              target: valveId,
              type: 'floating',
              animated: true,
              style: {
                stroke: '#9ca3af',
                strokeWidth: 1,
                strokeDasharray: '3,3',
                opacity: 0.7,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#9ca3af',
                width: 12,
                height: 12,
              },
              label: 'influences',
              labelStyle: {
                fontSize: '9px',
                color: '#6b7280',
                fontWeight: '500',
              },
              labelBgStyle: {
                fill: 'rgba(255, 255, 255, 0.8)',
                fillOpacity: 0.9,
                rx: 3,
                ry: 3,
              },
            });
          }
        });
      }
    });

    // Apply new smart layout algorithms
    let layoutedNodes = newNodes;
    let layoutedEdges = newEdges;

    switch (layoutType) {
      case 'grid':
        // Use improved grid layout
        layoutedNodes = autoLayoutGrid(newNodes);
        break;
      case 'force':
        // Use dagre for force-directed style
        const forceResult = getLayoutedElements(newNodes, newEdges, {
          direction: 'TB',
          nodeSpacing: 200,
          rankSpacing: 150,
        });
        layoutedNodes = forceResult.nodes;
        layoutedEdges = forceResult.edges;
        break;
      case 'hierarchical':
      default:
        // Use smart hierarchical layout
        const hierarchicalResult = getSmartHierarchicalLayout(newNodes, newEdges);
        layoutedNodes = hierarchicalResult.nodes;
        layoutedEdges = hierarchicalResult.edges;
        break;
    }

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [model, layoutType, setNodes, setEdges]);

  // Regenerate layout when model changes
  useEffect(() => {
    generateLayout();
  }, [generateLayout]);

  // Update node values when model changes
  useEffect(() => {
    setNodes(currentNodes =>
      currentNodes.map(node => {
        if (node.type === 'stock') {
          const stockName = node.data.name;
          const stock = model.stocks.get(stockName);
          if (stock) {
            return {
              ...node,
              data: {
                ...node.data,
                value: stock.value,
              },
            };
          }
        }
        return node;
      })
    );

    // Listen for model updates
    const handleModelUpdate = () => {
      setNodes(currentNodes =>
        currentNodes.map(node => {
          if (node.type === 'stock') {
            const stockName = node.data.name;
            const stock = model.stocks.get(stockName);
            if (stock) {
              return {
                ...node,
                data: {
                  ...node.data,
                  value: stock.value,
                },
              };
            }
          }
          return node;
        })
      );
    };

    window.addEventListener('modelUpdate', handleModelUpdate);
    return () => {
      window.removeEventListener('modelUpdate', handleModelUpdate);
    };
  }, [model, setNodes]);


  // Apply layout function
  const applyLayout = useCallback((type: 'hierarchical' | 'grid' | 'force') => {
    setLayoutType(type);
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      connectionMode={ConnectionMode.Loose}
      fitView
      attributionPosition="bottom-left"
      defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      minZoom={0.2}
      maxZoom={2}
    >
      <Background gap={16} size={1} />
      <Controls />

      {/* Layout controls test */}
      <Panel position="top-left">
        <div style={{
          background: 'white',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '5px',
          flexDirection: 'column',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
            Layout
          </div>

          <button
            onClick={() => applyLayout('hierarchical')}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              background: layoutType === 'hierarchical' ? '#3182bd' : '#f0f0f0',
              color: layoutType === 'hierarchical' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Hierarchical
          </button>

          <button
            onClick={() => applyLayout('grid')}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              background: layoutType === 'grid' ? '#3182bd' : '#f0f0f0',
              color: layoutType === 'grid' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Grid
          </button>

          <button
            onClick={() => applyLayout('force')}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              background: layoutType === 'force' ? '#3182bd' : '#f0f0f0',
              color: layoutType === 'force' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Force-Directed
          </button>
        </div>
      </Panel>

      {/* Metrics Panel */}
      <MetricsPanel
        model={model}
        isVisible={showMetrics}
        onToggle={() => setShowMetrics(!showMetrics)}
      />

      {/* Debug Panel */}
      <DebugPanel
        model={model}
        isVisible={showDebug}
        onToggle={() => setShowDebug(!showDebug)}
      />
    </ReactFlow>
  );
}