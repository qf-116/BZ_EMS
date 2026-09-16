import React from 'react';
import { Card, Descriptions, Table, Button, Space } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataSourceBadge from '../components/DataSourceBadge.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { inspectionPlans, inspectionTasks } from '../data/standardData.js';

// 点检计划详情（范围外演示模块）：/inspection-plans/detail（query 兼容 id/code）。
// 展示计划基本信息 + 周期规则 + 关联任务完成情况（按计划名称匹配演示快照中的任务）。
export default function InspectionPlanDetailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const state = useDemoState();
  const meta = state.meta;

  const codeOrId = params.get('code') || params.get('id');
  const plan = codeOrId
    ? inspectionPlans.find(p => p.code === codeOrId || p.code === decodeURIComponent(codeOrId) || p.name === codeOrId)
    : null;

  if (!codeOrId || !plan) {
    return (
      <>
        <PageHeader title="点检计划详情" subtitle={codeOrId ? `计划：${codeOrId}` : '未指定计划'}
          actions={<Space><DataSourceBadge meta={meta} /><Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/inspection-plans')}>返回列表</Button></Space>} />
        <DegradedBanner meta={meta} />
        <Card size="small">
          <EmptyState
            description={`未找到点检计划${codeOrId ? `「${codeOrId}」` : ''}`}
            reason="编号无效或演示快照中不存在该计划"
            next
            onNext={() => navigate('/inspection-plans')}
            nextLabel="返回点检计划列表"
          />
        </Card>
      </>
    );
  }

  const tasks = inspectionTasks.filter(t => t.plan === plan.name);
  const doneCount = tasks.filter(t => t.status === '已完成').length;

  return (
    <>
      <PageHeader
        title="点检计划详情"
        subtitle={`计划：${plan.code} · ${plan.name} · 状态：${plan.status} · 演示快照（${meta.demoDay}）· 完整闭环由点巡保养业务模块承接`}
        actions={<Space><DataSourceBadge meta={meta} /><Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/inspection-plans')}>返回列表</Button></Space>}
      />
      <DegradedBanner meta={meta} />

      <Card size="small" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>计划信息</div>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="计划编号">{plan.code}</Descriptions.Item>
          <Descriptions.Item label="计划名称">{plan.name}</Descriptions.Item>
          <Descriptions.Item label="起止日期">{plan.startDate || '--'} ~ {plan.endDate || '--'}</Descriptions.Item>
          <Descriptions.Item label="状态"><StatusTag value={plan.status} /></Descriptions.Item>
          <Descriptions.Item label="周期">{plan.cycle || '--'} / {plan.interval ?? '--'} 天</Descriptions.Item>
          <Descriptions.Item label="跳过规则">{plan.skip || '--'}</Descriptions.Item>
          <Descriptions.Item label="负责人">{plan.owner || '--'}</Descriptions.Item>
          <Descriptions.Item label="设备范围">{plan.deviceCount != null ? `${plan.deviceCount} 台` : '--'}</Descriptions.Item>
          <Descriptions.Item label="计划任务数">{plan.totalTasks ?? '--'}</Descriptions.Item>
          <Descriptions.Item label="已完成任务数">{plan.doneTasks ?? '--'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{plan.createTime || '--'}</Descriptions.Item>
          <Descriptions.Item label="备注">{plan.remark || '--'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small">
        <div style={{ fontWeight: 600, marginBottom: 12 }}>关联任务完成情况（快照内 {tasks.length} 条，已完成 {doneCount} 条）</div>
        <Table
          rowKey="code" size="small"
          dataSource={tasks}
          onRow={(r) => ({ onClick: () => navigate(`/inspection-tasks/detail?code=${encodeURIComponent(r.code)}`), style: { cursor: 'pointer' } })}
          locale={{ emptyText: <EmptyState description="暂无关联任务" reason="演示快照中该计划尚未生成点检任务" /> }}
          columns={[
            { title: '任务编号', dataIndex: 'code', width: 180 },
            { title: '点检日期', dataIndex: 'date', width: 120, render: v => v || '--' },
            { title: '应检设备数', dataIndex: 'shouldCount', width: 100, render: v => v ?? '--' },
            { title: '班组', dataIndex: 'group', width: 110, render: v => v || '--' },
            { title: '执行人', dataIndex: 'owner', width: 110, render: v => v || '--' },
            { title: '状态', dataIndex: 'status', width: 100, render: v => <StatusTag value={v} /> },
            { title: '备注', dataIndex: 'remark', ellipsis: true, render: v => v || '--' },
            {
              title: '操作', width: 130,
              render: (_, r) => (
                <Space size={0} onClick={(e) => e.stopPropagation()}>
                  <Button type="link" size="small" onClick={() => navigate(`/inspection-tasks/detail?code=${encodeURIComponent(r.code)}`)}>详情</Button>
                  {['未开始', '进行中'].includes(r.status) && (
                    <Button type="link" size="small" onClick={() => navigate(`/inspection-tasks/execute?code=${encodeURIComponent(r.code)}`)}>执行</Button>
                  )}
                </Space>
              ),
            },
          ]}
          pagination={false}
        />
      </Card>
    </>
  );
}
