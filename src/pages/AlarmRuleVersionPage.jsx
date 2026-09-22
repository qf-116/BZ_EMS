// ============================================================
// 报警规则版本：只读展示 DemoStore 报警域的规则版本快照
// （state.entities.alarmRuleVersionsById，来自 src/data/demo/alarms.js 装配）。
// 版本不可修改；活动报警使用触发时的版本快照；提供同规则两个版本的只读比对。
// ============================================================

import React, { useMemo, useState } from 'react';
import { App, Button, Card, Empty, Modal, Space, Table, Tag } from 'antd';
import { Download, GitCompare } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';

// 参与比对的版本字段（均为快照只读字段）
const DIFF_FIELDS = [
  ['condition', '条件快照'],
  ['notify', '通知策略快照'],
  ['publish', '发布时间'],
  ['publisher', '发布人'],
  ['effective', '生效区间'],
  ['events', '关联事件数'],
  ['status', '状态'],
];

export default function AlarmRuleVersionPage() {
  const { message } = App.useApp();
  const state = useDemoState();
  const [compareCode, setCompareCode] = useState(null); // 比对的规则 code

  const rows = useMemo(() => Object.values(state.entities.alarmRuleVersionsById)
    .sort((a, b) => (a.code === b.code
      ? (a.version < b.version ? 1 : -1)
      : (a.code > b.code ? 1 : -1))), [state]);

  // 同一规则的版本按新→旧排序；取前两个版本做只读比对
  const compareVersions = compareCode
    ? rows.filter(r => r.code === compareCode)
    : [];
  const latest = compareVersions[0] || null;
  const previous = compareVersions[1] || null;

  const diffRows = latest ? DIFF_FIELDS.map(([key, label]) => {
    const nowVal = latest[key];
    const prevVal = previous ? previous[key] : null;
    const equal = previous ? String(nowVal ?? '--') === String(prevVal ?? '--') : null;
    return {
      item: label,
      now: nowVal ?? '--',
      prev: previous ? (prevVal ?? '--') : '--（无历史版本）',
      type: previous ? (equal ? '一致' : '修改') : '首版',
    };
  }) : [];

  const columns = [
    { title: '规则编号', dataIndex: 'code', width: 130 },
    { title: '规则名称', dataIndex: 'name', width: 170, render: v => v || '--' },
    { title: '版本', dataIndex: 'version', width: 70, render: (v, r) => <Tag color={r.status === '已归档' ? 'default' : 'processing'}>{v || '--'}</Tag> },
    { title: '发布时间', dataIndex: 'publish', width: 170, render: v => v || '--' },
    { title: '发布人', dataIndex: 'publisher', width: 90, render: v => v || '--' },
    { title: '生效区间', dataIndex: 'effective', width: 250, render: v => v || '--' },
    { title: '条件快照', dataIndex: 'condition', width: 300, render: v => v || '--' },
    { title: '通知策略快照', dataIndex: 'notify', width: 180, render: v => v || '--' },
    { title: '关联事件', dataIndex: 'events', width: 90, render: v => v ?? '--', sorter: (a, b) => (a.events || 0) - (b.events || 0) },
    { title: '状态', dataIndex: 'status', width: 90, render: v => <Tag color={v === '已归档' ? 'default' : 'success'}>{v || '--'}</Tag> },
    { title: '操作', fixed: 'right', width: 110, render: (_, r) => (
      <div className="list-actions">
        <a onClick={() => setCompareCode(r.code)}>查看</a>
        <a onClick={() => setCompareCode(r.code)}>比对</a>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader
        title="报警规则版本"
        subtitle="版本快照只读 · 不可修改 · 活动报警使用触发时版本快照 · 比对为只读展示"
      />
      <Card size="small">
        <Space wrap style={{ marginBottom: 12 }}>
          <Button icon={<Download size={14} />} onClick={() => message.success('规则版本快照导出任务已创建')}>导出</Button>
        </Space>
        <Table
          rowKey={r => `${r.code}|${r.version}`}
          size="small"
          scroll={{ x: 1670 }}
          dataSource={rows}
          columns={columns}
          locale={{ emptyText: <EmptyState description="暂无规则版本快照" reason="暂无数据" /> }}
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
        />
      </Card>

      {/* 规则版本比对（只读）：同规则最新版本 vs 上一版本 */}
      <Modal
        title={latest ? `规则版本比对（${latest.code} ${latest.name}）` : '规则版本比对'}
        width={680}
        open={!!latest}
        onCancel={() => setCompareCode(null)}
        footer={[
          <Button key="close" onClick={() => setCompareCode(null)}>关闭</Button>,
          <Button key="export" type="primary" icon={<GitCompare size={14} />} onClick={() => message.success('比对结果导出任务已创建')}>导出比对结果</Button>,
        ]}
      >
        {latest && (
          <>
            {compareVersions.length < 2 && (
              <div style={{ fontSize: 12, color: '#8a97a3', marginBottom: 8 }}>
                该规则当前只有 {latest.version} 一个版本，无历史版本可比对。
              </div>
            )}
            <Table
              size="small"
              pagination={false}
              dataSource={diffRows}
              rowKey="item"
              locale={{ emptyText: <Empty description="无比对数据" /> }}
              columns={[
                { title: '比对项', dataIndex: 'item', width: 130 },
                { title: `${latest.version}（当前）`, dataIndex: 'now', render: v => v ?? '--' },
                { title: previous ? `${previous.version}（历史）` : '历史版本', dataIndex: 'prev', render: v => v ?? '--' },
                { title: '差异类型', dataIndex: 'type', width: 90, render: v => (
                  <Tag color={v === '修改' ? 'warning' : v === '一致' ? 'success' : 'processing'}>{v || '--'}</Tag>
                ) },
              ]}
            />
          </>
        )}
      </Modal>
    </>
  );
}
