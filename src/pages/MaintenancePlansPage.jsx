import React, { useMemo, useState } from 'react';
import { Card, Table, Button, Space, Input, Select, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataSourceBadge from '../components/DataSourceBadge.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { maintenancePlans, maintenanceTasks } from '../data/standardData.js';

const dash = (v) => (v === null || v === undefined || v === '' ? '--' : v);

// 「下次执行」口径：取该计划名下「未开始」任务的最早计划日期（种子推导，不伪造日期）；
// 待执行计划取名下任意任务最早日期；无任务 / 已结束状态显示 --
function nextExecOf(plan) {
  const tasks = maintenanceTasks.filter(t => t.plan === plan.name);
  if (plan.status === '待执行' && tasks.length) {
    return tasks.map(t => t.date).sort()[0];
  }
  if (plan.status === '执行中') {
    const pending = tasks.filter(t => t.status === '未开始').map(t => t.date).sort();
    return pending[0] || '--';
  }
  return '--';
}

const cycleText = (p) => {
  const parts = [p.cycle && `${p.cycle}保养`];
  if (p.intervalDays) parts.push(`间隔 ${p.intervalDays} 天`);
  if (p.skipDays) parts.push(p.skipDays);
  return parts.filter(Boolean).join(' · ') || '--';
};

// 保养计划列表（范围外演示模块）：只读种子 maintenancePlans；行点击进入计划详情（query ?code=）。
export default function MaintenancePlansPage() {
  const navigate = useNavigate();
  const state = useDemoState();
  const meta = state.meta;

  const [kw, setKw] = useState('');
  const [status, setStatus] = useState(null);

  const statusOptions = useMemo(
    () => [...new Set(maintenancePlans.map(r => r.status))].map(v => ({ value: v, label: v })),
    [],
  );

  const list = useMemo(() => maintenancePlans
    .filter(r => !status || r.status === status)
    .filter(r => !kw || (r.code || '').includes(kw) || (r.name || '').includes(kw) || (r.executor || '').includes(kw)), [kw, status]);

  return (
    <>
      <PageHeader
        title="保养计划"
        subtitle={`年度 / 循环保养计划 · 共 ${maintenancePlans.length} 条 · 行点击进入计划详情（关联设备 / 关联保养任务） · 范围外演示模块（完整闭环由点巡保养业务模块承接）`}
        actions={<DataSourceBadge meta={meta} />}
      />
      <DegradedBanner meta={meta} />
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap>
          <Input.Search style={{ width: 240 }} placeholder="计划编号 / 名称 / 执行人" allowClear
            onSearch={setKw} onChange={e => { if (!e.target.value) setKw(''); }} />
          <Select style={{ width: 120 }} placeholder="状态" allowClear options={statusOptions} value={status} onChange={setStatus} />
          <Button onClick={() => { setKw(''); setStatus(null); }}>重置</Button>
        </Space>
      </Card>
      <Card size="small">
        <Table
          rowKey="code" size="small"
          dataSource={list}
          onRow={(r) => ({ onClick: () => navigate(`/maintenance-plans/detail?code=${encodeURIComponent(r.code)}`), style: { cursor: 'pointer' } })}
          locale={{
            emptyText: (
              <EmptyState
                description="暂无保养计划"
                reason={kw || status ? '当前筛选条件下没有保养计划' : '种子数据未包含保养计划'}
              />
            ),
          }}
          columns={[
            { title: '计划编号', dataIndex: 'code', width: 160, fixed: 'left' },
            { title: '计划名称', dataIndex: 'name', width: 190 },
            { title: '年度', dataIndex: 'year', width: 70 },
            { title: '保养级别', dataIndex: 'level', width: 90, render: v => v || '--' },
            { title: '保养方式', dataIndex: 'method', width: 100, render: v => v || '--' },
            { title: '周期', width: 200, render: (_, r) => cycleText(r) },
            { title: '计划日期', dataIndex: 'planDate', width: 170, render: v => dash(v) },
            {
              title: '下次执行', width: 110, render: (_, r) => {
                const v = nextExecOf(r);
                return v === '--'
                  ? <Tooltip title="该计划无待执行任务（已结束或种子数据未提供）">--</Tooltip>
                  : v;
              },
            },
            { title: '关联设备', dataIndex: 'devices', width: 120, render: v => dash(v) },
            { title: '执行人', dataIndex: 'executor', width: 110, render: v => dash(v) },
            { title: '状态', dataIndex: 'status', width: 90, render: v => <StatusTag value={v} /> },
            {
              title: '操作', width: 80, fixed: 'right',
              render: (_, r) => (
                <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/maintenance-plans/detail?code=${encodeURIComponent(r.code)}`); }}>详情</Button>
              ),
            },
          ]}
          scroll={{ x: 1520 }}
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
        />
      </Card>
    </>
  );
}
