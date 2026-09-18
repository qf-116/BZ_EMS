import React, { useMemo } from 'react';
import { Card, Table, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { patrolStandards, patrolPlanDevices } from '../data/standardData.js';

// 巡检标准（范围外演示模块）：数据只读来自 standardData.js 种子快照。
// 巡检线路 = 标准名称去掉「巡检标准」后缀；巡检项目数 = 该线路下巡检线路设备快照的巡检项目数合计。
// 行点击进入 /patrol-standards/detail?id=标准编号。
export default function PatrolStandardsPage() {
  const navigate = useNavigate();
  const state = useDemoState();
  const meta = state.meta;

  const rows = useMemo(() => patrolStandards.map((s) => {
    const lineDevices = patrolPlanDevices.filter(d => d.standard === s.name);
    return {
      ...s,
      line: (s.name || '').replace(/巡检标准$/, ''),
      deviceCount: lineDevices.length,
      itemCount: lineDevices.reduce((a, d) => a + (d.itemCount || 0), 0),
    };
  }), []);

  const columns = [
    { title: '标准编号', dataIndex: 'code', width: 180, fixed: 'left' },
    { title: '标准名称', dataIndex: 'name', width: 180 },
    { title: '巡检线路', dataIndex: 'line', width: 140, render: v => v || '--' },
    {
      title: '设备数', dataIndex: 'devices', width: 90, align: 'center',
      render: (v, r) => <span>档案 {v ?? '--'} 台 / 线路快照 {r.deviceCount} 台</span>,
    },
    {
      title: '项目数', dataIndex: 'itemCount', width: 110, align: 'center',
      render: v => (v > 0 ? `${v} 项` : '--'),
    },
    { title: '状态', dataIndex: 'status', width: 90, render: v => <StatusTag value={v} /> },
    { title: '备注', dataIndex: 'remark', ellipsis: true, render: v => v || '--' },
    { title: '更新时间', dataIndex: 'updateTime', width: 160, render: v => v || '--' },
    {
      title: '操作', width: 80, fixed: 'right',
      render: (_, r) => (
        <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/patrol-standards/detail?id=${encodeURIComponent(r.code)}`); }}>详情</Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="巡检标准"
        subtitle="巡检标准档案（标准即巡检线路的检查依据）· 点击行进入标准详情查看线路设备与项目清单"
      />
      <DegradedBanner meta={meta} />
      <Card size="small">
        <Table
          rowKey="code" size="small" columns={columns} dataSource={rows} scroll={{ x: 1200 }}
          onRow={(r) => ({ onClick: () => navigate(`/patrol-standards/detail?id=${encodeURIComponent(r.code)}`), style: { cursor: 'pointer' } })}
          locale={{ emptyText: <EmptyState description="暂无巡检标准" reason="暂无巡检标准数据" /> }}
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
        />
      </Card>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, color: '#8a97a3', fontSize: 12 }}>
        <ArrowRight size={12} /> 巡检线路设备与项目关联在标准详情页展示
      </div>
    </>
  );
}
