import { useState } from 'react';
import { SystemModel } from '../models/SystemModel';
import { CustomGraph } from './CustomGraph';

interface GraphSidebarProps {
  model: SystemModel;
  data: any[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  width: number;
  isDragging: boolean;
  onStartResize: () => void;
}

export function GraphSidebar({ model, data, isCollapsed, onToggleCollapse, width, isDragging, onStartResize }: GraphSidebarProps) {
  const graphConfigs = Array.from(model.graphs.values());

  return (
    <>
      {/* Resize handle for sidebar */}
      {!isCollapsed && (
        <div
          style={{
            width: '6px',
            height: '100%',
            background: isDragging ? '#3b82f6' : '#ddd',
            cursor: 'col-resize',
            position: 'relative',
            flexShrink: 0,
            transition: isDragging ? 'none' : 'background-color 0.3s ease',
          }}
          onMouseDown={(e) => {
            onStartResize();
            e.preventDefault();
          }}
        >
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '2px',
            height: '20px',
            background: '#999',
            borderRadius: '1px',
          }} />
        </div>
      )}

      <div style={{
        position: 'relative',
        height: '100%',
        background: '#f8fafc',
        borderLeft: !isCollapsed ? '1px solid #e5e7eb' : 'none',
        display: 'flex',
        flexDirection: 'column',
        width: isCollapsed ? '40px' : `${width}px`,
        transition: isDragging ? 'none' : 'width 0.3s ease',
        flexShrink: 0,
      }}>
        {/* Collapse/Expand Toggle */}
        <button
          onClick={onToggleCollapse}
          style={{
            position: 'absolute',
            top: '12px',
            left: isCollapsed ? '8px' : '16px',
            zIndex: 10,
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            padding: '6px 8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            color: '#6b7280',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
          title={isCollapsed ? 'Show Graphs' : 'Hide Graphs'}
        >
          {isCollapsed ? '←' : '→'}
        </button>

        {!isCollapsed && (
          <>
            {/* Header */}
            <div style={{
              padding: '16px 16px 12px 16px',
              borderBottom: '1px solid #e5e7eb',
              background: 'white',
              marginTop: '40px',
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
              }}>
                Graphs
              </h3>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '12px',
                color: '#6b7280',
              }}>
                {graphConfigs.length} graph{graphConfigs.length !== 1 ? 's' : ''} configured
              </p>
            </div>

            {/* Scrollable Graph Container */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '16px',
            }}>
              {graphConfigs.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '14px',
                  marginTop: '40px',
                }}>
                  <div style={{ marginBottom: '12px' }}>📈</div>
                  <div>No custom graphs defined</div>
                  <div style={{ fontSize: '12px', marginTop: '8px', lineHeight: 1.4 }}>
                    Add graph definitions to your DSL to see custom visualizations here.
                  </div>
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: '#f3f4f6',
                    borderRadius: '6px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#374151',
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>Example:</div>
                    <div>graph Population_vs_Resources {'{'}</div>
                    <div>&nbsp;&nbsp;title: "Population vs Resources"</div>
                    <div>&nbsp;&nbsp;variables: Population, Resources</div>
                    <div>&nbsp;&nbsp;type: line</div>
                    <div>&nbsp;&nbsp;yAxisLabel: "Count"</div>
                    <div>{'}'}</div>
                  </div>
                </div>
              ) : (
                graphConfigs.map(graphConfig => (
                  <CustomGraph
                    key={graphConfig.name}
                    model={model}
                    graphConfig={graphConfig}
                    data={data}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}