import React, { useState } from 'react';
import { Card, Table, Button, Space, Input, Select, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { inspectionPlans } from '../data/standardData.js';

// 点检计划（范围外演示模块，由点巡保养业务模块完整承接）：
// 计划列表只读自 standardData.js 演示快照；行点击进入计划详情（query 兼容 id/code）。
export default function InspectionPlansPage() {
  const navigate = useNavigate();
  const state = useDemoState();
  const meta = state.meta;

  const [kw, setKw] = useState('');
  const [status, setStatus] = useState(null);

  const statusOptions = [...new Set(inspectionPlans.map(p => p.status))].map(v => ({ value: v, label: v }));
  const list = inspectionPlans
    .filter(p => !status || p.status === status)
    .filter(p => !kw || (p.code || '').includes(kw) || (p.name || '').includes(kw) || (p.owner || '').includes(kw));

  return (
    <>
      <PageHeader
        title="点检计划"
        subtitle={`点检计划档案 · 周期（日/周/月/自定义）+ 间隔 + 跳过规则 · 数据更新于 ${meta.demoDay}`}
      />
      <DegradedBanner meta={meta} />
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap>
          <Input.Search style={{ width: 240 }} placeholder="计划编号 / 名称 / 负责人" allowClear
            onSearch={setKw} onChange={e => { if (!e.target.value) setKw(''); }} />
          <Select style={{ width: 120 }} placeholder="状态" allowClear options={statusOptions} value={status} onChange={setStatus} />
          <Button onClick={() => { setKw(''); setStatus(null); }}>重置</Button>
        </Space>
      </Card>
      <Card size="small">
        <Table
          rowKey="code" size="small"
          dataSource={list}
          onRow={(r) => ({ onClick: () => navigate(`/inspection-plans/detail?code=${encodeURIComponent(r.code)}`), style: { cursor: 'pointer' } })}
          locale={{ emptyText: <EmptyState description="暂无点检计划" reason={kw || status ? '当前筛选条件下没有点检计划' : '暂无点检计划数据'} /> }}
          columns={[
            { title: '计划编号', dataIndex: 'code', width: 170, fixed: 'left' },
            { title: '计划名称', dataIndex: 'name', width: 200 },
            { title: '起止日期', width: 200, render: (_, r) => `${r.startDate || '--'} ~ ${r.endDate || '--'}` },
            { title: '周期', width: 150, render: (_, r) => `${r.cycle || '--'} / ${r.interval ?? '--'} 天` },
            { title: '跳过规则', dataIndex: 'skip', width: 160, render: v => v || '--' },
            { title: '负责人', dataIndex: 'owner', width: 110, render: v => v || '--' },
            { title: '设备范围', dataIndex: 'deviceCount', width: 90, render: v => (v != null ? `${v} 台` : '--') },
            {
              title: '任务完成情况', width: 180,
              render: (_, r) => (
                <Space size={6}>
                  <Progress percent={r.totalTasks ? Math.round((r.doneTasks / r.totalTasks) * 100) : 0} size="small" style={{ width: 90 }} />
                  <span style={{ fontSize: 12, color: '#8a97a3' }}>{r.doneTasks ?? '--'}/{r.totalTasks ?? '--'}</span>
                </Space>
              ),
            },
            { title: '状态', dataIndex: 'status', width: 90, render: v => <StatusTag value={v} /> },
            { title: '备注', dataIndex: 'remark', ellipsis: true, render: v => v || '--' },
            {
              title: '操作', width: 90, fixed: 'right',
              render: (_, r) => (
                <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/inspection-plans/detail?code=${encodeURIComponent(r.code)}`); }}>详情</Button>
              ),
            },
          ]}
          scroll={{ x: 1500 }}
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
        />
      </Card>
    </>
  );
}
