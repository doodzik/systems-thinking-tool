import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { SystemModel } from '../models/SystemModel';
import { useCallback, useEffect } from 'react';

interface ModelCanvasProps {
  model: SystemModel;
  onModelChange?: () => void;
}

/**
 * Visual canvas for system model using React Flow
 */
export function ModelCanvas({ model, onModelChange }: ModelCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  /**
   * Convert model to React Flow elements
   */
  const updateVisualization = useCallback(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Position stocks horizontally
    let x = 100;
    const y = 200;
    const spacing = 250;

    // Create nodes for stocks
    model.stocks.forEach((stock, name) => {
      newNodes.push({
        id: name,
        type: 'stock',
        data: {
          label: name,
          value: stock.value,
          units: stock.units,
          min: stock.min,
          max: stock.max
        },
        position: { x, y },
        style: {
          background: '#3182bd',
          color: 'white',
          borderRadius: '8px',
          padding: '10px',
          border: '2px solid #1e5a8a',
          fontWeight: 'bold'
        }
      });
      x += spacing;
    });

    // Create edges for flows
    model.flows.forEach((flow, name) => {
      if (flow.from && flow.to) {
        const rate = typeof flow.rate === 'function'
          ? flow.rate(model).toFixed(2)
          : flow.rate.toFixed(2);

        newEdges.push({
          id: name,
          source: flow.from.name,
          target: flow.to.name,
          label: `${rate}/s`,
          animated: true,
          style: {
            stroke: '#666',
            strokeWidth: 2
          }
        });
      }

      // Handle sources (from = null)
      if (!flow.from && flow.to) {
        // Create a cloud node for source
        const cloudId = `source-${name}`;
        newNodes.push({
          id: cloudId,
          type: 'input',
          data: { label: '∞' },
          position: { x: x - spacing - 100, y },
          style: {
            background: '#e0e0e0',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        });

        const rate = typeof flow.rate === 'function'
          ? flow.rate(model).toFixed(2)
          : flow.rate.toFixed(2);

        newEdges.push({
          id: name,
          source: cloudId,
          target: flow.to.name,
          label: `${rate}/s`,
          animated: true,
          style: {
            stroke: '#666',
            strokeWidth: 2
          }
        });
      }

      // Handle sinks (to = null)
      if (flow.from && !flow.to) {
        // Create a cloud node for sink
        const cloudId = `sink-${name}`;
        newNodes.push({
          id: cloudId,
          type: 'output',
          data: { label: '∞' },
          position: { x: x + 100, y },
          style: {
            background: '#e0e0e0',
            borderRadius: '50%',
            width: '50px',
            height: '50px'
          }
        });

        const rate = typeof flow.rate === 'function'
          ? flow.rate(model).toFixed(2)
          : flow.rate.toFixed(2);

        newEdges.push({
          id: name,
          source: flow.from.name,
          target: cloudId,
          label: `${rate}/s`,
          animated: true,
          style: {
            stroke: '#666',
            strokeWidth: 2
          }
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [model, setNodes, setEdges]);

  // Update visualization when model changes
  useEffect(() => {
    updateVisualization();
  }, [updateVisualization]);

  // Handle new connections
  const onConnect = useCallback((params: any) => {
    // This would add a new flow to the model
    if (params.source && params.target) {
      const fromStock = model.stocks.get(params.source);
      const toStock = model.stocks.get(params.target);

      if (fromStock && toStock) {
        model.addFlow(
          `Flow-${Date.now()}`,
          fromStock,
          toStock,
          10 // Default rate
        );

        if (onModelChange) onModelChange();
        updateVisualization();
      }
    }
  }, [model, onModelChange, updateVisualization]);

  // Custom node component for stocks
  const StockNode = ({ data }: any) => (
    <div style={{ padding: '10px', textAlign: 'center' }}>
      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{data.label}</div>
      <div style={{ fontSize: '20px', margin: '5px 0' }}>
        {data.value?.toFixed(1) || 0}
      </div>
      {data.units && (
        <div style={{ fontSize: '10px', opacity: 0.8 }}>{data.units}</div>
      )}
    </div>
  );

  const nodeTypes = {
    stock: StockNode
  };

  return (
    <div style={{ height: '500px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}