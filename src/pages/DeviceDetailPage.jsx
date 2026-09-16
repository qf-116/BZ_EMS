import React, { useMemo, useState } from 'react';
import { Card, Tabs, Table, Tag, Button, Space, Alert, Descriptions } from 'antd';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FileText } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import DataSourceBadge from '../components/DataSourceBadge.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import MetricTile from '../components/MetricTile.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { selectDevice360 } from '../state/selectors.js';

const QUALITY_COLOR = { GOOD: 'success', DELAYED: 'processing', NO_VALUE: 'warning', OFFLINE: 'error', BAD: 'error' };
const QUALITY_LABEL = { GOOD: '正常', DELAYED: '延迟', NO_VALUE: '无值', OFFLINE: '离线', BAD: '异常' };

// 设备监测详情：/device/:deviceId；兼容旧入口 query（deviceId / monitorCode / code=资产编码）。
// 无效设备号显示「未找到对象」，禁止回退第一条（硬规则）。
export default function DeviceDetailPage() {
  const { deviceId: deviceIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const state = useDemoState();
  const meta = state.meta;

  // 参数解析：路由 param 优先；无 param 时读旧 query
  const deviceId = useMemo(() => {
    if (deviceIdParam) return deviceIdParam;
    const qDeviceId = searchParams.get('deviceId') || searchParams.get('monitorCode');
    if (qDeviceId && state.entities.devicesById[qDeviceId]) return qDeviceId;
    const code = searchParams.get('code');
    if (code) {
      const hit = Object.values(state.entities.crosswalkById).find(c => c.assetCode === code);
      if (hit) return hit.deviceId;
    }
    return null;
  }, [deviceIdParam, searchParams, state]);

  const d360 = useMemo(() => (deviceId ? selectDevice360(state, deviceId) : null), [state, deviceId]);

  const [trendKey, setTrendKey] = useState(null);

  if (!d360) {
    const hint = deviceIdParam || searchParams.get('deviceId') || searchParams.get('code') || '未提供设备编号';
    return (
      <>
        <PageHeader title="设备监测详情" subtitle={`未找到设备：${hint}`} />
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

  const { device, binding, realtime, health, activeAlarms, repair, downtime, oee } = d360;
  const lifecycleOnly = device.lifecycleStatus !== '在用';

  // 趋势：使用演示快照中的确定性趋势序列（trends[`${deviceId}|${metricCode}`]）
  const trendEntries = Object.keys(state.entities.trends || {})
    .filter(k => k.startsWith(`${deviceId}|`))
    .map(k => ({ key: k, metricCode: k.split('|')[1], values: state.entities.trends[k] }));
  const currentTrend = trendEntries.find(t => t.key === trendKey) || trendEntries[0] || null;

  const metricColumns = [
    { title: '指标编码', dataIndex: 'metricCode', width: 160 },
    { title: '指标名称', dataIndex: 'name', width: 120 },
    { title: '来源设备', dataIndex: 'iotDeviceCode', width: 130, render: v => v || '--' },
    { title: '值', dataIndex: 'value', width: 100, render: v => (v ?? '--') },
    { title: '单位', dataIndex: 'unit', width: 80, render: v => v || '--' },
    {
      title: '质量码', dataIndex: 'qualityCode', width: 100,
      render: v => <Tag color={QUALITY_COLOR[v] || 'default'}>{QUALITY_LABEL[v] || v || '--'}</Tag>,
    },
    { title: '采集时间 sourceTime', dataIndex: 'sourceTime', width: 140, render: v => v || '--' },
    { title: '接收时间 receiveTime', dataIndex: 'receiveTime', width: 140, render: v => v || '--' },
    { title: '指标版本', dataIndex: 'metricVersion', width: 90, render: v => v || '--' },
  ];

  return (
    <>
      <PageHeader
        title={`${device.name} · ${device.assetCode}`}
        subtitle={`${device.location || '--'} · 通信健康 ${health.status || '--'}${health.latencySec != null ? `（延迟 ${health.latencySec}s）` : ''} · 最后样本 ${health.lastSampleAt || '--'}`}
        actions={(
          <Space>
            <DataSourceBadge meta={meta} />
            <Button icon={<FileText size={14} />} onClick={() => navigate(`/device-ledger/detail/${deviceId}`)}>设备档案详情</Button>
          </Space>
        )}
      />
      <DegradedBanner meta={meta} />
      {lifecycleOnly && (
        <Alert
          type="info" showIcon style={{ marginBottom: 12 }}
          message={`该设备生命周期状态为「${device.lifecycleStatus}」，不参与运行监测与 OEE 统计，以下仅展示台账与绑定信息。`}
        />
      )}
      {realtime.healthStatus === '数据中断' && !lifecycleOnly && (
        <Alert
          type="warning" showIcon style={{ marginBottom: 12 }}
          message="该设备数据中断：所有指标无数据（无数据 ≠ 0）"
          description={`最后样本 ${health.lastSampleAt || '--'}。可查看接入任务了解失败原因与下一步处理建议。`}
        />
      )}

      <Card size="small" style={{ marginBottom: 12 }} title="基本信息">
        <Descriptions size="small" bordered column={3}>
          <Descriptions.Item label="设备ID">{device.deviceId}</Descriptions.Item>
          <Descriptions.Item label="设备名称">{device.name}</Descriptions.Item>
          <Descriptions.Item label="型号">{device.model || '--'}</Descriptions.Item>
          <Descriptions.Item label="资产编号">{device.assetCode}</Descriptions.Item>
          <Descriptions.Item label="监测编码">{device.monitorCode}</Descriptions.Item>
          <Descriptions.Item label="品牌">{device.brand || '--'}</Descriptions.Item>
          <Descriptions.Item label="位置">{device.location || '--'}</Descriptions.Item>
          <Descriptions.Item label="生命周期"><StatusTag value={device.lifecycleStatus} /></Descriptions.Item>
          <Descriptions.Item label="绑定状态"><StatusTag value={binding?.configStatus || '未配置'} tip={binding ? `绑定 v${binding.version}` : '未创建绑定'} /></Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs
        defaultActiveKey="realtime"
        items={[
          {
            key: 'realtime', label: '实时样本', children: (
              <>
                <div className="metric-grid" style={{ marginBottom: 12 }}>
                  <MetricTile label="运行状态" value={lifecycleOnly ? null : realtime.runStatus || null} color="#0e5a74" />
                  <MetricTile label="通信健康" value={lifecycleOnly ? null : health.status || null} color="#227b52" />
                  <MetricTile label="数据延迟" value={health.latencySec ?? null} unit="s" color="#b45309" />
                  <MetricTile label="采集质量率" value={lifecycleOnly ? null : health.qualityRate || null} color="#0e5a74" />
                  <MetricTile label="OEE（实时窗口）" value={oee && oee.oee != null ? oee.oee : null} unit={oee && oee.oee != null ? '%' : undefined} color="#227b52" />
                </div>
                {oee && oee.oee == null && !lifecycleOnly && (
                  <Alert
                    type="info" showIcon style={{ marginBottom: 12 }}
                    message={`OEE 不可计算：${(oee.blockers || []).join('；') || '该窗口无生产数据'}`}
                  />
                )}
                <Card size="small" title={`实时指标样本（绑定 ${binding ? `v${binding.version}` : '未配置'}）`}>
                  <Table
                    rowKey={r => `${r.iotDeviceCode}|${r.metricCode}`}
                    size="small" pagination={false}
                    dataSource={realtime.metrics}
                    columns={metricColumns}
                    locale={{ emptyText: <EmptyState description="该设备未配置启用的监测指标" reason="设备未创建绑定，或绑定指标未启用" next="前往绑定总览" onNext={() => navigate('/binding-overview')} /> }}
                  />
                  {realtime.healthStatus === '数据中断' && (
                    <div style={{ fontSize: 12, color: '#8a97a3', marginTop: 8 }}>
                      注：数据中断期间指标值显示 --（无数据 ≠ 0），最后样本时间 {health.lastSampleAt || '--'}。
                    </div>
                  )}
                </Card>
              </>
            ),
          },
          {
            key: 'trend', label: '状态与趋势', children: (
              <>
                <Alert
                  className="rule-alert" type="info" showIcon style={{ marginBottom: 12 }}
                  message={`趋势为演示快照确定性序列（快照时间 ${meta.updatedAt || '--'}）；无趋势序列的指标不绘制曲线。`}
                />
                {trendEntries.length === 0 ? (
                  <Card size="small">
                    <EmptyState
                      description="该设备暂无可展示的趋势序列"
                      reason={realtime.healthStatus === '数据中断' ? '设备数据中断，无有效样本序列' : '演示快照未包含该设备的趋势数据'}
                    />
                  </Card>
                ) : (
                  <div className="trend-facet">
                    <Card
                      size="small"
                      title={`趋势 · ${currentTrend.metricCode}`}
                      extra={(
                        <Space>
                          {trendEntries.map(t => (
                            <Button key={t.key} size="small" type={t.key === currentTrend.key ? 'primary' : 'default'} onClick={() => setTrendKey(t.key)}>
                              {t.metricCode}
                            </Button>
                          ))}
                        </Space>
                      )}
                    >
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={currentTrend.values.map((v, i) => ({ i: `t${i + 1}`, v }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e8ea" />
                          <XAxis dataKey="i" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                          <Tooltip />
                          <Line type="linear" dataKey="v" stroke="#0e5a74" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                    <Card size="small" title="数据质量标记">
                      <div className="quality-marks">
                        <span className="quality-mark">正常</span>
                        <span className="quality-mark warn">延迟</span>
                        <span className="quality-mark warn">补传</span>
                        <span className="quality-mark danger">缺失</span>
                      </div>
                    </Card>
                  </div>
                )}
              </>
            ),
          },
          {
            key: 'alarm', label: `报警事件（${activeAlarms.length}）`, children: (
              <Card size="small" title="该设备活动报警">
                <Table
                  rowKey="id" size="small" pagination={false}
                  locale={{ emptyText: <EmptyState description="该设备暂无活动报警" reason="已关闭的报警不在本列表展示，可在报警中心查看全部事件" next="前往报警中心" onNext={() => navigate('/alarm-center')} nextLabel="前往报警中心" /> }}
                  dataSource={activeAlarms}
                  columns={[
                    { title: '报警ID', dataIndex: 'id', width: 150 },
                    { title: '报警名称', dataIndex: 'name' },
                    { title: '级别', dataIndex: 'severity', width: 80, render: v => <StatusTag value={v} /> },
                    { title: '状态', dataIndex: 'status', width: 110, render: v => <StatusTag value={v} /> },
                    { title: '触发值', dataIndex: 'trigger', width: 120 },
                    { title: '阈值', dataIndex: 'threshold', ellipsis: true },
                    { title: '触发时间', dataIndex: 'time', width: 90 },
                    {
                      title: '操作', width: 80,
                      render: () => <Button type="link" size="small" onClick={() => navigate('/alarm-center')}>去处理</Button>,
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'repair', label: `维修单（${repair.orders.length}）`, children: (
              <Card size="small" title="该设备维修工单">
                <Table
                  rowKey="repairOrderId" size="small" pagination={false}
                  locale={{ emptyText: <EmptyState description="该设备暂无维修工单" reason="报修或报警转维修后会生成主工单" next="前往维修任务" onNext={() => navigate('/repair-orders')} nextLabel="前往维修任务" /> }}
                  dataSource={repair.orders}
                  columns={[
                    { title: '工单号', dataIndex: 'repairOrderId', width: 160 },
                    { title: '标题', dataIndex: 'title', ellipsis: true },
                    { title: '状态', dataIndex: 'status', width: 90, render: v => <StatusTag value={v} /> },
                    { title: '维修人', dataIndex: 'assignee', width: 90, render: v => v || '--' },
                    { title: '创建时间', dataIndex: 'createdAt', width: 150 },
                    {
                      title: '操作', width: 80,
                      render: (_, r) => <Button type="link" size="small" onClick={() => navigate(`/repair-orders/${r.repairOrderId}`)}>详情</Button>,
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'downtime', label: `停机记录（${downtime.length}）`, children: (
              <Card size="small" title="该设备停机事实">
                <Table
                  rowKey="downtimeId" size="small" pagination={false}
                  locale={{ emptyText: <EmptyState description="该设备暂无停机事实" reason="维修开工、报警联动或人工登记会产生停机事实" /> }}
                  dataSource={downtime}
                  columns={[
                    { title: '停机ID', dataIndex: 'downtimeId', width: 160 },
                    { title: '类别', dataIndex: 'category', width: 100 },
                    { title: '开始', dataIndex: 'start', width: 160 },
                    { title: '结束', dataIndex: 'end', width: 160, render: v => v || '--' },
                    { title: '时长(分钟)', dataIndex: 'minutes', width: 100, render: v => (v ?? '--') },
                    { title: '状态', dataIndex: 'status', width: 90, render: v => <StatusTag value={v} /> },
                    { title: '原因', dataIndex: 'reason', ellipsis: true, render: v => v || '--' },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
    </>
  );
}
