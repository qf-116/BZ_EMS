import React, { useMemo, useState } from 'react';
import { Card, Table, Button, Space, Input, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataSourceBadge from '../components/DataSourceBadge.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { patrolTasks } from '../data/standardData.js';

// 巡检任务（范围外演示模块）：数据只读来自 standardData.js 种子快照。
// 列表列：巡检线路（计划）/ 应巡设备数 / 执行人 / 状态；行点击进入详情，「执行」进入执行页。
// 状态枚举：未开始 / 进行中 / 已完成 / 已逾期 / 逾期完成。
export default function PatrolTasksPage() {
  const navigate = useNavigate();
  const state = useDemoState();
  const meta = state.meta;

  const [kw, setKw] = useState('');
  const [status, setStatus] = useState(null);

  const list = useMemo(() => patrolTasks
    .filter(r => !status || r.status === status)
    .filter(r => {
      const k = (kw || '').trim().toLowerCase();
      if (!k) return true;
      return [r.code, r.name, r.plan, r.owner].some(v => (v || '').toLowerCase().includes(k));
    })
    .slice()
    .sort((a, b) => (b.date || '').localeCompare(a.date || '')), [kw, status]);

  const canExecute = (r) => ['未开始', '进行中', '已逾期'].includes(r.status);

  const columns = [
    { title: '任务编号', dataIndex: 'code', width: 200, fixed: 'left' },
    { title: '任务名称', dataIndex: 'name', width: 170 },
    { title: '巡检线路（计划）', dataIndex: 'plan', width: 180, render: v => v || '--' },
    { title: '巡检日期', dataIndex: 'date', width: 110, render: v => v || '--' },
    { title: '应巡设备数', dataIndex: 'shouldCount', width: 100, align: 'center', render: v => (v != null ? `${v} 台` : '--') },
    { title: '执行人', dataIndex: 'owner', width: 120, render: v => v || '--' },
    {
      title: '状态', dataIndex: 'status', width: 110,
      render: (v, r) => <StatusTag value={v} tip={v === '逾期完成' ? '超过计划完成时间后完成' : undefined} />,
    },
    { title: '创建时间', dataIndex: 'createTime', width: 160, render: v => v || '--' },
    {
      title: '操作', width: 130, fixed: 'right',
      render: (_, r) => (
        <Space size={0} onClick={(e) => e.stopPropagation()}>
          {canExecute(r) && (
            <Button type="link" size="small" onClick={() => navigate(`/patrol-tasks/execute?id=${encodeURIComponent(r.code)}`)}>执行</Button>
          )}
          <Button type="link" size="small" onClick={() => navigate(`/patrol-tasks/detail?id=${encodeURIComponent(r.code)}`)}>详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="巡检任务"
        subtitle={`巡检任务（按巡检计划生成，任务状态：${[...new Set(patrolTasks.map(r => r.status))].join('/')}）· 行点击进入详情 · 数据为演示快照（更新于 ${meta.updatedAt}）`}
        actions={<DataSourceBadge meta={meta} />}
      />
      <DegradedBanner meta={meta} />
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap>
          <Input.Search style={{ width: 240 }} placeholder="任务编号 / 线路 / 执行人" allowClear onSearch={setKw} onChange={e => { if (!e.target.value) setKw(''); }} />
          <Select style={{ width: 120 }} placeholder="状态" allowClear value={status} onChange={setStatus}
            options={[...new Set(patrolTasks.map(r => r.status))].map(v => ({ value: v, label: v }))} />
          <Button onClick={() => { setKw(''); setStatus(null); }}>重置</Button>
        </Space>
      </Card>
      <Card size="small">
        <Table
          rowKey="code" size="small" columns={columns} dataSource={list} scroll={{ x: 1350 }}
          onRow={(r) => ({ onClick: () => navigate(`/patrol-tasks/detail?id=${encodeURIComponent(r.code)}`), style: { cursor: 'pointer' } })}
          locale={{ emptyText: <EmptyState description="暂无巡检任务" reason={kw || status ? '当前筛选条件下没有巡检任务' : '演示快照中无巡检任务数据'} /> }}
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
        />
      </Card>
    </>
  );
}
