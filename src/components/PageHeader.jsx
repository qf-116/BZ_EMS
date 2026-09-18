import React from 'react';
import { Typography, Space } from 'antd';

export default function PageHeader({ title, subtitle, actions, updatedAt }) {

  return (
    <div className="page-head">
      <div>
        <Typography.Title className="page-title" level={4}>{title}</Typography.Title>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      <Space>
        {updatedAt && <Typography.Text type="secondary" style={{ fontSize: 12 }}>更新于 {updatedAt}</Typography.Text>}
        {actions}
      </Space>
    </div>
  );
}
