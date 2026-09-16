// ============================================================
// 空态（§8.2）：空结果显示原因和下一步，不显示空白表格或伪造 0
// ============================================================

import React from 'react';
import { Empty, Button, Typography } from 'antd';

export default function EmptyState({ description, reason, next, onNext, nextLabel = '去处理' }) {
  return (
    <Empty
      style={{ padding: '24px 0' }}
      description={
        <div>
          <Typography.Text type="secondary">{description}</Typography.Text>
          {reason && <div style={{ fontSize: 12, color: '#8a97a3', marginTop: 4 }}>原因：{reason}</div>}
        </div>
      }
    >
      {next && (
        <Button type="primary" size="small" onClick={onNext}>{nextLabel}</Button>
      )}
    </Empty>
  );
}
