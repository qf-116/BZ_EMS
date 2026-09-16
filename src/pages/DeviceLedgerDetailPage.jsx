import React, { useMemo } from 'react';
import { Card, Descriptions, Tag, Button, Space, App, Alert, Tabs, Table } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import DataSourceBadge from '../components/DataSourceBadge.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { selectDevice, selectBinding, selectHealth } from '../state/selectors.js';
// 点检/保养/巡检为演示种子（完整闭环由点巡保养业务模块承接）；维修/报警来自演示状态机
import { inspectionTaskDetails, inspectionTasks, maintenanceTasks, patrolTaskDetails, patrolPlanDevices, patrolTasks } from '../data/standardData.js';

const hint = { fontSize: 12, color: '#5d6b78', lineHeight: 1.8 };
const dash = (v) => (v === null || v === undefined || v === '' ? '--' : v);
const emptyText = (label) => <span style={{ color: '#8a97a3' }}>该设备暂无{label}（演示数据未覆盖）</span>;

// 设备档案详情：/device-ledger/detail/:deviceId；兼容旧 query（deviceId / code=资产编码）。
// 展示台账字段 + 关联绑定 / 监测编码 / OEE 资格；无效编号显示「未找到对象」，禁止回退第一条。
export default function DeviceLedgerDetailPage() {
  const { deviceId: deviceIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const state = useDemoState();
  const { message } = App.useApp();
  const meta = state.meta;

  const deviceId = useMemo(() => {
    if (deviceIdParam && state.entities.devicesById[deviceIdParam]) return deviceIdParam;
    const qDeviceId = searchParams.get('deviceId');
    if (qDeviceId && state.entities.devicesById[qDeviceId]) return qDeviceId;
    const code = searchParams.get('code');
    if (code) {
      const hit = Object.values(state.entities.crosswalkById).find(c => c.assetCode === code);
      if (hit) return hit.deviceId;
    }
    return null;
  }, [deviceIdParam, searchParams, state]);

  const device = useMemo(() => (deviceId ? selectDevice(state, deviceId) : null), [state, deviceId]);
  const binding = useMemo(() => (deviceId ? selectBinding(state, deviceId) : null), [state, deviceId]);
  const health = useMemo(() => (deviceId ? selectHealth(state, deviceId) : null), [state, deviceId]);

  // ===== 关联业务记录 =====
  // 点检/巡检/保养：演示种子按资产编码（assetCode）过滤，任务明细为最近一次任务的设备行，按最新任务补齐计划口径；
  // 维修/报警：演示状态机数据，按 canonical deviceId 过滤，跨页联动。
  const records = useMemo(() => {
    if (!device) return null;
    const code = device.assetCode;
    const latestInspectionTask = [...inspectionTasks].sort((a, b) => (b.date + b.createTime).localeCompare(a.date + a.createTime))[0];
    const inspectionRows = inspectionTaskDetails.filter(d => d.code === code).map(d => ({
      key: `XJ-${d.code}`,
      plan: latestInspectionTask?.plan || '--',
      date: latestInspectionTask?.date || '--',
      owner: latestInspectionTask?.owner || '--',
      taskStatus: latestInspectionTask?.status || '--',
      items: d.itemNames || '--', itemCount: d.itemTotal, checked: d.checked, unchecked: d.unchecked,
      execTime: d.execTime || '', skipReason: d.skipReason || '',
    }));
    const maintenanceRows = maintenanceTasks.filter(t => (t.device || '').includes(code)).map(t => ({ key: t.code, ...t }));
    const latestPatrolTask = [...patrolTasks].sort((a, b) => (b.date + b.createTime).localeCompare(a.date + a.createTime))[0];
    const patrolRows = patrolTaskDetails.filter(d => d.code === code).map(d => ({
      key: `XJ-P-${d.code}`,
      plan: latestPatrolTask?.plan || '--',
      date: latestPatrolTask?.date || '--',
      owner: latestPatrolTask?.owner || '--',
      taskStatus: latestPatrolTask?.status || '--',
      standard: patrolPlanDevices.find(p => p.code === code)?.standard || '--',
      items: d.itemNames || '--', itemCount: d.itemCount, checked: d.checked, unchecked: d.unchecked,
      execTime: d.execTime || '', skipReason: d.skipReason || '',
    }));
    const repairReportRows = Object.values(state.entities.repairReportsById)
      .filter(r => r.deviceId === device.deviceId).map(r => ({ key: r.reportId, ...r }));
    const repairOrderRows = Object.values(state.entities.repairOrdersById)
      .filter(r => r.deviceId === device.deviceId).map(r => ({ key: r.repairOrderId, ...r }));
    const alarmRows = Object.values(state.entities.alarmEventsById)
      .filter(a => a.deviceId === device.deviceId).map(a => ({ key: a.id, ...a }));
    return { inspectionRows, maintenanceRows, patrolRows, repairReportRows, repairOrderRows, alarmRows };
  }, [device, state]);

  if (!device) {
    const shown = deviceIdParam || searchParams.get('deviceId') || searchParams.get('code') || '未提供设备编号';
    return (
      <>
        <PageHeader
          title="设备档案详情"
          subtitle={`未找到设备：${shown}`}
          actions={<Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/device-ledger')}>返回列表</Button>}
        />
        <Card size="small">
          <EmptyState
            description="未找到对象：该设备编号在设备台账中不存在"
            reason="设备可能已被移除，或链接中的设备编号有误"
            next="返回设备台账"
            onNext={() => navigate('/device-ledger')}
            nextLabel="返回设备台账"
          />
        </Card>
      </>
    );
  }

  const sourceItems = (binding?.items || []).filter(i => i.enabled);

  return (
    <>
      <PageHeader
        title={`设备档案 · ${device.name}`}
        subtitle={`资产编号：${device.assetCode} · 设备ID：${device.deviceId}`}
        actions={(
          <Space>
            <DataSourceBadge meta={meta} />
            <Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/device-ledger')}>返回列表</Button>
          </Space>
        )}
      />
      <Card size="small" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>基础信息</div>
        <Descriptions size="small" bordered column={3} labelStyle={{ width: 120 }}>
          <Descriptions.Item label="资产编号">{device.assetCode}</Descriptions.Item>
          <Descriptions.Item label="设备名称">{device.name}</Descriptions.Item>
          <Descriptions.Item label="设备类型">{device.type || '--'}</Descriptions.Item>
          <Descriptions.Item label="规格型号">{device.model || '--'}</Descriptions.Item>
          <Descriptions.Item label="品牌">{device.brand || '--'}</Descriptions.Item>
          <Descriptions.Item label="设备ID">{device.deviceId}</Descriptions.Item>
          <Descriptions.Item label="组织">{device.organizationId || '--'}</Descriptions.Item>
          <Descriptions.Item label="车间">{device.workshopName || '--'}</Descriptions.Item>
          <Descriptions.Item label="产线 / 工位">{[device.lineName, device.stationName].filter(Boolean).join(' / ') || '--'}</Descriptions.Item>
          <Descriptions.Item label="生命周期"><StatusTag value={device.lifecycleStatus} /></Descriptions.Item>
          <Descriptions.Item label="设备负责人">{device.owner || '--'}</Descriptions.Item>
          <Descriptions.Item label="启用日期">{device.enableDate || '--'}</Descriptions.Item>
          <Descriptions.Item label="采购日期">{device.buyDate || '--'}</Descriptions.Item>
          <Descriptions.Item label="资产编号（档案）">{device.assetNo || '--'}</Descriptions.Item>
          <Descriptions.Item label="OEE 统计">
            <Tag color={device.oeeEligible ? 'success' : 'default'}>{device.oeeEligible ? '是' : '否'}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" style={{ marginBottom: 12 }} title="关联监测与绑定">
        {binding ? (
          <>
            <Descriptions size="small" bordered column={3} labelStyle={{ width: 120 }}>
              <Descriptions.Item label="监测编码">{device.monitorCode}</Descriptions.Item>
              <Descriptions.Item label="绑定ID">{binding.bindingId}</Descriptions.Item>
              <Descriptions.Item label="绑定版本">v{binding.version}</Descriptions.Item>
              <Descriptions.Item label="配置状态"><StatusTag value={binding.configStatus} /></Descriptions.Item>
              <Descriptions.Item label="通信健康"><StatusTag value={health?.status || null} /></Descriptions.Item>
              <Descriptions.Item label="最后样本">{health?.lastSampleAt || '--'}</Descriptions.Item>
              <Descriptions.Item label="生效区间">{binding.effectiveFrom || '--'} 至 {binding.effectiveTo || '至今'}</Descriptions.Item>
              <Descriptions.Item label="拉取周期">{binding.pullCycleSec != null ? `${binding.pullCycleSec} 秒` : '--'}</Descriptions.Item>
              <Descriptions.Item label="最近拉取">{binding.lastPullTime || '--'}</Descriptions.Item>
            </Descriptions>
            <div style={{ fontWeight: 600, margin: '12px 0 8px' }}>启用中的来源设备（{sourceItems.length}）</div>
            <Descriptions size="small" bordered column={2} labelStyle={{ width: 120 }}>
              {sourceItems.map(i => (
                <Descriptions.Item key={i.iotDeviceId} label={i.role === 'main' ? '主设备' : (i.sensorType || '子传感器')}>
                  <Space size={6}>
                    <span>{i.iotDeviceCode}</span>
                    <Tag>{(i.metrics || []).filter(m => m.selected).length} 项指标</Tag>
                  </Space>
                </Descriptions.Item>
              ))}
            </Descriptions>
            <div style={hint}>绑定关系与指标选择在「联网配置 / 绑定总览」中维护；台账页只读展示。</div>
          </>
        ) : (
          <Alert
            type="info" showIcon
            message="该设备尚未创建 IoT 绑定"
            description="未绑定设备不参与运行监测、报警判定与 OEE 统计；可在绑定总览中创建首个绑定。"
          />
        )}
      </Card>

      <Card size="small" style={{ marginBottom: 12 }} title="关联业务记录">
        <Alert
          type="info" showIcon style={{ marginBottom: 12 }}
          message="点检 / 巡检 / 保养记录来自演示种子数据（只读，完整闭环由点巡保养业务模块承接）；报修 / 维修工单 / 报警记录来自演示状态机，动作会实时联动到本页。"
        />
        <Tabs
          defaultActiveKey="inspection"
          items={[
            {
              key: 'inspection', label: `点检记录（${records.inspectionRows.length}）`,
              children: (
                <Table
                  rowKey="key" size="small" pagination={false}
                  dataSource={records.inspectionRows}
                  locale={{ emptyText: emptyText('点检记录') }}
                  columns={[
                    { title: '点检计划', dataIndex: 'plan', width: 180 },
                    { title: '任务日期', dataIndex: 'date', width: 100 },
                    { title: '任务状态', dataIndex: 'taskStatus', width: 90, render: (v) => <StatusTag value={v} /> },
                    { title: '点检项目', dataIndex: 'items' },
                    { title: '应检', dataIndex: 'itemCount', width: 70, align: 'center', render: dash },
                    { title: '已检', dataIndex: 'checked', width: 70, align: 'center', render: dash },
                    { title: '未检', dataIndex: 'unchecked', width: 70, align: 'center', render: (v) => (v > 0 ? <span style={{ color: '#cf1322' }}>{v}</span> : v) },
                    { title: '执行时间', dataIndex: 'execTime', width: 130, render: dash },
                    { title: '跳过原因', dataIndex: 'skipReason', render: dash },
                  ]}
                />
              ),
            },
            {
              key: 'maintenance', label: `保养记录（${records.maintenanceRows.length}）`,
              children: (
                <Table
                  rowKey="key" size="small" pagination={false}
                  dataSource={records.maintenanceRows}
                  locale={{ emptyText: emptyText('保养记录') }}
                  columns={[
                    { title: '任务编号', dataIndex: 'code', width: 150 },
                    { title: '保养计划', dataIndex: 'plan', width: 170 },
                    { title: '保养日期', dataIndex: 'date', width: 100 },
                    { title: '负责人', dataIndex: 'owner', width: 110, render: dash },
                    { title: '状态', dataIndex: 'status', width: 90, render: (v) => <StatusTag value={v} /> },
                    { title: '备注', dataIndex: 'remark', render: dash },
                  ]}
                />
              ),
            },
            {
              key: 'patrol', label: `巡检记录（${records.patrolRows.length}）`,
              children: (
                <Table
                  rowKey="key" size="small" pagination={false}
                  dataSource={records.patrolRows}
                  locale={{ emptyText: emptyText('巡检记录') }}
                  columns={[
                    { title: '巡检计划', dataIndex: 'plan', width: 170 },
                    { title: '巡检标准', dataIndex: 'standard', width: 160, render: dash },
                    { title: '任务日期', dataIndex: 'date', width: 100 },
                    { title: '任务状态', dataIndex: 'taskStatus', width: 90, render: (v) => <StatusTag value={v} /> },
                    { title: '巡检项目', dataIndex: 'items' },
                    { title: '应检', dataIndex: 'itemCount', width: 70, align: 'center', render: dash },
                    { title: '已检', dataIndex: 'checked', width: 70, align: 'center', render: dash },
                    { title: '未检', dataIndex: 'unchecked', width: 70, align: 'center', render: (v) => (v > 0 ? <span style={{ color: '#cf1322' }}>{v}</span> : v) },
                    { title: '执行时间', dataIndex: 'execTime', width: 130, render: dash },
                    { title: '跳过原因', dataIndex: 'skipReason', render: dash },
                  ]}
                />
              ),
            },
            {
              key: 'repair', label: `维修记录（${records.repairReportRows.length + records.repairOrderRows.length}）`,
              children: (
                <>
                  <div style={{ fontWeight: 600, margin: '4px 0 8px' }}>报修登记（{records.repairReportRows.length}）</div>
                  <Table
                    rowKey="key" size="small" pagination={false} style={{ marginBottom: 12 }}
                    dataSource={records.repairReportRows}
                    locale={{ emptyText: emptyText('报修登记') }}
                    columns={[
                      { title: '报修编号', dataIndex: 'reportId', width: 150 },
                      { title: '报修标题', dataIndex: 'title' },
                      { title: '故障类型', dataIndex: 'faultType', width: 90, render: dash },
                      { title: '级别', dataIndex: 'level', width: 80, render: (v) => <StatusTag value={v} /> },
                      { title: '状态', dataIndex: 'status', width: 100, render: (v) => <StatusTag value={v} /> },
                      { title: '报修人', dataIndex: 'creator', width: 90, render: dash },
                      { title: '报修时间', dataIndex: 'createTime', width: 140, render: dash },
                    ]}
                  />
                  <div style={{ fontWeight: 600, margin: '4px 0 8px' }}>维修工单（{records.repairOrderRows.length}）</div>
                  <Table
                    rowKey="key" size="small" pagination={false}
                    dataSource={records.repairOrderRows}
                    locale={{ emptyText: emptyText('维修工单') }}
                    columns={[
                      {
                        title: '工单号', dataIndex: 'repairOrderId', width: 150,
                        render: (v, r) => <a onClick={() => navigate(`/repair-orders/${r.repairOrderId}`)}>{v}</a>,
                      },
                      { title: '工单标题', dataIndex: 'title' },
                      { title: '故障类型', dataIndex: 'faultType', width: 90, render: dash },
                      { title: '级别', dataIndex: 'level', width: 80, render: (v) => <StatusTag value={v} /> },
                      { title: '状态', dataIndex: 'status', width: 100, render: (v) => <StatusTag value={v} /> },
                      { title: '维修人', dataIndex: 'assignee', width: 90, render: dash },
                      { title: '创建时间', dataIndex: 'createdAt', width: 140, render: dash },
                    ]}
                  />
                </>
              ),
            },
            {
              key: 'alarm', label: `报警记录（${records.alarmRows.length}）`,
              children: (
                <Table
                  rowKey="key" size="small" pagination={false}
                  dataSource={records.alarmRows}
                  locale={{ emptyText: emptyText('报警记录') }}
                  columns={[
                    { title: '报警ID', dataIndex: 'id', width: 160 },
                    { title: '报警名称', dataIndex: 'name' },
                    { title: '级别', dataIndex: 'severity', width: 80, render: (v) => <StatusTag value={v} /> },
                    { title: '状态', dataIndex: 'status', width: 110, render: (v) => <StatusTag value={v} /> },
                    { title: '触发指标', dataIndex: 'metric', width: 100, render: dash },
                    { title: '触发值', dataIndex: 'trigger', width: 100, render: dash },
                    { title: '触发时间', dataIndex: 'time', width: 100, render: dash },
                    { title: '持续时长', dataIndex: 'duration', width: 100, render: dash },
                  ]}
                />
              ),
            },
          ]}
        />
        <div style={hint}>维修工单可在「维修管理」中派工 / 执行 / 验收；状态变化实时反映在本页与各业务页面。</div>
      </Card>

      <Card size="small" style={{ marginBottom: 12 }} title="OEE 资格">
        <Descriptions size="small" bordered column={3} labelStyle={{ width: 120 }}>
          <Descriptions.Item label="是否纳入 OEE 分析">
            <Tag color={device.oeeEligible ? 'success' : 'default'}>{device.oeeEligible ? '是' : '否'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="绑定前提">
            {binding?.configStatus === '已启用' ? <Tag color="success">绑定已启用</Tag> : <Tag color="default">绑定未启用</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="说明">
            纳入 OEE 分析的设备需绑定已启用并在 OEE 效率分析中维护理想速度与计划停机口径
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" title="设备二维码">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 96, height: 96, background: 'repeating-conic-gradient(#202730 0% 25%, #fff 0% 50%) 50% / 10px 10px', borderRadius: 6 }} />
          <div style={hint}>
            <div>资产编号：{device.assetCode}</div>
            <div>设备名称：{device.name}</div>
            <div>规格型号：{device.model || '--'}</div>
            <div>设备类型：{device.type || '--'}</div>
            <div>车间 / 产线：{device.workshopName || '--'} / {device.lineName || '--'}</div>
          </div>
        </div>
      </Card>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Space>
          <Button onClick={() => message.info('已打印（38*68 mm 标签，演示）')}>打印二维码</Button>
          <Button onClick={() => navigate(`/device-ledger/detail/${device.deviceId}`)}>刷新</Button>
          <Button onClick={() => navigate('/device-ledger')}>关闭</Button>
        </Space>
      </div>
    </>
  );
}
