import React, { useMemo, useState } from 'react';
import {
  Card, Descriptions, Table, Button, Tag, Radio, Input, InputNumber,
  Modal, Alert, App, Typography, Statistic, Space,
} from 'antd';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataSourceBadge from '../components/DataSourceBadge.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import {
  maintenanceTasks,
  maintenanceExecItems,
} from '../data/standardData.js';
import { crosswalkByAssetCode } from '../data/demo/deviceCrosswalk.js';

const dash = (v) => (v === null || v === undefined || v === '' ? '--' : v);

const RESULT_OPTIONS = [
  { value: '已做', label: '已做' },
  { value: '异常', label: '异常' },
  { value: '跳过', label: '跳过' },
];
const resultColor = { 已做: 'success', 异常: 'error', 跳过: 'default' };

function parseAssetCode(deviceStr) {
  const m = String(deviceStr || '').match(/MT\d{4}A\d+/);
  return m ? m[0] : null;
}

// 保养执行页（范围外演示模块）：/maintenance-tasks/execute?code=（兼容 ?id=）。
// 逐项登记保养结果（已做 / 异常 / 跳过）+ 耗材登记 + 工时；执行状态用页面 useState，
// 不写 DemoStore / 不派发 action；提交确认弹窗注明「演示模式：完整闭环由点巡保养业务模块承接」。
export default function MaintenanceExecutePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { message } = App.useApp();
  const state = useDemoState();
  const meta = state.meta;

  const code = params.get('code') || params.get('id');
  const task = code ? maintenanceTasks.find(r => r.code === code) : null;

  // 页面本地执行状态（不落演示快照）
  const [results, setResults] = useState({});            // 项目编号 → 已做/异常/跳过
  const [consumable, setConsumable] = useState('');      // 耗材登记
  const [laborHours, setLaborHours] = useState(null);    // 工时（小时）
  const [remark, setRemark] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const assetCode = task ? parseAssetCode(task.device) : null;
  const cw = assetCode ? crosswalkByAssetCode[assetCode] : null;

  const doneCount = useMemo(
    () => maintenanceExecItems.filter(i => results[i.code] === '已做').length,
    [results],
  );
  const abnormalCount = useMemo(
    () => maintenanceExecItems.filter(i => results[i.code] === '异常').length,
    [results],
  );
  const skipCount = useMemo(
    () => maintenanceExecItems.filter(i => results[i.code] === '跳过').length,
    [results],
  );
  const allDecided = maintenanceExecItems.every(i => results[i.code]);

  if (!task) {
    return (
      <>
        <PageHeader
          title="执行保养任务"
          actions={<Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/maintenance-tasks')}>返回列表</Button>}
        />
        <Card size="small">
          <EmptyState
            description={`未找到保养任务${code ? `（${code}）` : ''}`}
            reason="任务编号无效或该任务不存在（不回退展示其他任务）"
            next
            onNext={() => navigate('/maintenance-tasks')}
            nextLabel="返回保养任务列表"
          />
        </Card>
      </>
    );
  }

  const doSubmit = () => {
    setSubmitted(true);
    setConfirmOpen(false);
    message.success(`保养任务 ${task.code} 执行结果已登记（页面内存演示，不写入演示快照）`);
  };

  return (
    <>
      <PageHeader
        title="执行保养任务"
        subtitle={`${task.code} · ${task.name} · 范围外演示模块（完整闭环由点巡保养业务模块承接）`}
        actions={<><DataSourceBadge meta={meta} /><Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/maintenance-tasks')}>返回列表</Button></>}
      />
      <DegradedBanner meta={meta} />
      <Alert
        type="warning" showIcon style={{ marginBottom: 12 }}
        message="演示模式：本页执行结果仅保存在页面内存，不写入演示快照；完整保养闭环由点巡保养业务模块承接。"
      />
      {submitted && (
        <Alert
          type="success" showIcon style={{ marginBottom: 12 }}
          message={`执行结果已登记：已做 ${doneCount} / 异常 ${abnormalCount} / 跳过 ${skipCount}（共 ${maintenanceExecItems.length} 项）`}
          description="演示登记完成。如需刷新恢复初始状态，可刷新页面或在工作台重置演示。"
        />
      )}

      <Card size="small" style={{ marginBottom: 12 }}>
        <Descriptions column={3} size="small" bordered>
          <Descriptions.Item label="任务编号">{task.code}</Descriptions.Item>
          <Descriptions.Item label="所属计划">{dash(task.plan)}</Descriptions.Item>
          <Descriptions.Item label="状态"><StatusTag value={task.status} /></Descriptions.Item>
          <Descriptions.Item label="保养设备">
            {cw ? `${cw.name}（${assetCode}）` : dash(task.device)}
            {cw ? <Tag style={{ marginLeft: 6 }}>{cw.deviceId}</Tag> : null}
          </Descriptions.Item>
          <Descriptions.Item label="所属部门">{dash(task.dept)}</Descriptions.Item>
          <Descriptions.Item label="计划时间">{dash(task.date)}</Descriptions.Item>
          <Descriptions.Item label="执行人">{dash(task.owner)}</Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>{dash(task.remark)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" title="逐项保养结果登记" style={{ marginBottom: 12 }} extra={
        <Space size={16}>
          <Statistic title="已做" value={doneCount} valueStyle={{ fontSize: 16, color: '#52c41a' }} />
          <Statistic title="异常" value={abnormalCount} valueStyle={{ fontSize: 16, color: '#ff4d4f' }} />
          <Statistic title="跳过" value={skipCount} valueStyle={{ fontSize: 16, color: '#8a97a3' }} />
        </Space>
      }>
        <Table
          rowKey="code" size="small" pagination={false}
          dataSource={maintenanceExecItems}
          locale={{
            emptyText: <EmptyState description="暂无保养项目" reason="种子数据未包含该任务的保养项目" />,
          }}
          columns={[
            { title: '项目编号', dataIndex: 'code', width: 160 },
            { title: '项目名称', dataIndex: 'name', width: 180 },
            { title: '保养部位', dataIndex: 'part', width: 100, render: v => dash(v) },
            { title: '保养级别', dataIndex: 'level', width: 90, render: v => <Tag>{dash(v)}</Tag> },
            { title: '保养要求', dataIndex: 'require', width: 280, render: v => dash(v) },
            {
              title: '保养结果', width: 220,
              render: (_, r) => (
                <Radio.Group
                  size="small"
                  options={RESULT_OPTIONS}
                  optionType="button"
                  buttonStyle="solid"
                  value={results[r.code] || null}
                  onChange={(e) => setResults(prev => ({ ...prev, [r.code]: e.target.value }))}
                />
              ),
            },
            {
              title: '结果标记', width: 90,
              render: (_, r) => (results[r.code]
                ? <Tag color={resultColor[results[r.code]]}>{results[r.code]}</Tag>
                : <Tag>待登记</Tag>),
            },
          ]}
        />
      </Card>

      <Card size="small" title="耗材与工时登记" style={{ marginBottom: 12 }}>
        <Space wrap size={24} align="start">
          <div>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>耗材登记</Typography.Text>
            <Input.TextArea
              rows={2} style={{ width: 360 }} maxLength={200} showCount
              placeholder="如：SKF LGMT2 润滑脂 200g ×1；导轨油 0.5L"
              value={consumable}
              onChange={e => setConsumable(e.target.value)}
              disabled={submitted}
            />
          </div>
          <div>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>工时（小时）</Typography.Text>
            <InputNumber
              min={0} step={0.5} style={{ width: 160 }}
              placeholder="如 1.5"
              value={laborHours}
              onChange={v => setLaborHours(v)}
              disabled={submitted}
            />
          </div>
          <div>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>执行备注</Typography.Text>
            <Input.TextArea
              rows={2} style={{ width: 360 }} maxLength={200} showCount
              placeholder="异常说明 / 跳过原因等"
              value={remark}
              onChange={e => setRemark(e.target.value)}
              disabled={submitted}
            />
          </div>
        </Space>
      </Card>

      <Card size="small">
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#8a97a3' }}>
            {allDecided ? '全部项目已登记结果，可提交。' : `尚有 ${maintenanceExecItems.filter(i => !results[i.code]).length} 项未登记结果（允许带未登记项提交，异常项建议填写备注）。`}
          </span>
          <Space>
            <Button onClick={() => navigate(`/maintenance-tasks/detail?code=${encodeURIComponent(task.code)}`)}>查看详情</Button>
            <Button
              type="primary"
              icon={<CheckCircle2 size={14} />}
              disabled={submitted}
              onClick={() => setConfirmOpen(true)}
            >
              提交执行结果
            </Button>
          </Space>
        </Space>
      </Card>

      <Modal
        title={`提交执行结果（${task.code}）`}
        width={560}
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onOk={doSubmit}
        okText="确认提交"
        cancelText="取消"
      >
        <Alert
          type="info" showIcon style={{ marginBottom: 12 }}
          message="演示模式：完整闭环由点巡保养业务模块承接"
          description="本页为保养模块演示：提交结果仅保存在页面内存（刷新后恢复），不写入演示快照、不联动计划完成率与工时台账。"
        />
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="保养结果">
            已做 {doneCount} / 异常 {abnormalCount} / 跳过 {skipCount}（共 {maintenanceExecItems.length} 项）
          </Descriptions.Item>
          <Descriptions.Item label="耗材登记">{dash(consumable)}</Descriptions.Item>
          <Descriptions.Item label="工时（小时）">{laborHours ?? '--'}</Descriptions.Item>
          <Descriptions.Item label="执行备注">{dash(remark)}</Descriptions.Item>
        </Descriptions>
      </Modal>
    </>
  );
}
