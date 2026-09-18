import React, { useMemo, useState } from 'react';
import { Card, Table, Button, Space, Input, Select, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { patrolPlans } from '../data/standardData.js';

const cycleText = (r) => {
  const base = r.cycle ? (r.interval ? `${r.cycle} · 每 ${r.interval} 个${r.cycle === '日' ? '天' : r.cycle === '周' ? '周' : r.cycle === '月' ? '月' : '周期'}` : r.cycle) : '--';
  return r.skip ? `${base} · ${r.skip}` : base;
};

// 巡检计划（范围外演示模块）：数据只读来自 standardData.js 种子快照。
// 列表列：周期 / 线路设备 / 起止时间 / 执行进度 / 状态；行点击进入 /patrol-plans/detail?id=计划编号。
export default function PatrolPlansPage() {
  const navigate = useNavigate();
  const state = useDemoState();
  const meta = state.meta;

  const [kw, setKw] = useState('');
  const [status, setStatus] = useState(null);

  const list = useMemo(() => patrolPlans
    .filter(r => !status || r.status === status)
    .filter(r => {
      const k = (kw || '').trim().toLowerCase();
      if (!k) return true;
      return [r.code, r.name, r.owner].some(v => (v || '').toLowerCase().includes(k));
    }), [kw, status]);

  const columns = [
    { title: '计划编号', dataIndex: 'code', width: 180, fixed: 'left' },
    { title: '计划名称（巡检线路）', dataIndex: 'name', width: 190 },
    { title: '巡检周期', width: 220, render: (_, r) => cycleText(r) },
    { title: '线路设备数', dataIndex: 'deviceCount', width: 100, align: 'center', render: v => (v != null ? `${v} 台` : '--') },
    { title: '起止时间', width: 210, render: (_, r) => `${r.startDate || '--'} ~ ${r.endDate || '--'}` },
    {
      title: '执行进度', width: 180,
      render: (_, r) => (
        <Space size={6}>
          <Progress percent={r.totalTasks ? Math.round((r.doneTasks || 0) / r.totalTasks * 100) : 0} size="small" style={{ width: 90 }} />
          <span style={{ fontSize: 12, color: '#5a6a78' }}>{r.doneTasks ?? '--'}/{r.totalTasks ?? '--'}</span>
        </Space>
      ),
    },
    { title: '负责人', dataIndex: 'owner', width: 110, render: v => v || '--' },
    { title: '状态', dataIndex: 'status', width: 90, render: (v, r) => <StatusTag value={v} tip={r.remark} /> },
    { title: '备注', dataIndex: 'remark', ellipsis: true, render: v => v || '--' },
    { title: '创建时间', dataIndex: 'createTime', width: 160, render: v => v || '--' },
    {
      title: '操作', width: 80, fixed: 'right',
      render: (_, r) => (
        <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/patrol-plans/detail?id=${encodeURIComponent(r.code)}`); }}>详情</Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="巡检计划"
        subtitle={`巡检计划（按线路设备生成巡检任务）· 周期：${[...new Set(patrolPlans.map(r => r.cycle))].join('/')} · 数据更新于 ${meta.updatedAt}`}
      />
      <DegradedBanner meta={meta} />
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap>
          <Input.Search style={{ width: 240 }} placeholder="计划编号 / 名称 / 负责人" allowClear onSearch={setKw} onChange={e => { if (!e.target.value) setKw(''); }} />
          <Select style={{ width: 120 }} placeholder="状态" allowClear value={status} onChange={setStatus}
            options={[...new Set(patrolPlans.map(r => r.status))].map(v => ({ value: v, label: v }))} />
          <Button onClick={() => { setKw(''); setStatus(null); }}>重置</Button>
        </Space>
      </Card>
      <Card size="small">
        <Table
          rowKey="code" size="small" columns={columns} dataSource={list} scroll={{ x: 1650 }}
          onRow={(r) => ({ onClick: () => navigate(`/patrol-plans/detail?id=${encodeURIComponent(r.code)}`), style: { cursor: 'pointer' } })}
          locale={{ emptyText: <EmptyState description="暂无巡检计划" reason={kw || status ? '当前筛选条件下没有巡检计划' : '暂无巡检计划数据'} /> }}
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
        />
      </Card>
    </>
  );
}
