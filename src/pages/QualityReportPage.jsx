import React, { useMemo, useState } from 'react';
import { Alert, App, Button, Card, Collapse, Select, Space, Table, Tag } from 'antd';
import { Download, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import DataSourceBadge from '../components/DataSourceBadge.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import { useDemoState, useDemoActions } from '../state/DemoStore.jsx';
import { selectReportRows, selectExportTasks, selectAllDevices } from '../state/selectors.js';

const THEME = 'quality';

const fmt = v => (v === null || v === undefined || v === '' ? '--' : v);

// 数据质量统计报表：采样完整性与补传 / 重复统计
// 数据来源：selectReportRows(state, 'quality', filters)；空值统一显示 '--'
export default function QualityReportPage() {
  const { message } = App.useApp();
  const state = useDemoState();
  const actions = useDemoActions();
  const meta = state.meta;

  // UI 层筛选，不进入业务快照
  const [workshop, setWorkshop] = useState('all');
  const [device, setDevice] = useState('all');
  const [date, setDate] = useState('all');

  const devices = useMemo(() => selectAllDevices(state), [state]);
  const workshopOf = useMemo(
    () => Object.fromEntries(devices.map(d => [d.name, d.workshopName])),
    [devices],
  );
  const workshopOptions = useMemo(
    () => [...new Set(devices.map(d => d.workshopName).filter(Boolean))].map(w => ({ value: w, label: w })),
    [devices],
  );
  const deviceOptions = useMemo(() => devices.map(d => ({ value: d.name, label: d.name })), [devices]);

  const allThemeRows = useMemo(() => selectReportRows(state, THEME), [state]);
  const dateOptions = useMemo(
    () => [...new Set(allThemeRows.map(r => r.date).filter(Boolean))].map(d => ({ value: d, label: d })),
    [allThemeRows],
  );

  const rows = useMemo(() => {
    const base = selectReportRows(state, THEME, {
      device: device === 'all' ? '' : device,
      date: date === 'all' ? '' : date,
    });
    return workshop === 'all' ? base : base.filter(r => workshopOf[r.device] === workshop);
  }, [state, device, date, workshop, workshopOf]);

  const exportTasks = useMemo(
    () => selectExportTasks(state).filter(t => t.theme === THEME),
    [state],
  );

  const currentFilters = {
    device: device === 'all' ? '' : device,
    date: date === 'all' ? '' : date,
    workshop: workshop === 'all' ? '' : workshop,
  };
  const handleQuery = () => {
    const res = actions.runReport(THEME, currentFilters);
    res.ok ? message.success(res.message) : message.error(res.message);
  };
  const handleReset = () => { setWorkshop('all'); setDevice('all'); setDate('all'); };
  const handleExport = () => {
    const res = actions.createExportTask(THEME, currentFilters);
    res.ok ? message.success(res.message) : message.error(res.message);
  };
  const handleDownload = (task) => {
    message.info(`演示导出：任务 ${task.exportId} 为演示口径快照（口径截止 ${task.statsCutoff || '--'}），未生成真实文件`);
  };

  const columns = [
    { title: '日期', dataIndex: 'date', width: 110 },
    { title: '设备', dataIndex: 'device', width: 150 },
    { title: '车间', dataIndex: 'device', width: 110, render: v => workshopOf[v] || '--' },
    { title: '应采样', dataIndex: 'expected', width: 100, align: 'center', render: fmt },
    { title: '实收', dataIndex: 'received', width: 100, align: 'center', render: fmt },
    { title: '有效', dataIndex: 'valid', width: 100, align: 'center', render: fmt },
    { title: '缺失', dataIndex: 'missing', width: 90, align: 'center', render: v => (v == null ? '--' : v > 0 ? <Tag color="warning">{v}</Tag> : v) },
    { title: '延迟', dataIndex: 'delayed', width: 90, align: 'center', render: v => (v == null ? '--' : v > 0 ? <Tag color="warning">{v}</Tag> : v) },
    { title: '补传', dataIndex: 'backfill', width: 90, align: 'center', render: fmt },
    { title: '重复', dataIndex: 'duplicate', width: 90, align: 'center', render: fmt },
    {
      title: '完整率', dataIndex: 'rate', width: 100,
      render: v => (v == null || v === '' ? '--' : <Tag color={parseFloat(v) < 95 ? 'error' : 'success'}>{v}</Tag>),
    },
  ];

  return (
    <>
      <PageHeader
        title="数据质量统计报表"
        subtitle={`采样完整性 · 补传 / 重复统计 · 演示日 ${meta.demoDay || '--'} · 口径截止 ${meta.lastSampleAt || '--'}`}
        actions={<Button type="primary" icon={<Download size={14} />} onClick={handleExport}>导出</Button>}
      />
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <DataSourceBadge meta={meta} />
      </div>
      <DegradedBanner meta={meta} />
      <Collapse
        size="small"
        defaultActiveKey={['filters']}
        style={{ marginBottom: 12 }}
        items={[{
          key: 'filters',
          label: '筛选条件（组织 / 设备 / 日期，仅作用于本页查询）',
          children: (
            <Space wrap>
              <Select value={workshop} onChange={setWorkshop} style={{ width: 140 }} options={[{ value: 'all', label: '全部车间' }, ...workshopOptions]} />
              <Select value={device} onChange={setDevice} style={{ width: 170 }} showSearch optionFilterProp="label" options={[{ value: 'all', label: '全部设备' }, ...deviceOptions]} />
              <Select value={date} onChange={setDate} style={{ width: 140 }} options={[{ value: 'all', label: '全部日期' }, ...dateOptions]} />
              <Button type="primary" icon={<Search size={14} />} onClick={handleQuery}>查询</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          ),
        }]}
      />
      <Alert
        className="rule-alert"
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="完整率 = 有效采样 ÷ 应采样；缺失 / 延迟 / 补传 / 重复为接入链路质量明细；完整率低于 95% 标红提示；空值以 '--' 显示（无数据 ≠ 0）。"
      />
      {rows.length === 0 ? (
        <EmptyState
          description="当前筛选条件下无数据质量统计行"
          reason="演示快照仅包含部分日期与设备的采样质量样本，调整筛选或重置后重试"
          next="重置筛选"
          nextLabel="重置筛选"
          onNext={handleReset}
        />
      ) : (
        <Table rowKey={r => r.date + r.device} size="small" scroll={{ x: 1100 }} dataSource={rows} columns={columns} />
      )}
      {exportTasks.length > 0 && (
        <Card size="small" title="导出任务（异步任务，演示口径）" style={{ marginTop: 12 }}>
          <Table
            rowKey="exportId" size="small" pagination={false}
            dataSource={exportTasks}
            columns={[
              { title: '任务号', dataIndex: 'exportId', width: 180 },
              { title: '状态', dataIndex: 'status', width: 90, render: v => <StatusTag value={v} /> },
              { title: '创建时间', dataIndex: 'createdAt', width: 170 },
              { title: '口径截止', dataIndex: 'statsCutoff', width: 170, render: v => v || '--' },
              { title: '说明', dataIndex: 'note', ellipsis: true, render: v => v || '--' },
              { title: '操作', width: 80, render: (_, r) => <Button type="link" size="small" onClick={() => handleDownload(r)}>下载</Button> },
            ]}
          />
        </Card>
      )}
    </>
  );
}
