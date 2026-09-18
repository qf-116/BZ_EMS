import React from 'react';
import { Card, Descriptions, Table, Button, Tag, Tooltip } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import {
  maintenancePlans,
  maintenancePlanDetails,
  maintenanceTasks,
} from '../data/standardData.js';
import { crosswalkByAssetCode } from '../data/demo/deviceCrosswalk.js';

const dash = (v) => (v === null || v === undefined || v === '' ? '--' : v);

// 设备展示统一经 crosswalk canonical 映射：assetCode → canonical 展示名 / deviceId
function deviceOf(assetCode) {
  const cw = crosswalkByAssetCode[assetCode];
  return { code: assetCode, name: cw ? cw.name : assetCode, deviceId: cw ? cw.deviceId : null };
}

// 计划 → 明细口径：计划名称 → 关联保养标准（种子 maintenancePlanDetails.standard）
const PLAN_STANDARD_MAP = {
  数控车床一级保养计划: '数控车床月度保养标准',
  激光焊接机二级保养计划: '激光焊接机半年度保养标准',
  空压机三级保养计划: '空压机月度保养标准',
  油压机年度保养计划: '油压机年度保养标准',
};

// 保养计划详情（范围外演示模块，只读）：/maintenance-plans/detail?code=（兼容 ?id=）。
// 展示计划基本信息 + 关联保养设备明细（crosswalk canonical）+ 名下关联保养任务。
export default function MaintenancePlanDetailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const state = useDemoState();
  const meta = state.meta;

  const code = params.get('code') || params.get('id');
  const plan = code ? maintenancePlans.find(r => r.code === code) : null;

  if (!plan) {
    return (
      <>
        <PageHeader
          title="保养计划详情"
          actions={<Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/maintenance-plans')}>返回列表</Button>}
        />
        <Card size="small">
          <EmptyState
            description={`未找到保养计划${code ? `（${code}）` : ''}`}
            reason="计划编号无效或该计划不存在（不回退展示其他计划）"
            next
            onNext={() => navigate('/maintenance-plans')}
            nextLabel="返回保养计划列表"
          />
        </Card>
      </>
    );
  }

  const standardName = PLAN_STANDARD_MAP[plan.name] || null;
  const deviceRows = standardName
    ? maintenancePlanDetails.filter(d => d.standard === standardName)
    : [];
  const tasks = maintenanceTasks.filter(t => t.plan === plan.name);

  return (
    <>
      <PageHeader
        title={`保养计划详情 · ${plan.code}`}
        subtitle={`${plan.name}`}
        actions={<Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/maintenance-plans')}>返回列表</Button>}
      />
      <DegradedBanner meta={meta} />
      <Card size="small" style={{ marginBottom: 12 }}>
        <Descriptions column={3} size="small" bordered>
          <Descriptions.Item label="计划编号">{plan.code}</Descriptions.Item>
          <Descriptions.Item label="计划名称">{dash(plan.name)}</Descriptions.Item>
          <Descriptions.Item label="状态"><StatusTag value={plan.status} /></Descriptions.Item>
          <Descriptions.Item label="年度">{dash(plan.year)}</Descriptions.Item>
          <Descriptions.Item label="保养级别">{dash(plan.level)}</Descriptions.Item>
          <Descriptions.Item label="保养方式">{dash(plan.method)}</Descriptions.Item>
          <Descriptions.Item label="计划日期">{dash(plan.planDate)}</Descriptions.Item>
          <Descriptions.Item label="起止日期">{dash(plan.startDate)} ~ {dash(plan.endDate)}</Descriptions.Item>
          <Descriptions.Item label="周期">
            {plan.cycle || '--'}{plan.intervalDays ? `（间隔 ${plan.intervalDays} 天）` : ''}{plan.skipDays ? ` · ${plan.skipDays}` : ''}
          </Descriptions.Item>
          <Descriptions.Item label="关联设备">{dash(plan.devices)}</Descriptions.Item>
          <Descriptions.Item label="保养项目">{dash(plan.items)}</Descriptions.Item>
          <Descriptions.Item label="执行人">{dash(plan.executor)}</Descriptions.Item>
          <Descriptions.Item label="创建人">{dash(plan.creator)}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dash(plan.createTime)}</Descriptions.Item>
          <Descriptions.Item label="数据基准">{meta.updatedAt}</Descriptions.Item>
          <Descriptions.Item label="备注" span={3}>{dash(plan.remark)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card type="inner" size="small" title={`关联保养设备明细${standardName ? `（关联标准：${standardName}）` : ''}`} style={{ marginBottom: 12 }}>
        {deviceRows.length ? (
          <Table
            rowKey="code" size="small" pagination={false}
            dataSource={deviceRows}
            columns={[
              { title: '设备编号', dataIndex: 'code', width: 130, render: v => v || '--' },
              {
                title: '设备名称（canonical）', width: 220,
                render: (_, r) => {
                  const d = deviceOf(r.code);
                  return (
                    <span>
                      {d.name}（{d.code}）
                      {d.deviceId ? <Tag style={{ marginLeft: 6 }}>{d.deviceId}</Tag> : null}
                    </span>
                  );
                },
              },
              { title: '设备类型', dataIndex: 'type', width: 100, render: v => dash(v) },
              { title: '所属部门', dataIndex: 'dept', width: 170, render: v => dash(v) },
              { title: '工位', dataIndex: 'station', width: 100, render: v => dash(v) },
              { title: '关联保养标准', dataIndex: 'standard', width: 200, render: v => dash(v) },
              { title: '保养项目数', dataIndex: 'itemCount', width: 100, render: v => dash(v) },
            ]}
          />
        ) : (
          <EmptyState
            description="该计划暂无设备明细"
            reason={standardName
              ? `暂无「${standardName}」对应的设备明细数据`
              : '该计划暂未关联保养标准'}
          />
        )}
      </Card>

      <Card type="inner" size="small" title={`关联保养任务（${tasks.length}）`} style={{ marginBottom: 12 }}>
        {tasks.length ? (
          <Table
            rowKey="code" size="small" pagination={false}
            onRow={(r) => ({ onClick: () => navigate(`/maintenance-tasks/detail?code=${encodeURIComponent(r.code)}`), style: { cursor: 'pointer' } })}
            dataSource={tasks}
            columns={[
              { title: '任务编号', dataIndex: 'code', width: 160 },
              { title: '保养设备', dataIndex: 'device', width: 220, render: v => dash(v) },
              { title: '所属部门', dataIndex: 'dept', width: 150, render: v => dash(v) },
              { title: '计划时间', dataIndex: 'date', width: 110, render: v => dash(v) },
              { title: '执行人', dataIndex: 'owner', width: 110, render: v => dash(v) },
              { title: '状态', dataIndex: 'status', width: 90, render: v => <StatusTag value={v} /> },
              {
                title: '备注', dataIndex: 'remark', width: 200, ellipsis: true,
                render: v => (v ? <Tooltip title={v}>{v}</Tooltip> : '--'),
              },
              {
                title: '操作', width: 80,
                render: (_, r) => (
                  <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/maintenance-tasks/detail?code=${encodeURIComponent(r.code)}`); }}>详情</Button>
                ),
              },
            ]}
          />
        ) : (
          <EmptyState
            description="该计划暂无关联保养任务"
            reason="该计划暂未生成保养任务"
          />
        )}
      </Card>

      <div style={{ textAlign: 'right' }}>
        <Button type="primary" onClick={() => navigate('/maintenance-plans')}>关闭</Button>
      </div>
    </>
  );
}
