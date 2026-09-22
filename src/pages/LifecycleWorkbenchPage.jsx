import React, { useMemo } from 'react';
import { Button, Card, Space, Table } from 'antd';
import { Archive, ArrowRightLeft, CirclePause, ClipboardCheck, FilePlus2, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import MetricTile from '../components/MetricTile.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { selectWorkbench } from '../state/selectors.js';

export default function LifecycleWorkbenchPage() {
  const navigate = useNavigate();
  const state = useDemoState();
  const wb = useMemo(() => selectWorkbench(state), [state]);
  const lifecycle = wb.lifecycle || {};

  const taskTodos = [
    ...(lifecycle.pendingProcurement || []),
    ...(lifecycle.pendingTrial || []),
    ...(lifecycle.pendingRegistration || []),
  ];
  const governanceTodos = [
    ...(lifecycle.changes || []).filter(r => ['待审批', '审批通过'].includes(r.status)),
    ...(lifecycle.idle || []).filter(r => ['复核中', '待审批'].includes(r.status)),
    ...(lifecycle.scraps || []).filter(r => ['技术鉴定中', '待财务核销', '已报废'].includes(r.status)),
  ];

  const taskRoute = (record) => {
    if (record.status === '使用部门试用确认中') return '/lifecycle/tasks/trial-confirmation';
    if (record.status === '待设备手续入账') return '/lifecycle/tasks/device-registration';
    return '/lifecycle/tasks/procurement-entry';
  };

  const governanceRoute = (record) => {
    if (record.changeId) return '/lifecycle/changes';
    if (record.idleId) return '/lifecycle/idle';
    return '/lifecycle/scrap';
  };

  return (
    <>
      <PageHeader
        title="生命周期工作台"
        subtitle={`采购入账 → 使用部门试用确认 → 设备办理手续入账 · 更新于 ${state.meta.updatedAt || '--'}`}
        actions={(
          <Button type="primary" icon={<FilePlus2 size={14} />} onClick={() => navigate('/lifecycle/tasks/procurement-entry')}>
            新建采购入账
          </Button>
        )}
      />

      <div className="metric-grid" style={{ marginBottom: 12 }}>
        <MetricTile label="待采购入账" value={(lifecycle.pendingProcurement || []).length} unit="单" color="#1668dc" />
        <MetricTile label="待试用确认" value={(lifecycle.pendingTrial || []).length} unit="单" color="#7c3aed" />
        <MetricTile label="试用不合格退回" value={(lifecycle.rejected || []).length} unit="单" color="#dc2626" />
        <MetricTile label="待设备手续入账" value={(lifecycle.pendingRegistration || []).length} unit="单" color="#d46b08" />
        <MetricTile label="待处理资产变更" value={(lifecycle.changes || []).filter(r => ['待审批', '审批通过'].includes(r.status)).length} unit="单" color="#08979c" />
        <MetricTile label="闲置/报废待处理" value={(lifecycle.idle || []).filter(r => ['复核中', '待审批'].includes(r.status)).length + (lifecycle.scraps || []).filter(r => ['技术鉴定中', '待财务核销', '已报废'].includes(r.status)).length} unit="单" color="#d97706" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 12 }}>
        <Card
          size="small"
          title={<Space size={6}><ClipboardCheck size={15} /> 设备入账待办</Space>}
          extra={<Button type="link" size="small" onClick={() => navigate('/lifecycle/tasks')}>全部任务</Button>}
        >
          {taskTodos.length ? (
            <Table
              rowKey="taskId" size="small" pagination={false}
              dataSource={taskTodos}
              columns={[
                { title: '任务号', dataIndex: 'taskNo', width: 160 },
                { title: '设备', dataIndex: 'equipmentName', ellipsis: true, render: v => v || '待填写' },
                { title: '使用部门', dataIndex: 'useDept', width: 110, render: v => v || '--' },
                { title: '当前节点', dataIndex: 'status', width: 150, render: v => <StatusTag value={v} /> },
                { title: '操作', width: 80, render: (_, r) => <Button type="link" size="small" onClick={() => navigate(taskRoute(r))}>去处理</Button> },
              ]}
            />
          ) : (
            <EmptyState description="暂无主流程待办" reason="采购入账、试用确认和设备手续入账任务会出现在此处" />
          )}
        </Card>

        <Card
          size="small"
          title={<Space size={6}><ArrowRightLeft size={15} /> 资产治理待办</Space>}
        >
          {governanceTodos.length ? (
            <Table
              rowKey={r => r.changeId || r.idleId || r.scrapId} size="small" pagination={false}
              dataSource={governanceTodos}
              columns={[
                { title: '业务', key: 'business', width: 95, render: (_, r) => (r.changeId ? '资产变更' : r.idleId ? '闲置管理' : '报废归档') },
                { title: '单号', key: 'no', width: 150, render: (_, r) => r.changeNo || r.idleNo || r.scrapNo },
                { title: '状态', dataIndex: 'status', width: 100, render: v => <StatusTag value={v} /> },
                { title: '操作', width: 80, render: (_, r) => <Button type="link" size="small" onClick={() => navigate(governanceRoute(r))}>去处理</Button> },
              ]}
            />
          ) : (
            <EmptyState
              description="暂无资产治理待办"
              reason="调拨、改造、借用、外送、闲置复核和报废核销待办会出现在此处"
            />
          )}
        </Card>

        <Card
          size="small"
          title={<Space size={6}><CirclePause size={15} /> 闲置与报废概览</Space>}
          extra={<Button type="link" size="small" onClick={() => navigate('/lifecycle/idle')}>闲置管理</Button>}
        >
          <Table
            rowKey={r => r.idleId || r.scrapId} size="small" pagination={false}
            dataSource={[...(lifecycle.idle || []), ...(lifecycle.scraps || [])]}
            columns={[
              { title: '单号', key: 'no', width: 155, render: (_, r) => r.idleNo || r.scrapNo },
              { title: '类型', key: 'type', width: 90, render: (_, r) => (r.idleId ? '闲置' : '报废') },
              { title: '状态', dataIndex: 'status', width: 110, render: v => <StatusTag value={v} /> },
              { title: '去向', key: 'target', render: (_, r) => (r.idleId ? `/lifecycle/idle` : `/lifecycle/scrap`) },
            ]}
          />
        </Card>

        <Card
          size="small"
          title={<Space size={6}><Archive size={15} /> 主流程结果</Space>}
          extra={<Button type="link" size="small" onClick={() => navigate('/lifecycle/tasks')}>查看任务</Button>}
        >
          <Table
            rowKey="taskId" size="small" pagination={false}
            dataSource={[...(lifecycle.rejected || []), ...(lifecycle.completed || [])]}
            columns={[
              { title: '任务号', dataIndex: 'taskNo', width: 155 },
              { title: '设备', dataIndex: 'equipmentName', ellipsis: true, render: v => v || '待填写' },
              { title: '结果', key: 'result', width: 140, render: (_, r) => (
                <Space size={4}>
                  {r.status === '试用不合格退回' ? <RotateCcw size={13} /> : null}
                  <StatusTag value={r.status} />
                </Space>
              ) },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
