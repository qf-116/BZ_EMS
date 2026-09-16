import React, { useMemo, useState } from 'react';
import { Card, Table, Tabs, Button, Tooltip, Typography, Modal, Space, Tag } from 'antd';
import { Download } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DataSourceBadge from '../components/DataSourceBadge.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import {
  maintenanceTasks,
  maintenanceTaskDetails,
  ledgerDevices,
} from '../data/standardData.js';
import { crosswalkByAssetCode } from '../data/demo/deviceCrosswalk.js';

const dash = (v) => (v === null || v === undefined || v === '' ? '--' : v);

function parseAssetCode(deviceStr) {
  const m = String(deviceStr || '').match(/MT\d{4}A\d+/);
  return m ? m[0] : null;
}

const pct = (done, total) => (total > 0 ? `${Math.round((done / total) * 100)}%` : '--');

// 口径说明（种子推导，不伪造）：
// - 计划完成率 = 已完成任务数 / 任务总数（不含已关闭）
// - 异常率 = 任务明细未执行保养项目数 / 保养项目总数（仅设备维度有种子明细；执行人维度种子未提供 → --）
// - 工时合计 = 种子数据未包含工时字段 → 一律显示 --（0 与无数据严格区分）
const taskCount = (tasks, status) => tasks.filter(t => t.status === status).length;

