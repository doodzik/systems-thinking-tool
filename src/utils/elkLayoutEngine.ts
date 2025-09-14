import ELK from 'elkjs/lib/elk.bundled.js';
import { Position } from 'reactflow';
import type { Node, Edge } from 'reactflow';

export interface ELKOptions {
  'elk.algorithm': string;
  'elk.layered.spacing.nodeNodeBetweenLayers': number;
  'elk.spacing.nodeNode': number;
  'elk.direction': 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';
  'elk.edgeRouting': 'ORTHOGONAL' | 'POLYLINE' | 'SPLINES';
  'elk.layered.unnecessaryBendpoints': boolean;
  'elk.layered.edgeSpacing.factor': number;
  'elk.port.labels.placement': string;
  'elk.portConstraints': 'FIXED_POS' | 'FIXED_ORDER' | 'FREE';
  'elk.layered.crossingMinimization.strategy': string;
  'elk.layered.nodePlacement.strategy': string;
}

export type LayoutMode = 'hierarchical' | 'grid' | 'force-directed';

export const ELK_CONFIGURATIONS: Record<LayoutMode, ELKOptions> = {
  hierarchical: {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.layered.spacing.edgeNodeBetweenLayers': '40',
    'elk.spacing.nodeNode': '40',
    'elk.layered.nodePlacement.strategy': 'SIMPLE',
    'elk.portConstraints': 'FIXED_ORDER',
    'elk.edgeRouting': 'POLYLINE',
    'elk.layered.unnecessaryBendpoints': false,
    'elk.layered.edgeSpacing.factor': 1.0
  },
  grid: {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.layered.spacing.edgeNodeBetweenLayers': '120',
    'elk.spacing.nodeNode': '120',
    'elk.layered.nodePlacement.strategy': 'SIMPLE',
    'elk.portConstraints': 'FIXED_ORDER',
    'elk.edgeRouting': 'SPLINES',
    'elk.layered.unnecessaryBendpoints': false,
    'elk.layered.edgeSpacing.factor': 1.5
  },
  'force-directed': {
    'elk.algorithm': 'stress',
    'elk.layered.spacing.nodeNodeBetweenLayers': 200,
    'elk.spacing.nodeNode': 180,
    'elk.direction': 'DOWN',
    'elk.edgeRouting': 'SPLINES',
    'elk.layered.unnecessaryBendpoints': true,
    'elk.layered.edgeSpacing.factor': 0.8,
    'elk.port.labels.placement': 'INSIDE',
    'elk.portConstraints': 'FREE', // Make handles free floating
    'elk.layered.crossingMinimization.strategy': 'INTERACTIVE',
    'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX'
  }
};

// Handle definitions for different node types
export interface HandleDefinition {
  id: string;
  type: 'source' | 'target';
  position: Position;
  style: Record<string, string>;
  label?: string;
}

export const STOCK_HANDLES: HandleDefinition[] = [
  { id: 'stock-out-flow', type: 'source', position: Position.Bottom, style: { left: '30%' }, label: 'Outflow' },
  { id: 'stock-out-flow-2', type: 'source', position: Position.Bottom, style: { left: '70%' }, label: 'Outflow 2' },
  { id: 'stock-in-flow', type: 'target', position: Position.Top, style: { left: '50%' }, label: 'Inflow' },
  { id: 'stock-dependency-1', type: 'source', position: Position.Right, style: { top: '30%' }, label: 'Dependency' },
  { id: 'stock-dependency-2', type: 'source', position: Position.Right, style: { top: '70%' }, label: 'Dependency 2' },
  { id: 'stock-influence', type: 'source', position: Position.Left, style: { top: '50%' }, label: 'Influence' }
];

export const FLOW_HANDLES: HandleDefinition[] = [
  { id: 'flow-source', type: 'target', position: Position.Left, style: { top: '30%' }, label: 'Source' },
  { id: 'flow-target', type: 'source', position: Position.Right, style: { top: '30%' }, label: 'Target' },
  { id: 'flow-dependency-in', type: 'target', position: Position.Top, style: { left: '50%' }, label: 'Rate Input' },
  { id: 'flow-rate', type: 'target', position: Position.Bottom, style: { left: '50%' }, label: 'Rate Control' }
];

