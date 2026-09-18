// ============================================================
// 通知策略：只读展示 DemoStore 通知域的策略快照
// （state.entities.notificationPoliciesById，来自 src/data/demo/alarms.js 装配）。
// 策略编辑由平台通知服务提供，本页面不提供新增 / 编辑 / 停用等操作。
// ============================================================

import React from 'react';
import { Alert, Card, Table } from 'antd';
import PageHeader from '../components/PageHeader.jsx';
import ResultTag from '../components/ResultTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';

export default function NotificationPolicyPage() {
  const state = useDemoState();
  const rows = Object.values(state.entities.notificationPoliciesById);

  return (
    <>
      <PageHeader
        title="通知策略配置"
        subtitle="只读展示 · 站内通知必选 · 外部渠道不可作为唯一通知方式 · 策略编辑由平台通知服务提供"
      />
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="通知策略由平台通知服务统一管理"
        description="本页面仅展示当前生效的通知策略快照（只读）；策略的新增、编辑、停用与测试发送由平台通知服务提供，不在本系统内操作。报警触发时按级别命中策略并记录送达结果（见报警详情的通知送达记录）。"
      />
      <Card size="small">
        <Table
          rowKey="code"
          size="small"
          scroll={{ x: 1560 }}
          dataSource={rows}
          locale={{ emptyText: <EmptyState description="暂无通知策略" reason="暂无数据" /> }}
          columns={[
            { title: '策略编号', dataIndex: 'code', width: 110, render: v => v || '--' },
            { title: '策略名称', dataIndex: 'name', width: 160, render: v => v || '--' },
            { title: '适用等级', dataIndex: 'level', width: 90, render: v => <ResultTag value={v} /> },
            { title: '渠道', dataIndex: 'channels', width: 180, render: v => v || '--' },
            { title: '通知组', dataIndex: 'groups', width: 190, render: v => v || '--' },
            { title: '接收人', dataIndex: 'receivers', width: 140, render: v => v || '--' },
            { title: '首次通知', dataIndex: 'first', width: 90, render: v => v || '--' },
            { title: '重复间隔', dataIndex: 'interval', width: 100, render: v => v || '--' },
            { title: '升级节点', dataIndex: 'escalation', width: 130, render: v => v || '--' },
            { title: '静默时段', dataIndex: 'silent', width: 120, render: v => v || '--' },
            { title: '最大重试', dataIndex: 'retries', width: 80, render: v => v ?? '--' },
            { title: '状态', dataIndex: 'status', width: 80, render: v => <ResultTag value={v} /> },
          ]}
          pagination={false}
        />
      </Card>
    </>
  );
}
