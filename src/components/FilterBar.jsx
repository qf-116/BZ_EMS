import React from 'react';
import { Button, Card, Space } from 'antd';

export default function FilterBar({ children, onQuery, onReset, extra }) {
  return (
    <Card size="small" style={{ marginBottom: 12 }}>
      <Space wrap style={{ marginBottom: extra ? 10 : 0 }}>
        {children}
      </Space>
      {extra}
      <div style={{ marginTop: 10 }}>
        <Button type="primary" onClick={onQuery}>查询</Button>
        <Button style={{ marginLeft: 8 }} onClick={onReset}>重置</Button>
      </div>
    </Card>
  );
}
