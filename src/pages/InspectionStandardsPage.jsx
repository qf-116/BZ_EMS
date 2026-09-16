import React, { useState } from 'react';
import { Card, Table, Button, Space, Input, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataSourceBadge from '../components/DataSourceBadge.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { inspectionStandards, inspectionStandardItemCodes } from '../data/standardData.js';

// 点检标准（范围外演示模块，由点巡保养业务模块完整承接）：
// 标准列表只读自 standardData.js 演示快照；行点击进入标准详情（query 兼容 id/code）。
// 演示快照仅包含首个标准（XJBZ20250301001）的关联项目明细，其余标准项目数以 -- 展示（不伪造 0）。
const ITEM_SNAPSHOT_STANDARD = 'XJBZ20250301001';

export default function InspectionStandardsPage() {
  const navigate = useNavigate();
  const state = useDemoState();
  const meta = state.meta;

  const [kw, setKw] = useState('');
  const [status, setStatus] = useState(null);

  const list = inspectionStandards
    .filter(r => !status || r.status === status)
    .filter(r => !kw || (r.code || '').includes(kw) || (r.name || '').includes(kw));

  return (
    <>
      <PageHeader
        title="点检标准"
        subtitle={`点检标准档案 · 行点击进入标准详情（关联设备 / 关联项目）· 数据为演示快照（${meta.demoDay}）· 设备展示经 canonical 设备映射`}
        actions={<DataSourceBadge meta={meta} />}
      />
      <DegradedBanner meta={meta} />
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap>
          <Input.Search style={{ width: 240 }} placeholder="标准编号 / 名称" allowClear
            onSearch={setKw} onChange={e => { if (!e.target.value) setKw(''); }} />
          <Select style={{ width: 120 }} placeholder="状态" allowClear
            options={['已启用', '已停用'].map(v => ({ value: v, label: v }))} value={status} onChange={setStatus} />
          <Button onClick={() => { setKw(''); setStatus(null); }}>重置</Button>
        </Space>
      </Card>
      <Card size="small">
        <Table
          rowKey="code" size="small"
          dataSource={list}
          onRow={(r) => ({ onClick: () => navigate(`/inspection-standards/detail?code=${encodeURIComponent(r.code)}`), style: { cursor: 'pointer' } })}
          locale={{ emptyText: <EmptyState description="暂无点检标准" reason={kw || status ? '当前筛选条件下没有点检标准' : '演示快照未包含点检标准'} /> }}
          columns={[
            { title: '标准编号', dataIndex: 'code', width: 170, fixed: 'left' },
            { title: '标准名称', dataIndex: 'name', width: 200 },
            { title: '关联设备数', dataIndex: 'devices', width: 100, render: v => v ?? '--' },
            {
              title: '关联项目数', dataIndex: 'itemCount', width: 100,
              render: (_, r) => (r.code === ITEM_SNAPSHOT_STANDARD ? inspectionStandardItemCodes.length : '--'),
            },
            { title: '状态', dataIndex: 'status', width: 90, render: v => <StatusTag value={v} /> },
            { title: '更新时间', dataIndex: 'updateTime', width: 160, render: v => v || '--' },
            { title: '备注', dataIndex: 'remark', ellipsis: true, render: v => v || '--' },
            {
              title: '操作', width: 90, fixed: 'right',
              render: (_, r) => (
                <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/inspection-standards/detail?code=${encodeURIComponent(r.code)}`); }}>详情</Button>
              ),
            },
          ]}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
        />
      </Card>
    </>
  );
}
