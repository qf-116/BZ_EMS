import React, { useState } from 'react';
import { Card, Space, Select, DatePicker, Button, Input } from 'antd';

const initialQuery = {
  workshop: 'all',
  deviceType: 'all',
  dateRange: null,
  keyword: '',
  timezone: 'Asia/Shanghai',
  groupBy: 'device',
  qualityPolicy: 'valid-only',
};

// 报表页通用受控筛选条，保留原视觉布局并统一查询/重置回调。
export default function ReportFilter({ value, onChange, onQuery, onReset, children }) {
  const [internal, setInternal] = useState(initialQuery);
  const query = value || internal;
  const update = (patch) => {
    const next = { ...query, ...patch };
    if (!value) setInternal(next);
    onChange?.(next);
  };
  const reset = () => {
    const next = { ...initialQuery };
    if (!value) setInternal(next);
    onChange?.(next);
    onReset?.(next);
  };

  return (
    <Card size="small" style={{ marginBottom: 12 }}>
      <Space wrap>
        <Select value={query.workshop} onChange={workshop => update({ workshop })} style={{ width: 140 }} options={[{ value: 'all', label: '全部车间' }, { value: '1', label: '一号车间' }, { value: '2', label: '二号车间' }]} />
        <Select value={query.deviceType} onChange={deviceType => update({ deviceType })} style={{ width: 150 }} options={[{ value: 'all', label: '全部设备类型' }, { value: 'cnc', label: 'CNC' }, { value: 'laser', label: '激光' }]} />
        <DatePicker.RangePicker value={query.dateRange} onChange={dateRange => update({ dateRange })} />
        <Input.Search value={query.keyword} onChange={e => update({ keyword: e.target.value })} onSearch={keyword => update({ keyword })} placeholder="设备 / 关键词" style={{ width: 180 }} allowClear />
        <Button type="primary" onClick={() => onQuery?.(query)}>查询</Button>
        <Button onClick={reset}>重置</Button>
        {children}
      </Space>
    </Card>
  );
}