export const SOURCE_HANDLES: HandleDefinition[] = [
  { id: 'source-out', type: 'source', position: Position.Right, style: { top: '50%' }, label: 'Output' }
];

export const SINK_HANDLES: HandleDefinition[] = [
  { id: 'sink-in', type: 'target', position: Position.Left, style: { top: '50%' }, label: 'Input' }
];

// ELK Layout Engine
export class ELKLayoutEngine {
  private elk: ELK;
  private layoutCache = new Map<string, any>();

  constructor() {
    this.elk = new ELK();
  }

  private getCacheKey(nodes: Node[], edges: Edge[], mode: LayoutMode): string {
    const nodeIds = nodes.map(n => n.id).sort().join(',');
    const edgeIds = edges.map(e => `${e.source}-${e.target}`).sort().join(',');
    return `${mode}-${nodeIds}-${edgeIds}`;
  }

  private convertNodesToELK(nodes: Node[]): any[] {
    return nodes.map(node => {
      // Give flow nodes smaller dimensions for tighter spacing
      if (node.type === 'flow') {
        return {
          id: node.id,
          width: node.width || 60,
          height: node.height || 60
        };
      }
      // Stock and cloud nodes keep normal size
      return {
        id: node.id,
        width: node.width || 140,
        height: node.height || 80
      };
    });
  }

  private convertEdgesToELK(edges: Edge[]): any[] {
    return edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target
    }));
  }

  async applyLayout(
    nodes: Node[],
    edges: Edge[],
    mode: LayoutMode = 'hierarchical'
  ): Promise<{ nodes: Node[], edges: Edge[] }> {
    const cacheKey = this.getCacheKey(nodes, edges, mode);

    // Check cache first
    if (this.layoutCache.has(cacheKey)) {
      return this.layoutCache.get(cacheKey);
    }

    const elkOptions = ELK_CONFIGURATIONS[mode];

    const elkGraph = {
      id: 'root',
      children: this.convertNodesToELK(nodes),
      edges: this.convertEdgesToELK(edges),
      layoutOptions: elkOptions
    };

    try {
      const layoutedGraph = await this.elk.layout(elkGraph);

      const layoutedNodes = nodes.map(node => {
        const elkNode = layoutedGraph.children?.find(n => n.id === node.id);
        if (elkNode) {
          let x = elkNode.x || 0;
          let y = elkNode.y || 0;

          // Special positioning for flow nodes that are self-loops
          if (node.type === 'flow') {
            // Find if this flow connects to the same stock (self-loop)
            const flowEdges = edges.filter(e => e.source === node.id || e.target === node.id);
            const connectedStocks = new Set();

            flowEdges.forEach(edge => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);

              if (sourceNode?.type === 'stock') connectedStocks.add(sourceNode.id);
              if (targetNode?.type === 'stock') connectedStocks.add(targetNode.id);
            });

            // If connected to only one stock (self-loop), position closer to it
            if (connectedStocks.size === 1) {
              const stockId = Array.from(connectedStocks)[0];
              const stockNode = layoutedGraph.children?.find(n => n.id === stockId);

              if (stockNode) {
                // Position flow node closer to and aligned with the stock
                x = (stockNode.x || 0) - 140; // Offset a tiny bit more to the left
                y = (stockNode.y || 0) + 10; // Position slightly below center
              }
            }
          }

          return {
            ...node,
            position: { x, y }
          };
        }
        return node;
      });

      const layoutedEdges = edges.map(edge => {
        const elkEdge = layoutedGraph.edges?.find(e => e.id === edge.id);
        if (elkEdge && elkEdge.sections && elkEdge.sections.length > 0) {
          const section = elkEdge.sections[0];
          return {
            ...edge,
            data: {
              ...edge.data,
              elkPoints: section.bendPoints || []
            }
          };
        }
        return edge;
      });

      const result = { nodes: layoutedNodes, edges: layoutedEdges };

      // Cache the result
      this.layoutCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('ELK Layout failed:', error);
      return { nodes, edges }; // Return original if layout fails
    }
  }

  clearCache(): void {
    this.layoutCache.clear();
  }
}

// Export singleton instance
export const elkLayoutEngine = new ELKLayoutEngine();