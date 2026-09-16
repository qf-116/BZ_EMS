import React, { useState } from 'react';
import { Card, Table, Button, Space, Input, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataSourceBadge from '../components/DataSourceBadge.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { inspectionTasks } from '../data/standardData.js';

// 状态展示口径：种子状态 → 展示状态（待执行/进行中/已完成/已关闭/已逾期）。
// 已逾期为派生口径：点检日期早于演示日期且任务尚未完结（未开始/进行中）时展示，种子原始值放 Tooltip。
const STATUS_LABEL = { 未开始: '待执行', 进行中: '进行中', 已完成: '已完成', 已关闭: '已关闭', 已逾期: '已逾期' };

// 点检任务（范围外演示模块，由点巡保养业务模块完整承接）：
// 任务列表只读自 standardData.js 演示快照；行点击进入任务详情，可执行任务进入执行页。
export default function InspectionTasksPage() {
  const navigate = useNavigate();
  const state = useDemoState();
  const meta = state.meta;

  const [kw, setKw] = useState('');
  const [status, setStatus] = useState(null);

  const isOverdue = (t) => t.date && meta.demoDay && t.date < meta.demoDay && ['未开始', '进行中'].includes(t.status);
  const displayStatus = (t) => (isOverdue(t) ? '已逾期' : (STATUS_LABEL[t.status] || t.status));

  const statusOptions = [...new Set(inspectionTasks.map(t => displayStatus(t)))].map(v => ({ value: v, label: v }));
  const list = inspectionTasks
    .filter(t => !status || displayStatus(t) === status)
    .filter(t => !kw || (t.code || '').includes(kw) || (t.name || '').includes(kw) || (t.owner || '').includes(kw));

  return (
    <>
      <PageHeader
        title="点检任务"
        subtitle={`点检任务列表 · 状态：待执行 / 进行中 / 已完成 / 已逾期（已关闭含于快照）· 已逾期 = 点检日期早于 ${meta.demoDay} 且未完结 · 数据为演示快照（${meta.demoDay}）`}
        actions={<DataSourceBadge meta={meta} />}
      />
      <DegradedBanner meta={meta} />
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap>
          <Input.Search style={{ width: 240 }} placeholder="任务编号 / 计划 / 执行人" allowClear
            onSearch={setKw} onChange={e => { if (!e.target.value) setKw(''); }} />
          <Select style={{ width: 120 }} placeholder="状态" allowClear options={statusOptions} value={status} onChange={setStatus} />
          <Button onClick={() => { setKw(''); setStatus(null); }}>重置</Button>
        </Space>
      </Card>
      <Card size="small">
        <Table
          rowKey="code" size="small"
          dataSource={list}
          onRow={(r) => ({ onClick: () => navigate(`/inspection-tasks/detail?code=${encodeURIComponent(r.code)}`), style: { cursor: 'pointer' } })}
          locale={{ emptyText: <EmptyState description="暂无点检任务" reason={kw || status ? '当前筛选条件下没有点检任务' : '演示快照未包含点检任务'} /> }}
          columns={[
            { title: '任务编号', dataIndex: 'code', width: 180, fixed: 'left' },
            { title: '所属计划', dataIndex: 'plan', width: 190, render: v => v || '--' },
            { title: '应检设备数', dataIndex: 'shouldCount', width: 100, render: v => v ?? '--' },
            { title: '点检日期', dataIndex: 'date', width: 110, render: v => v || '--' },
            { title: '班组', dataIndex: 'group', width: 110, render: v => v || '--' },
            { title: '执行人', dataIndex: 'owner', width: 100, render: v => v || '--' },
            {
              title: '状态', dataIndex: 'status', width: 100,
              render: (v, r) => <StatusTag value={displayStatus(r)} tip={`种子状态：${v} · 点检日期：${r.date || '--'}`} />,
            },
            { title: '创建时间', dataIndex: 'createTime', width: 160, render: v => v || '--' },
            { title: '备注', dataIndex: 'remark', ellipsis: true, render: v => v || '--' },
            {
              title: '操作', width: 130, fixed: 'right',
              render: (_, r) => (
                <Space size={0} onClick={(e) => e.stopPropagation()}>
                  {['未开始', '进行中'].includes(r.status) && !isOverdue(r) && (
                    <Button type="link" size="small" onClick={() => navigate(`/inspection-tasks/execute?code=${encodeURIComponent(r.code)}`)}>执行</Button>
                  )}
                  <Button type="link" size="small" onClick={() => navigate(`/inspection-tasks/detail?code=${encodeURIComponent(r.code)}`)}>详情</Button>
                </Space>
              ),
            },
          ]}
          scroll={{ x: 1250 }}
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
        />
      </Card>
    </>
  );
}
