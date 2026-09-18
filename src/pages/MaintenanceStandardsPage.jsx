import React, { useMemo, useState } from 'react';
import { Card, Table, Button, Space, Input, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { maintenanceStandards, maintenanceStandardItemCodes } from '../data/standardData.js';

// 周期类型从标准名称推导（种子数据无独立周期字段，不伪造）：
// 月度 → 月 / 季度 → 季 / 半年度 → 半年；其余显示 --
const cycleFromName = (name = '') => {
  if (name.includes('半年度')) return '半年';
  if (name.includes('季度')) return '季';
  if (name.includes('月度')) return '月';
  if (name.includes('周')) return '周';
  if (name.includes('日')) return '日';
  return '--';
};

// 保养标准列表（范围外演示模块）：只读种子 maintenanceStandards；行点击进入标准详情（query ?code=）。
export default function MaintenanceStandardsPage() {
  const navigate = useNavigate();
  const state = useDemoState();
  const meta = state.meta;

  const [kw, setKw] = useState('');
  const [status, setStatus] = useState(null);

  const list = useMemo(() => maintenanceStandards
    .filter(r => !status || r.status === status)
    .filter(r => !kw || (r.code || '').includes(kw) || (r.name || '').includes(kw)), [kw, status]);

  const statusOptions = useMemo(
    () => [...new Set(maintenanceStandards.map(r => r.status))].map(v => ({ value: v, label: v })),
    [],
  );

  return (
    <>
      <PageHeader
        title="保养标准"
        subtitle={`保养标准档案 · 共 ${maintenanceStandards.length} 条 · 行点击进入标准详情（关联设备 / 关联项目）`}
      />
      <DegradedBanner meta={meta} />
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap>
          <Input.Search style={{ width: 240 }} placeholder="标准编号 / 名称" allowClear
            onSearch={setKw} onChange={e => { if (!e.target.value) setKw(''); }} />
          <Select style={{ width: 120 }} placeholder="状态" allowClear options={statusOptions} value={status} onChange={setStatus} />
          <Button onClick={() => { setKw(''); setStatus(null); }}>重置</Button>
        </Space>
      </Card>
      <Card size="small">
        <Table
          rowKey="code" size="small"
          dataSource={list}
          onRow={(r) => ({ onClick: () => navigate(`/maintenance-standards/detail?code=${encodeURIComponent(r.code)}`), style: { cursor: 'pointer' } })}
          locale={{
            emptyText: (
              <EmptyState
                description="暂无保养标准"
                reason={kw || status ? '当前筛选条件下没有保养标准' : '暂无保养标准数据'}
              />
            ),
          }}
          columns={[
            { title: '标准编号', dataIndex: 'code', width: 160, fixed: 'left' },
            { title: '标准名称', dataIndex: 'name', width: 200 },
            { title: '周期类型', dataIndex: 'cycle', width: 90, render: (_, r) => cycleFromName(r.name) },
            { title: '关联设备', dataIndex: 'devices', width: 100, render: (v) => (typeof v === 'number' ? `${v} 台` : '--') },
            {
              title: '项目数', width: 90, render: (_, r) => {
                // 种子仅提供「数控车床月度保养标准」的关联项目编号清单，其余标准不伪造
                if (r.code === 'BYBZ20250301001') return `${maintenanceStandardItemCodes.length} 项`;
                return '--';
              },
            },
            { title: '状态', dataIndex: 'status', width: 90, render: v => <StatusTag value={v} /> },
            { title: '更新时间', dataIndex: 'updateTime', width: 160, render: v => v || '--' },
            { title: '备注', dataIndex: 'remark', width: 220, ellipsis: true, render: v => v || '--' },
            {
              title: '操作', width: 80, fixed: 'right',
              render: (_, r) => (
                <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/maintenance-standards/detail?code=${encodeURIComponent(r.code)}`); }}>详情</Button>
              ),
            },
          ]}
          scroll={{ x: 1120 }}
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
        />
      </Card>
    </>
  );
}
