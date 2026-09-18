import React, { useMemo, useState } from 'react';
import { Card, Table, Button, Space, Input, Select, Tooltip, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { maintenanceTasks } from '../data/standardData.js';
import { crosswalkByAssetCode } from '../data/demo/deviceCrosswalk.js';

// 设备展示统一经 crosswalk canonical 映射：种子 device 字段（如「数控车床 MT2024A1201」）
// 解析出资产码后由 crosswalk 解析 canonical 名称 / deviceId，不做字符串推导命名。
function deviceOf(deviceStr) {
  const m = String(deviceStr || '').match(/MT\d{4}A\d+/);
  const assetCode = m ? m[0] : null;
  const cw = assetCode ? crosswalkByAssetCode[assetCode] : null;
  return {
    assetCode,
    name: cw ? cw.name : (deviceStr || '--'),
    deviceId: cw ? cw.deviceId : null,
  };
}

const canExecute = (r) => ['未开始', '进行中'].includes(r.status);

// 保养任务列表（范围外演示模块）：只读种子 maintenanceTasks；状态轴统一 StatusTag；
// 行点击进入任务详情（query ?code=），未开始 / 进行中任务提供「执行」入口。
export default function MaintenanceTasksPage() {
  const navigate = useNavigate();
  const state = useDemoState();
  const meta = state.meta;

  const [kw, setKw] = useState('');
  const [status, setStatus] = useState(null);

  const statusOptions = useMemo(
    () => [...new Set(maintenanceTasks.map(r => r.status))].map(v => ({ value: v, label: v })),
    [],
  );

  const list = useMemo(() => maintenanceTasks
    .filter(r => !status || r.status === status)
    .filter(r => !kw || (r.code || '').includes(kw) || (r.name || '').includes(kw)
      || (r.device || '').includes(kw) || (r.owner || '').includes(kw)), [kw, status]);

  return (
    <>
      <PageHeader
        title="保养任务"
        subtitle={`保养计划生成的执行任务 · 共 ${maintenanceTasks.length} 条 · 按计划时间正序 · 行点击进入详情 / 执行`}
      />
      <DegradedBanner meta={meta} />
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap>
          <Input.Search style={{ width: 240 }} placeholder="任务编号 / 计划 / 设备 / 执行人" allowClear
            onSearch={setKw} onChange={e => { if (!e.target.value) setKw(''); }} />
          <Select style={{ width: 120 }} placeholder="状态" allowClear options={statusOptions} value={status} onChange={setStatus} />
          <Button onClick={() => { setKw(''); setStatus(null); }}>重置</Button>
        </Space>
      </Card>
      <Card size="small">
        <Table
          rowKey="code" size="small"
          dataSource={list}
          onRow={(r) => ({ onClick: () => navigate(`/maintenance-tasks/detail?code=${encodeURIComponent(r.code)}`), style: { cursor: 'pointer' } })}
          locale={{
            emptyText: (
              <EmptyState
                description="暂无保养任务"
                reason={kw || status ? '当前筛选条件下没有保养任务' : '暂无保养任务数据'}
              />
            ),
          }}
          columns={[
            { title: '任务编号', dataIndex: 'code', width: 160, fixed: 'left' },
            { title: '所属计划', dataIndex: 'name', width: 190, render: v => v || '--' },
            {
              title: '保养设备', dataIndex: 'device', width: 210,
              render: (v, r) => {
                const d = deviceOf(v);
                return (
                  <span>
                    {d.name}{d.assetCode ? `（${d.assetCode}）` : ''}
                    {d.deviceId ? <Tag style={{ marginLeft: 6 }}>{d.deviceId}</Tag> : null}
                  </span>
                );
              },
            },
            { title: '所属部门', dataIndex: 'dept', width: 150, render: v => v || '--' },
            { title: '计划时间', dataIndex: 'date', width: 110, render: v => v || '--' },
            { title: '执行人', dataIndex: 'owner', width: 110, render: v => v || '--' },
            { title: '状态', dataIndex: 'status', width: 90, render: v => <StatusTag value={v} /> },
            {
              title: '备注', dataIndex: 'remark', width: 200, ellipsis: true,
              render: v => (v ? <Tooltip title={v}>{v}</Tooltip> : '--'),
            },
            { title: '创建时间', dataIndex: 'createTime', width: 150, render: v => v || '--' },
            {
              title: '操作', width: 110, fixed: 'right',
              render: (_, r) => (
                <Space size={0} onClick={(e) => e.stopPropagation()}>
                  {canExecute(r) && (
                    <Button type="link" size="small" onClick={() => navigate(`/maintenance-tasks/execute?code=${encodeURIComponent(r.code)}`)}>执行</Button>
                  )}
                  <Button type="link" size="small" onClick={() => navigate(`/maintenance-tasks/detail?code=${encodeURIComponent(r.code)}`)}>详情</Button>
                </Space>
              ),
            },
          ]}
          scroll={{ x: 1380 }}
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
        />
      </Card>
    </>
  );
}
