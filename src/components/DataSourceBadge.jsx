// ============================================================
// 数据源标签（§8.1）：页面明确显示数据来源 / 提供方 / 演示降级
// 只允许演示口径：demo + mock-polling | mock-subscription | disconnect
// ============================================================

import React from 'react';
import { Tag, Tooltip } from 'antd';

const PROVIDER_LABEL = {
  'mock-polling': '轮询',
  'mock-subscription': '订阅',
  disconnect: '已断开（降级）',
};

export default function DataSourceBadge({ meta }) {
  if (!meta) return null;
  return (
    <Tooltip title={`数据快照 · 提供方：${PROVIDER_LABEL[meta.provider] || meta.provider} · 时区 ${meta.timezone || '+08:00'}`}>
      <Tag color={meta.degraded ? 'error' : 'processing'} style={{ marginRight: 0 }}>
        {meta.degraded ? '已降级' : '实时数据'} · {PROVIDER_LABEL[meta.provider] || meta.provider}
      </Tag>
    </Tooltip>
  );
}
