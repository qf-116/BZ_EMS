// ============================================================
// 降级横幅（§8.1）：断开/降级时显示明确提示；断开期间旧值不标记为实时
// ============================================================

import React from 'react';
import { Alert } from 'antd';

export default function DegradedBanner({ meta }) {
  if (!meta || !meta.degraded) return null;
  return (
    <Alert
      type="warning"
      showIcon
      style={{ marginBottom: 12 }}
      message="演示降级模式：数据订阅已断开"
      description={`当前展示的是最后快照数据（最后样本 ${meta.lastSampleAt || '--'}）。断开期间旧值不再标记为实时；恢复演示轮询/演示订阅后自动刷新。`}
    />
  );
}
