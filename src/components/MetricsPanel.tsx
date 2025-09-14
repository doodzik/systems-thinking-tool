import { useMemo, useEffect, useState } from 'react';
import { SystemModel } from '../models/SystemModel';

interface MetricsPanelProps {
  model: SystemModel;
  isVisible: boolean;
  onToggle: () => void;
}

function MetricCard({ title, value, change, units, trend }: {
  title: string;
  value: number;
  change: number;
  units?: string;
  trend: number[];
}) {
  const changeColor = Math.abs(change) < 0.1
    ? '#6b7280'
    : change > 0
    ? '#10b981'
    : '#ef4444';

  const changeIcon = Math.abs(change) < 0.1
    ? '—'
    : change > 0
    ? '↗'
    : '↘';

  // Mini sparkline for trend
  const sparklinePoints = useMemo(() => {
    if (trend.length < 2) return '';

    const min = Math.min(...trend);
    const max = Math.max(...trend);
    const range = max - min || 1;

    return trend.map((val, i) => {
      const x = (i / (trend.length - 1)) * 60;
      const y = 20 - ((val - min) / range) * 20;
      return `${x},${y}`;
    }).join(' ');
  }, [trend]);

  const trendColor = trend.length >= 2 && trend[trend.length - 1] > trend[0]
    ? '#10b981'
    : '#ef4444';

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px',
      minWidth: '160px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
        }}>
          {title}
        </div>
        {Math.abs(change) > 0.1 && (
          <div style={{
            fontSize: '10px',
            fontWeight: '600',
            color: changeColor,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}>
            <span>{changeIcon}</span>
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{
        fontSize: '20px',
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: '2px',
      }}>
        {value.toLocaleString(undefined, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        })}
      </div>

      {/* Units */}
      {units && (
        <div style={{
          fontSize: '10px',
          color: '#9ca3af',
          marginBottom: '8px',
          fontWeight: '500',
        }}>
          {units}
        </div>
      )}

      {/* Mini sparkline */}
      {trend.length > 1 && (
        <svg width="60" height="20" style={{ opacity: 0.8 }}>
          <polyline
            points={sparklinePoints}
            fill="none"
            stroke={trendColor}
            strokeWidth="1.5"
          />
        </svg>
      )}
    </div>
  );
}

export function MetricsPanel({ model, isVisible, onToggle }: MetricsPanelProps) {
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Listen for model updates to ensure real-time updates during simulation
  useEffect(() => {
    const handleModelUpdate = () => {
      setUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('modelUpdate', handleModelUpdate);
    return () => {
      window.removeEventListener('modelUpdate', handleModelUpdate);
    };
  }, []);

  const metrics = useMemo(() => {
    const stockMetrics: Array<{
      title: string;
      value: number;
      change: number;
      units?: string;
      trend: number[];
    }> = [];

    // Calculate metrics for each stock
    model.stocks.forEach((stock, name) => {
      // Get historical data for this stock
      const history = model.history.map(entry =>
        entry.state.get(name) || stock.value
      );

      // Calculate change from initial value
      const initialValue = history.length > 0 ? history[0] : stock.value;
      const currentValue = stock.value;
      const totalChange = initialValue !== 0
        ? ((currentValue - initialValue) / initialValue) * 100
        : 0;

      // Calculate recent rate of change
      let recentChange = 0;
      if (history.length >= 2) {
        const recent = history[history.length - 1];
        const previous = history[history.length - 2];
        if (previous !== 0) {
          recentChange = ((recent - previous) / Math.abs(previous)) * 100;
        }
      }

      stockMetrics.push({
        title: name,
        value: currentValue,
        change: recentChange,
        units: stock.units,
        trend: history.slice(-10), // Last 10 data points
      });
    });

    // Calculate metrics for each flow
    const flowMetrics: Array<{
      title: string;
      value: number;
      change: number;
      units?: string;
      trend: number[];
    }> = [];

    model.flows.forEach((flow, name) => {
      const currentRate = flow.getRate(model);

      // Create a simple history of flow rates (since flows don't store their own history)
      const flowHistory = model.history.map(() => currentRate);

      flowMetrics.push({
        title: `${name} (Rate)`,
        value: currentRate,
        change: 0, // Flow rates don't have historical change tracking yet
        units: 'per step',
        trend: flowHistory.slice(-10),
      });
    });

    // Add system-level metrics
    const totalSystemValue = Array.from(model.stocks.values()).reduce(
      (sum, stock) => sum + (stock.value || 0), 0
    );

    return {
      stocks: stockMetrics,
      flows: flowMetrics,
      systemTotal: totalSystemValue,
      timeStep: model.time,
    };
  }, [model, updateTrigger]);

  if (!isVisible) {
    return (
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
      }}>
        <button
          onClick={onToggle}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          📊 Metrics
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '300px',
    }}>
      {/* Header with close button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '10px 12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '700',
          color: '#1f2937',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          System Metrics
        </div>
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: '#9ca3af',
            padding: '2px',
          }}
        >
          ✕
        </button>
      </div>

      {/* System overview */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '8px',
        padding: '10px 12px',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#3b82f6',
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
          marginBottom: '4px',
        }}>
          Time Step: {metrics.timeStep.toFixed(1)}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#374151',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          Total Value: {metrics.systemTotal.toFixed(1)}
        </div>
      </div>

      {/* Stock metrics */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        {metrics.stocks.map((stock) => (
          <MetricCard
            key={stock.title}
            title={stock.title}
            value={stock.value}
            change={stock.change}
            units={stock.units}
            trend={stock.trend}
          />
        ))}
      </div>

      {/* Flow metrics */}
      {metrics.flows.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          {metrics.flows.map((flow) => (
            <MetricCard
              key={flow.title}
              title={flow.title}
              value={flow.value}
              change={flow.change}
              units={flow.units}
              trend={flow.trend}
            />
          ))}
        </div>
      )}
    </div>
  );
}