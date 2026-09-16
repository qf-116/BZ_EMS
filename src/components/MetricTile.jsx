import React from 'react';

export default function MetricTile({ label, value, unit, color }) {
  return (
    <div className="metric-tile" style={color ? { '--tile': color } : undefined}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        {value ?? '暂无数据'}
        {value != null && unit ? <span className="metric-unit">{unit}</span> : null}
      </div>
    </div>
  );
}
