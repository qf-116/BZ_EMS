import React, { useMemo } from 'react';
import { Card, Descriptions, Table, Button, Alert, Tooltip } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataSourceBadge from '../components/DataSourceBadge.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { patrolPlans, patrolPlanDevices, patrolTasks } from '../data/standardData.js';
import { crosswalkByAssetCode } from '../data/demo/deviceCrosswalk.js';

// 设备展示统一经 crosswalk canonical 映射（§3.1）：资产编码 → canonical 设备（deviceId/展示名）。
const canonDevice = (assetCode) => crosswalkByAssetCode[assetCode] || null;

function CanonicalDeviceCell({ code, seedName }) {
  const c = canonDevice(code);
  if (!c) return code || '--';
  return (
    <Tooltip title={`canonical 设备映射：${c.deviceId} · 台账种子名称：${seedName || '--'}`}>
      <span>{c.name}（{code}）</span>
    </Tooltip>
  );
}

// 巡检计划详情（范围外演示模块）：searchParams 读 id（兼容 code），无匹配显示「未找到对象」。
// 上半部分为计划信息与巡检线路设备（patrolPlanDevices 快照），下半部分为该计划的关联巡检任务。
export default function PatrolPlanDetailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const state = useDemoState();
  const meta = state.meta;
  const id = params.get('id') || params.get('code');

  const plan = useMemo(() => patrolPlans.find(p => p.code === id) || null, [id]);

  const lineDevices = useMemo(
    () => (plan ? patrolPlanDevices.filter(d => d.standard === plan.name.replace(/巡检计划$/, '巡检标准')) : []),
    [plan],
  );

  const tasks = useMemo(
    () => (plan
      ? patrolTasks
        .filter(t => t.plan === plan.name)
        .slice()
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      : []),
    [plan],
  );

  if (!plan) {
    return (
      <>
        <PageHeader
          title="巡检计划详情"
          actions={<Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/patrol-plans')}>返回列表</Button>}
        />
        <Card size="small">
          <EmptyState description={`未找到巡检计划${id ? `（${id}）` : ''}`} reason="计划编号无效或该计划不在演示快照中" />
        </Card>
      </>
    );
  }

  const progress = plan.totalTasks ? Math.round((plan.doneTasks || 0) / plan.totalTasks * 100) : 0;

  return (
    <>
      <PageHeader
        title={`巡检计划详情 · ${plan.name}`}
        subtitle={`计划编号 ${plan.code} · 数据为演示快照（更新于 ${meta.updatedAt}）`}
        actions={<>
          <DataSourceBadge meta={meta} />
          <Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/patrol-plans')}>返回列表</Button>
        </>}
      />
      <DegradedBanner meta={meta} />
      <Card size="small" style={{ marginBottom: 12 }}>
        <Descriptions column={3} size="small">
          <Descriptions.Item label="计划编号">{plan.code}</Descriptions.Item>
          <Descriptions.Item label="计划名称（巡检线路）">{plan.name}</Descriptions.Item>
          <Descriptions.Item label="状态"><StatusTag value={plan.status} tip={plan.remark} /></Descriptions.Item>
          <Descriptions.Item label="巡检周期">
            {plan.cycle || '--'}{plan.interval ? ` · 每 ${plan.interval} 个周期` : ''}{plan.skip ? ` · ${plan.skip}` : ''}
          </Descriptions.Item>
          <Descriptions.Item label="起止时间">{plan.startDate || '--'} ~ {plan.endDate || '--'}</Descriptions.Item>
          <Descriptions.Item label="负责人">{plan.owner || '--'}</Descriptions.Item>
          <Descriptions.Item label="线路设备数">{plan.deviceCount} 台</Descriptions.Item>
          <Descriptions.Item label="执行进度">{plan.doneTasks ?? '--'} / {plan.totalTasks ?? '--'}（{progress}%）</Descriptions.Item>
          <Descriptions.Item label="创建时间">{plan.createTime || '--'}</Descriptions.Item>
          <Descriptions.Item label="备注" span={3}>{plan.remark || '--'}</Descriptions.Item>
        </Descriptions>
      </Card>
      {plan.deviceCount !== lineDevices.length && (
        <Alert
          type="info" showIcon style={{ marginBottom: 12 }}
          message={`演示快照口径：巡检线路设备快照为各计划线路设备并集（${lineDevices.length} 台），与计划档案设备数 ${plan.deviceCount} 台仅供对照。`}
        />
      )}
      <Card type="inner" size="small" title="巡检线路设备（canonical 映射）" style={{ marginBottom: 12 }}>
        <Table
          rowKey="code" size="small" pagination={false}
          dataSource={lineDevices}
          locale={{ emptyText: <EmptyState description="该计划暂无巡检线路设备" reason="演示快照中未包含该线路的设备行" /> }}
          columns={[
            { title: '设备编号', dataIndex: 'code', width: 130 },
            { title: '设备名称', width: 200, render: (_, r) => <CanonicalDeviceCell code={r.code} seedName={r.name} /> },
            { title: '规格型号', dataIndex: 'model', width: 100, render: v => v || '--' },
            { title: '设备类型', dataIndex: 'type', width: 110, render: v => v || '--' },
            { title: '所属部门', dataIndex: 'dept', width: 160, render: v => v || '--' },
            { title: '工位', dataIndex: 'station', width: 100, render: v => v || '--' },
            { title: '巡检标准', dataIndex: 'standard', width: 190, render: v => v || '--' },
            { title: '巡检项目数', dataIndex: 'itemCount', width: 100, align: 'center', render: v => (v != null ? `${v} 项` : '--') },
          ]}
        />
      </Card>
      <Card type="inner" size="small" title={`关联巡检任务（${tasks.length}）`}>
        <Table
          rowKey="code" size="small"
          dataSource={tasks}
          locale={{ emptyText: <EmptyState description="该计划暂无关联巡检任务" reason="演示快照中未生成该计划的任务" /> }}
          onRow={(r) => ({ onClick: () => navigate(`/patrol-tasks/detail?id=${encodeURIComponent(r.code)}`), style: { cursor: 'pointer' } })}
          pagination={{ pageSize: 5, showTotal: t => `共 ${t} 条` }}
          columns={[
            { title: '任务编号', dataIndex: 'code', width: 200 },
            { title: '巡检日期', dataIndex: 'date', width: 110 },
            { title: '应巡设备数', dataIndex: 'shouldCount', width: 100, align: 'center', render: v => (v != null ? `${v} 台` : '--') },
            { title: '负责人', dataIndex: 'owner', width: 120, render: v => v || '--' },
            { title: '状态', dataIndex: 'status', width: 100, render: v => <StatusTag value={v} /> },
            { title: '创建时间', dataIndex: 'createTime', width: 160, render: v => v || '--' },
            {
              title: '操作', width: 140, fixed: 'right',
              render: (_, r) => (
                <span onClick={e => e.stopPropagation()}>
                  {['未开始', '进行中', '已逾期'].includes(r.status) && (
                    <Button type="link" size="small" onClick={() => navigate(`/patrol-tasks/execute?id=${encodeURIComponent(r.code)}`)}>执行</Button>
                  )}
                  <Button type="link" size="small" onClick={() => navigate(`/patrol-tasks/detail?id=${encodeURIComponent(r.code)}`)}>详情</Button>
                </span>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
