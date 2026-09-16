import React from 'react';
import { Typography, Space, Tag } from 'antd';
import { getProviderMode } from '../services/providerConfig.js';

export default function PageHeader({ title, subtitle, actions, source, updatedAt }) {
  const dataSource = source || getProviderMode();
  const sourceLabel = dataSource === 'api' ? '真实数据' : '演示数据';
  const sourceColor = dataSource === 'api' ? 'success' : 'processing';

  return (
    <div className="page-head">
      <div>
        <Typography.Title className="page-title" level={4}>{title}</Typography.Title>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      <Space>
        <Tag color={sourceColor}>{sourceLabel}</Tag>
        {updatedAt && <Typography.Text type="secondary" style={{ fontSize: 12 }}>更新于 {updatedAt}</Typography.Text>}
        {actions}
      </Space>
    </div>
  );
}
