import React, { useMemo } from 'react';
import { Card, Table, Tag, Button, Space, Descriptions, Alert } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import DataSourceBadge from '../components/DataSourceBadge.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { selectDevice, selectBinding, selectHealth } from '../state/selectors.js';

// 设备联网配置（只读视图）：按设计方案硬规则，协议 / 网关 / IP / 端口 / 点表
// 由平台接入服务维护，本页不提供任何编辑能力，仅展示绑定事实。
// 绑定关系与指标选择的变更请到「绑定总览」。
export default function DeviceNetConfigPage() {
  const navigate = useNavigate();
  const state = useDemoState();
  const meta = state.meta;
  const { deviceId: deviceIdParam } = useParams();
  const [searchParams] = useSearchParams();

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

  const headerActions = (
    <Space>
      <DataSourceBadge meta={meta} />
      <Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/device-ledger')}>返回列表</Button>
    </Space>
  );

  if (!device) {
    const shown = deviceIdParam || searchParams.get('deviceId') || searchParams.get('code') || '未提供设备编号';
    return (
      <>
        <PageHeader title="联网配置" subtitle={`未找到设备：${shown}`} actions={headerActions} />
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

  if (!binding) {
    return (
      <>
        <PageHeader title={`联网配置 · ${device.name}（${device.assetCode}）`} subtitle="该设备尚未创建 IoT 绑定" actions={headerActions} />
        <Card size="small">
          <EmptyState
            description="该设备暂无绑定实例"
            reason="未绑定设备不参与运行监测、报警判定与 OEE 统计"
            next="前往绑定总览创建首个绑定"
            onNext={() => navigate('/binding-overview')}
            nextLabel="前往绑定总览"
          />
        </Card>
      </>
    );
  }

  const totalSelected = (binding.items || [])
    .reduce((s, i) => s + (i.enabled ? (i.metrics || []).filter(m => m.selected).length : 0), 0);

  return (
    <>
      <PageHeader
        title={`联网配置 · ${device.name}（${device.assetCode}）`}
        subtitle="只读视图：绑定与指标选择在「绑定总览」维护 · 接入参数由平台接入服务维护"
        actions={headerActions}
      />
      <Alert
        type="warning" showIcon style={{ marginBottom: 12 }}
        message="接入参数由平台接入服务维护，本页仅查看"
        description="协议 / 网关 / IP / 端口 / 点表等接入参数不在本系统内编辑；如需调整请联系平台接入服务，或在「绑定总览」维护绑定关系与指标选择。"
      />
      <DegradedBanner meta={meta} />

      <Card size="small" style={{ marginBottom: 12 }}>
        <Descriptions column={4} size="small" bordered>
          <Descriptions.Item label="绑定版本">v{binding.version}</Descriptions.Item>
          <Descriptions.Item label="配置状态"><StatusTag value={binding.configStatus} /></Descriptions.Item>
          <Descriptions.Item label="通信健康"><StatusTag value={health?.status || null} /></Descriptions.Item>
          <Descriptions.Item label="生效区间">{binding.effectiveFrom || '--'} 至 {binding.effectiveTo || '至今'}</Descriptions.Item>
          <Descriptions.Item label="拉取周期">{binding.pullCycleSec != null ? `${binding.pullCycleSec} 秒` : '--'}</Descriptions.Item>
          <Descriptions.Item label="最近拉取">{binding.lastPullTime || '--'}</Descriptions.Item>
          <Descriptions.Item label="拉取失败次数">{binding.pullFailCount ?? '--'}</Descriptions.Item>
          <Descriptions.Item label="待补偿样本">{binding.pendingCompensation ?? '--'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" style={{ marginBottom: 12 }} title="接入参数（平台维护 · 只读）">
        <Descriptions column={3} size="small" bordered>
          <Descriptions.Item label="协议">--</Descriptions.Item>
          <Descriptions.Item label="网关">--</Descriptions.Item>
          <Descriptions.Item label="IP">--</Descriptions.Item>
          <Descriptions.Item label="端口">--</Descriptions.Item>
          <Descriptions.Item label="点表">--</Descriptions.Item>
        </Descriptions>
        <div style={{ fontSize: 12, color: '#8a97a3', marginTop: 8 }}>
          上述参数由 IoT 平台接入服务维护，本系统不存储也不展示具体值（-- 表示由平台管理，非未配置）。
        </div>
      </Card>

      <Card size="small" title={`来源设备（主设备 + 子传感器 · 共 ${(binding.items || []).length} 个，已选指标 ${totalSelected} 项）`}>
        <Table
          rowKey="iotDeviceId" size="small" pagination={false}
          dataSource={binding.items || []}
          columns={[
            { title: '编码', dataIndex: 'iotDeviceCode', width: 140 },
            { title: '角色', width: 110, render: (_, r) => (r.role === 'main' ? <Tag color="blue">主设备</Tag> : <Tag color="cyan">{r.sensorType || '子传感器'}</Tag>) },
            { title: '启用', dataIndex: 'enabled', width: 90, render: v => <StatusTag value={v ? '已启用' : '已停用'} /> },
            {
              title: '已选指标', render: (_, r) => (
                <Space size={4} wrap>
                  {(r.metrics || []).filter(m => m.selected).map(m => (
                    <Tag key={m.metricCode}>{m.metricCode}{m.metricVersion ? ` · ${m.metricVersion}` : ''}</Tag>
                  ))}
                  {(r.metrics || []).filter(m => m.selected).length === 0 && <span style={{ color: '#8a97a3', fontSize: 12 }}>--</span>}
                </Space>
              ),
            },
          ]}
        />
        <div style={{ fontSize: 12, color: '#5d6b78', marginTop: 8 }}>
          来源设备编码全局唯一（排他校验由绑定保存流程执行）；指标选择变更请前往「绑定总览」。
        </div>
      </Card>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Space>
          <Button onClick={() => navigate('/binding-overview')}>前往绑定总览</Button>
          <Button onClick={() => navigate('/device-ledger')}>返回列表</Button>
        </Space>
      </div>
    </>
  );
}