// 保养执行统计报表（范围外演示模块）：按设备 / 执行人聚合只读种子 maintenanceTasks。
// 导出为演示占位，不生成真实文件。
export default function MaintenanceReportPage() {
  const state = useDemoState();
  const meta = state.meta;
  const [exportOpen, setExportOpen] = useState(false);

  const deviceRows = useMemo(() => {
    const byDevice = new Map();
    maintenanceTasks.forEach((t) => {
      const assetCode = parseAssetCode(t.device);
      const key = assetCode || t.device || '--';
      if (!byDevice.has(key)) byDevice.set(key, []);
      byDevice.get(key).push(t);
    });
    return [...byDevice.entries()].map(([assetCode, tasks]) => {
      const cw = crosswalkByAssetCode[assetCode];
      const ledger = ledgerDevices.find(d => d.code === assetCode);
      const detailRows = maintenanceTaskDetails.filter(d => d.code === assetCode);
      const itemTotal = detailRows.reduce((s, d) => {
        const n = typeof d.itemCount === 'string' ? parseInt(d.itemCount, 10) : d.itemCount;
        return s + (Number.isFinite(n) ? n : 0);
      }, 0);
      const unchecked = detailRows.reduce((s, d) => s + (d.unchecked || 0), 0);
      const total = tasks.length;
      const closed = taskCount(tasks, '已关闭');
      const done = taskCount(tasks, '已完成');
      return {
        key: assetCode,
        assetCode,
        deviceName: cw ? cw.name : assetCode,
        deviceId: cw ? cw.deviceId : null,
        dept: ledger?.dept || '--',
        total,
        done,
        closed,
        rate: pct(done, total - closed),
        abnormalRate: itemTotal > 0 ? pct(unchecked, itemTotal) : '--',
        abnormalTip: itemTotal > 0
          ? `未执行 ${unchecked} 项 / 共 ${itemTotal} 项（种子任务明细）`
          : '演示数据未提供该设备的保养项目明细',
        hours: '--',
      };
    }).sort((a, b) => b.total - a.total);
  }, []);

  const ownerRows = useMemo(() => {
    const byOwner = new Map();
    maintenanceTasks.forEach((t) => {
      const key = t.owner || '--';
      if (!byOwner.has(key)) byOwner.set(key, []);
      byOwner.get(key).push(t);
    });
    return [...byOwner.entries()].map(([owner, tasks]) => {
      const total = tasks.length;
      const closed = taskCount(tasks, '已关闭');
      const done = taskCount(tasks, '已完成');
      return {
        key: owner,
        owner,
        total,
        done,
        closed,
        rate: pct(done, total - closed),
        abnormalRate: '--',
        hours: '--',
      };
    }).sort((a, b) => b.total - a.total);
  }, []);

  const totals = useMemo(() => {
    const total = maintenanceTasks.length;
    const done = taskCount(maintenanceTasks, '已完成');
    const closed = taskCount(maintenanceTasks, '已关闭');
    return { total, done, closed, rate: pct(done, total - closed) };
  }, []);

  const deviceColumns = [
    { title: '设备编号', dataIndex: 'assetCode', width: 130 },
    {
      title: '设备名称（canonical）', dataIndex: 'deviceName', width: 200,
      render: (v, r) => (
        <span>{v}{r.deviceId ? <Tag style={{ marginLeft: 6 }}>{r.deviceId}</Tag> : null}</span>
      ),
    },
    { title: '所属部门', dataIndex: 'dept', width: 160, render: v => dash(v) },
    { title: '任务总数', dataIndex: 'total', width: 90 },
    { title: '已完成', dataIndex: 'done', width: 80 },
    { title: '已关闭', dataIndex: 'closed', width: 80 },
    {
      title: '计划完成率', dataIndex: 'rate', width: 100,
      render: (v) => <Typography.Text strong={v !== '--'}>{v}</Typography.Text>,
    },
    {
      title: '异常率', dataIndex: 'abnormalRate', width: 100,
      render: (v, r) => (v === '--' ? <Tooltip title={r.abnormalTip}>--</Tooltip> : <Tooltip title={r.abnormalTip}><Typography.Text type="warning">{v}</Typography.Text></Tooltip>),
    },
    {
      title: '工时合计（小时）', dataIndex: 'hours', width: 120,
      render: (v) => <Tooltip title="演示种子数据未包含工时字段，由点巡保养业务模块回填">--</Tooltip>,
    },
  ];

  const ownerColumns = [
    { title: '执行人', dataIndex: 'owner', width: 160 },
    { title: '任务总数', dataIndex: 'total', width: 90 },
    { title: '已完成', dataIndex: 'done', width: 80 },
    { title: '已关闭', dataIndex: 'closed', width: 80 },
    { title: '计划完成率', dataIndex: 'rate', width: 100, render: v => <Typography.Text strong={v !== '--'}>{v}</Typography.Text> },
    {
      title: '异常率', dataIndex: 'abnormalRate', width: 100,
      render: (v) => <Tooltip title="演示种子数据未提供执行人维度的保养项目明细，无法计算异常率">--</Tooltip>,
    },
    {
      title: '工时合计（小时）', dataIndex: 'hours', width: 120,
      render: (v) => <Tooltip title="演示种子数据未包含工时字段，由点巡保养业务模块回填">--</Tooltip>,
    },
  ];

  return (
    <>
      <PageHeader
        title="保养执行统计"
        subtitle={`按设备 / 执行人聚合保养任务（种子 ${maintenanceTasks.length} 条）：计划完成率 = 已完成 /（总数 − 已关闭）· 范围外演示模块（完整闭环由点巡保养业务模块承接）`}
        actions={<><DataSourceBadge meta={meta} /><Button icon={<Download size={14} />} onClick={() => setExportOpen(true)}>导出</Button></>}
      />
      <DegradedBanner meta={meta} />

      <Card size="small" style={{ marginBottom: 12 }}>
        <Space size={32} wrap>
          <Typography.Text>任务总数：<strong>{totals.total}</strong></Typography.Text>
          <Typography.Text>已完成：<strong>{totals.done}</strong></Typography.Text>
          <Typography.Text>已关闭：<strong>{totals.closed}</strong></Typography.Text>
          <Typography.Text>整体计划完成率：<strong>{totals.rate}</strong></Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            数据基准：{meta.updatedAt}（只读演示种子）
          </Typography.Text>
        </Space>
      </Card>

      <Card size="small">
        <Tabs
          defaultActiveKey="device"
          size="small"
          items={[
            {
              key: 'device',
              label: '按设备聚合',
              children: (
                <Table
                  rowKey="key" size="small"
                  dataSource={deviceRows}
                  columns={deviceColumns}
                  pagination={false}
                  locale={{ emptyText: <EmptyState description="暂无保养任务" reason="种子数据未包含保养任务" /> }}
                />
              ),
            },
            {
              key: 'owner',
              label: '按执行人聚合',
              children: (
                <Table
                  rowKey="key" size="small"
                  dataSource={ownerRows}
                  columns={ownerColumns}
                  pagination={false}
                  locale={{ emptyText: <EmptyState description="暂无保养任务" reason="种子数据未包含保养任务" /> }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="导出保养执行统计"
        width={480}
        open={exportOpen}
        onCancel={() => setExportOpen(false)}
        footer={<Button type="primary" onClick={() => setExportOpen(false)}>知道了</Button>}
      >
        <Space direction="vertical" size={8}>
          <StatusTag value="演示数据" tip="保养模块为范围外演示，导出为占位" />
          <Typography.Text>
            演示模式：完整闭环由点巡保养业务模块承接。导出功能为演示占位，不生成真实报表文件；
            正式导出（含工时台账与异常明细）由点巡保养业务模块提供。
          </Typography.Text>
        </Space>
      </Modal>
    </>
  );
}
