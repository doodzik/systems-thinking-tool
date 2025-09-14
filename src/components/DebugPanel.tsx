import { SystemModel } from '../models/SystemModel';

interface DebugPanelProps {
  model: SystemModel;
  isVisible: boolean;
  onToggle: () => void;
}

export function DebugPanel({ model, isVisible, onToggle }: DebugPanelProps) {
  if (!model || model.flows.size === 0) return null;

  if (!isVisible) {
    return (
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        zIndex: 1000,
      }}>
        <button
          onClick={onToggle}
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            border: '1px solid #444',
            borderRadius: '4px',
            padding: '6px 10px',
            fontSize: '11px',
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          🐛 Debug
        </button>
      </div>
    );
  }

  const debugData = Array.from(model.flows.entries()).map(([name, flow]) => {
    const currentRate = flow.getRate(model);
    const dt = 1; // Default step size
    const flowAmount = currentRate * dt;
    return {
      name,
      rate: currentRate,
      flowAmount,
      rateExpression: flow.rateExpression || 'N/A',
      from: flow.from?.name || 'source',
      to: flow.to?.name || 'sink',
    };
  });

  const stockData = Array.from(model.stocks.entries()).map(([name, stock]) => ({
    name,
    value: stock.value,
    min: stock.min,
    max: stock.max,
  }));

  return (
    <div style={{
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      maxWidth: '400px',
      zIndex: 1000,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{ fontWeight: 'bold' }}>
          Debug Panel - Time: {model.time.toFixed(1)}
        </div>
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '2px',
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <strong>Stocks:</strong>
        {stockData.map(stock => (
          <div key={stock.name} style={{ marginLeft: '8px' }}>
            {stock.name}: {stock.value.toFixed(2)}
            {stock.min !== undefined && ` (min: ${stock.min})`}
            {stock.max !== undefined && ` (max: ${stock.max})`}
          </div>
        ))}
      </div>

      <div>
        <strong>Flow Rates:</strong>
        {debugData.map(flow => (
          <div key={flow.name} style={{ marginLeft: '8px' }}>
            {flow.name}: {flow.rate.toFixed(4)}/step = {flow.flowAmount.toFixed(4)} ({flow.from} → {flow.to})
            {flow.rateExpression !== 'N/A' && (
              <div style={{ fontSize: '10px', color: '#ccc' }}>
                Expression: {flow.rateExpression}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}