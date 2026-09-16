import React, { useState } from 'react';
import { Card, Descriptions, Table, Button, Space, Radio, Input, InputNumber, Select, Modal, Alert, Tag, App } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataSourceBadge from '../components/DataSourceBadge.jsx';
import DegradedBanner from '../components/DegradedBanner.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { inspectionTasks, inspectionTaskDetails, inspectionExecItems } from '../data/standardData.js';
import { crosswalkByAssetCode } from '../data/demo/deviceCrosswalk.js';

const canonOf = (assetCode) => crosswalkByAssetCode[assetCode] || null;

// 执行点检页（范围外演示模块）：/inspection-tasks/execute（query 兼容 id/code）。
// 逐项填写：结果（正常/异常）+ 数值/文本 + 备注；提交前需签名（姓名输入）。
// 执行状态用页面 useState（UI 局部状态，允许）；提交后本地确认弹窗提示演示口径，
// 不写入 DemoStore / 不产生跨模块动作，完整闭环由点巡保养业务模块承接。
export default function InspectionExecutePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { message } = App.useApp();
  const state = useDemoState();
  const meta = state.meta;

  const codeOrId = params.get('code') || params.get('id');
  const task = codeOrId
    ? inspectionTasks.find(t => t.code === codeOrId || t.code === decodeURIComponent(codeOrId))
    : null;

  const devices = inspectionTaskDetails.filter(d => !d.skipReason);
  const [deviceCode, setDeviceCode] = useState(devices[0]?.code || null);

  // 局部执行状态：{ [itemCode]: { result, value, remark } }；签名；提交后的本地确认结果
  const [results, setResults] = useState({});
  const [signName, setSignName] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [summary, setSummary] = useState(null); // { device, normal, abnormal, items, signName }

  if (!codeOrId || !task) {
    return (
      <>
        <PageHeader title="执行点检" subtitle={codeOrId ? `任务：${codeOrId}` : '未指定点检任务'}
          actions={<Space><DataSourceBadge meta={meta} /><Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/inspection-tasks')}>返回列表</Button></Space>} />
        <DegradedBanner meta={meta} />
        <Card size="small">
          <EmptyState
            description={`未找到点检任务${codeOrId ? `「${codeOrId}」` : ''}`}
            reason="单号无效或演示快照中不存在该任务"
            next
            onNext={() => navigate('/inspection-tasks')}
            nextLabel="返回点检任务列表"
          />
        </Card>
      </>
    );
  }

  const currentDevice = devices.find(d => d.code === deviceCode) || null;
  const canon = currentDevice ? canonOf(currentDevice.code) : null;

  const setItem = (code, patch) => {
    setResults(prev => ({ ...prev, [code]: { ...prev[code], ...patch } }));
  };

  const filled = inspectionExecItems.filter(i => results[i.code]?.result);
  const abnormalCount = filled.filter(i => results[i.code].result === '异常').length;
  const allFilled = filled.length === inspectionExecItems.length;

  const trySubmit = () => {
    if (!allFilled) { message.warning('请逐项填写点检结果（正常/异常）后再提交'); return; }
    if (!signName.trim()) { message.warning('提交前请填写签名（姓名）'); return; }
    setConfirmOpen(true);
  };

  const doConfirm = () => {
    setSummary({
      device: canon ? `${canon.name}（${canon.assetCode}）` : (deviceCode || '--'),
      normal: filled.length - abnormalCount,
      abnormal: abnormalCount,
      items: filled.length,
      signName: signName.trim(),
    });
    setConfirmOpen(false);
    message.success('演示模式：执行结果仅在当前页面生效（UI 局部状态）');
  };

  return (
    <>
      <PageHeader
        title="执行点检"
        subtitle={`任务：${task.code} · ${task.plan} · 点检日期：${task.date} · 演示快照（${meta.demoDay}）· 执行结果仅本地生效，完整闭环由点巡保养业务模块承接`}
        actions={<Space><DataSourceBadge meta={meta} /><Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/inspection-tasks')}>返回列表</Button></Space>}
      />
      <DegradedBanner meta={meta} />

      <Alert
        type="info" showIcon style={{ marginBottom: 12 }}
        message="演示模式说明"
        description="本页为范围外演示模块：执行结果保存在页面局部状态（useState）中，仅当前页面生效；刷新后恢复演示快照。真实环境的执行提交、异常项报修与闭环由点巡保养业务模块承接。"
      />

      <Card size="small" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>任务信息</div>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="任务编号">{task.code}</Descriptions.Item>
          <Descriptions.Item label="所属计划">{task.plan || '--'}</Descriptions.Item>
          <Descriptions.Item label="点检日期">{task.date || '--'}</Descriptions.Item>
          <Descriptions.Item label="执行人">{task.owner || '--'}</Descriptions.Item>
          <Descriptions.Item label="执行设备">
            <Select
              style={{ width: 280 }}
              value={deviceCode}
              onChange={setDeviceCode}
              options={devices.map(d => {
                const c = canonOf(d.code);
                return { value: d.code, label: c ? `${c.name}（${c.assetCode}）` : d.code };
              })}
            />
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <StatusTag value={({ 未开始: '待执行', 进行中: '进行中', 已完成: '已完成', 已关闭: '已关闭' }[task.status] || task.status)} tip={`种子状态：${task.status}`} />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          点检项目（{inspectionExecItems.length} 项）
          {canon && <span style={{ fontWeight: 400, fontSize: 13, color: '#8a97a3', marginLeft: 8 }}>执行设备：{canon.name}（{canon.assetCode}）</span>}
        </div>
        <div style={{ fontSize: 12, color: '#8a97a3', marginBottom: 12 }}>项目清单为演示快照（inspectionExecItems）；单选选项按项目定义，数值项请对照正常基准填写实测值。</div>
        <Table
          rowKey="code" size="small" pagination={false}
          dataSource={inspectionExecItems}
          columns={[
            { title: '项目', width: 240, render: (_, r) => (
              <div>
                <div style={{ fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: '#8a97a3' }}>{r.code} · {r.type}</div>
              </div>
            ) },
            { title: '检查内容', dataIndex: 'content', ellipsis: true, render: (v, r) => (
              <div>
                <div>{v || '--'}</div>
                {r.normalValue ? <div style={{ fontSize: 12, color: '#8a97a3' }}>正常基准：{r.normalValue}</div> : null}
              </div>
            ) },
            { title: '结果', width: 150, render: (_, r) => (
              <Radio.Group
                value={results[r.code]?.result}
                onChange={(e) => setItem(r.code, { result: e.target.value })}
                options={['正常', '异常'].map(v => ({ value: v, label: v }))}
              />
            ) },
            {
              title: '数值 / 记录', width: 200,
              render: (_, r) => (r.resultType === '数值'
                ? <InputNumber style={{ width: 160 }} placeholder="实测值" value={results[r.code]?.value} onChange={v => setItem(r.code, { value: v })} />
                : r.resultType === '文本'
                  ? <Input style={{ width: 180 }} placeholder="检查结果描述" maxLength={100} value={results[r.code]?.value} onChange={e => setItem(r.code, { value: e.target.value })} />
                  : <span style={{ fontSize: 12, color: '#8a97a3' }}>{r.options ? `选项：${r.options}` : '--'}</span>),
            },
            { title: '备注', width: 220, render: (_, r) => (
              <Input.TextArea rows={1} placeholder="备注（可选）" maxLength={100}
                value={results[r.code]?.remark} onChange={e => setItem(r.code, { remark: e.target.value })} />
            ) },
          ]}
        />
      </Card>

      <Card size="small" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>签名确认</div>
        <Space wrap size={16} align="center">
          <span>签名（姓名）：</span>
          <Input style={{ width: 220 }} placeholder="请输入执行人姓名" maxLength={20} value={signName} onChange={e => setSignName(e.target.value)} />
          <Tag color={allFilled ? 'success' : 'warning'}>已填结果 {filled.length}/{inspectionExecItems.length} · 异常 {abnormalCount}</Tag>
          <Button type="primary" onClick={trySubmit}>提交执行结果</Button>
        </Space>
      </Card>

      {summary && (
        <Card size="small">
          <Alert
            type="success" showIcon
            message="执行结果已记录（仅当前页面生效）"
            description={`设备：${summary.device} · 共 ${summary.items} 项：正常 ${summary.normal} 项 / 异常 ${summary.abnormal} 项 · 签名：${summary.signName} · 本结果保存在页面局部状态，不写入演示快照；完整闭环由点巡保养业务模块承接。`}
          />
        </Card>
      )}

      <Modal
        title="确认提交执行结果"
        open={confirmOpen}
        onOk={doConfirm}
        onCancel={() => setConfirmOpen(false)}
        okText="确认提交"
        cancelText="返回修改"
      >
        <Alert
          type="warning" showIcon
          message="演示模式：执行结果仅在当前页面生效，完整闭环由点巡保养业务模块承接"
          description={`本次提交：${canon ? `${canon.name}（${canon.assetCode}）` : deviceCode} · ${filled.length} 项（正常 ${filled.length - abnormalCount} / 异常 ${abnormalCount}）· 签名：${signName.trim()}。结果仅保存在页面局部状态，刷新后恢复演示快照。`}
        />
      </Modal>
    </>
  );
}
