import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Select, App, Modal, Form, Input, InputNumber, Tooltip } from 'antd';
import { Plus, AppWindow, Edit3, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { ruleTemplates, notificationRows } from '../data/demoData.js';
import { netBindings } from '../data/standardData.js';

// 报警规则模板管理：同型设备指标特征一致，模板 = 除「设备绑定」外的全部规则要素预设。
// 应用方式：① 新增规则时「从模板导入」；② 本页「应用到设备」批量生成规则草稿；③ 规则编辑时「保存为模板」。
// 模板更新不回写已发布规则——规则发布是不可变版本快照，模板仅作为生成时的初始值。
const MODE_LABEL = { upper: '越上限', lower: '越下限', rangeOut: '区间外', rangeIn: '区间内', state: '枚举判定' };
const unitOf = (metricType) => (metricType.includes('压力') ? 'MPa' : metricType.includes('振动') ? 'mm/s' : metricType.includes('温度') ? '℃' : metricType.includes('电流') ? 'A' : '');

const conditionOf = (t) => {
  const u = unitOf(t.metricType);
  if (t.mode === 'state') return '枚举判定 · 立即触发';
  if (t.mode === 'rangeOut') return `区间外 ${t.low} ~ ${t.high}${u} 持续 ${t.duration}s`;
  return `${t.mode === 'upper' ? '>' : '<'} ${t.threshold}${u} 持续 ${t.duration}s`;
};
const recoveryOf = (t) => (t.mode === 'state'
  ? '状态恢复即恢复'
  : t.mode === 'rangeOut' || t.mode === 'rangeIn'
    ? `恢复区间 = [下限 +${t.deadband}, 上限 −${t.deadband}]（回差）持续 30s`
    : `恢复阈值 = 触发阈值 ${t.mode === 'lower' ? '+' : '−'} ${t.deadband}（回差）持续 30s`);

export default function RuleTemplatePage() {
  const { message, modal } = App.useApp();
  const [rows, setRows] = useState(ruleTemplates);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [applyRow, setApplyRow] = useState(null);
  const [applyDevices, setApplyDevices] = useState([]);
  const [form] = Form.useForm();

  const openModal = (record) => { setEditing(record || null); form.resetFields(); setOpen(true); };

  const deviceOptions = netBindings.filter(b => b.configStatus === '已启用').map(b => ({ value: b.code, label: `${b.code} ${b.deviceName}` }));

  const handleSubmit = async () => {
    const v = await form.validateFields();
    if (editing) {
      setRows(list => list.map(r => (r.code === editing.code ? { ...r, ...v } : r)));
      message.success('模板已更新');
    } else {
      setRows(list => [{ code: `RT-${Date.now().toString().slice(-6)}`, refs: 0, status: '启用', ...v }, ...list]);
      message.success('模板已创建，可在新增报警规则时从模板导入');
    }
    setOpen(false);
  };

  const confirmDelete = (r) => modal.confirm({
    title: '删除规则模板',
    content: r.refs > 0
      ? `模板「${r.name}」已被 ${r.refs} 条规则引用。删除模板不影响已发布规则（规则为不可变版本快照），但后续无法再从该模板导入，确定删除吗？`
      : `确定删除模板「${r.name}」吗？删除后不可恢复。`,
    okText: '删除', okButtonProps: { danger: true }, cancelText: '取消',
    onOk: () => { setRows(list => list.filter(x => x.code !== r.code)); message.success('已删除模板'); },
  });

  const submitApply = () => {
    if (!applyDevices.length) { message.warning('请选择要应用的设备'); return; }
    const names = applyDevices.map(c => netBindings.find(b => b.code === c)?.deviceName || c).join('、');
    setApplyRow(null);
    setApplyDevices([]);
    message.success(`已按模板「${applyRow.name}」为 ${names} 生成 ${applyDevices.length} 条规则草稿，请到「报警规则配置」逐条确认并发布`);
  };

  const columns = [
    { title: '模板编号', dataIndex: 'code', width: 110 },
    { title: '模板名称', dataIndex: 'name', width: 190 },
    { title: '适用指标', dataIndex: 'metricType', width: 220 },
    { title: '规则类型', dataIndex: 'ruleType', width: 90, render: v => <Tag color="blue">{v}</Tag> },
    { title: '触发条件', width: 200, render: (_, r) => conditionOf(r) },
    { title: '恢复条件（迟滞）', width: 240, render: (_, r) => recoveryOf(r) },
    { title: '重复提醒', dataIndex: 'remind', width: 90, render: v => `${v} 分钟/次` },
    { title: '风暴限流', dataIndex: 'storm', width: 90, render: v => `≤ ${v} 条/小时` },
    { title: '通知策略', dataIndex: 'policy', width: 120 },
    { title: '引用规则数', dataIndex: 'refs', width: 100, render: v => (v > 0 ? <Tooltip title={`已按该模板生成 ${v} 条规则；模板更新不回写已发布规则`}>{v} 条</Tooltip> : '--') },
    { title: '状态', dataIndex: 'status', width: 80, render: v => <Tag color={v === '启用' ? 'success' : 'default'}>{v}</Tag> },
    { title: '备注', dataIndex: 'remark', minWidth: 200 },
    { title: '操作', fixed: 'right', width: 220, render: (_, r) => (
      <Space size={0}>
        <Button type="link" size="small" icon={<AppWindow size={12} />} onClick={() => { setApplyRow(r); setApplyDevices([]); }}>应用到设备</Button>
        <Button type="link" size="small" icon={<Edit3 size={12} />} onClick={() => openModal(r)}>编辑</Button>
        <Button type="link" size="small" danger icon={<Trash2 size={12} />} onClick={() => confirmDelete(r)}>删除</Button>
      </Space>
    ) },
  ];

  return (
    <>
      <PageHeader
        title="报警规则模板"
        subtitle="同型设备指标特征一致 · 模板 = 除设备绑定外的全部规则要素 · 应用 = 选模板 + 选设备 + 选指标 · 模板更新不回写已发布规则"
        actions={<Button type="primary" icon={<Plus size={14} />} onClick={() => openModal(null)}>新增模板</Button>}
      />
      <Card size="small">
        <Table
          rowKey="code" size="small" scroll={{ x: 2100 }}
          dataSource={rows}
          columns={columns}
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
        />
      </Card>

      {/* 新增 / 编辑模板（弹窗） */}
      <Modal
        title={editing ? `编辑模板（${editing.code}）` : '新增规则模板'}
        width={640}
        open={open}
        onOk={handleSubmit}
        onCancel={() => setOpen(false)}
        okText="保存" cancelText="取消"
        destroyOnHidden
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
        <Form form={form} layout="vertical" initialValues={editing ? {
          name: editing.name, metricType: editing.metricType, ruleType: editing.ruleType, mode: editing.mode,
          threshold: editing.threshold, low: editing.low, high: editing.high, duration: editing.duration,
          deadband: editing.deadband, remind: editing.remind, storm: editing.storm, policy: editing.policy, remark: editing.remark,
        } : { ruleType: '阈值', mode: 'upper', duration: 60, deadband: 5, remind: 5, storm: 3, policy: 'NP-IMPORTANT' }}>
          <Form.Item label="模板名称" name="name" rules={[{ required: true, message: '请输入模板名称' }]}>
            <Input placeholder="如：温度类越上限通用模板" />
          </Form.Item>
          <Form.Item label="适用指标" name="metricType" rules={[{ required: true, message: '请输入适用指标类型' }]}>
            <Input placeholder="如：温度类指标（主轴/冷却液/轴承温度）" />
          </Form.Item>
          <Space wrap>
            <Form.Item label="规则类型" name="ruleType" rules={[{ required: true }]}>
              <Select style={{ width: 120 }} options={['阈值', '状态'].map(v => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(a, b) => a.ruleType !== b.ruleType}>
              {({ getFieldValue }) => getFieldValue('ruleType') === '状态' ? (
                <Form.Item label="判定模式" name="mode" initialValue="state">
                  <Select style={{ width: 140 }} disabled options={[{ value: 'state', label: '枚举判定' }]} />
                </Form.Item>
              ) : (
                <Form.Item label="判定模式" name="mode" rules={[{ required: true }]}>
                  <Select style={{ width: 200 }} options={[
                    { value: 'upper', label: '越上限' }, { value: 'lower', label: '越下限' },
                    { value: 'rangeOut', label: '区间外' }, { value: 'rangeIn', label: '区间内' },
                  ]} />
                </Form.Item>
              )}
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(a, b) => a.mode !== b.mode}>
              {({ getFieldValue }) => {
                const mode = getFieldValue('mode');
                if (mode === 'state') return null;
                if (mode === 'rangeOut' || mode === 'rangeIn') return (
                  <Space wrap>
                    <Form.Item label="正常区间下限" name="low" rules={[{ required: true, message: '必填' }]}><InputNumber step={0.1} /></Form.Item>
                    <Form.Item label="上限" name="high" rules={[{ required: true, message: '必填' }]}><InputNumber step={0.1} /></Form.Item>
                  </Space>
                );
                return <Form.Item label="触发阈值" name="threshold" rules={[{ required: true, message: '必填' }]}><InputNumber /></Form.Item>;
              }}
            </Form.Item>
            <Form.Item label="持续（秒）" name="duration" rules={[{ required: true }]}><InputNumber min={0} /></Form.Item>
            <Form.Item noStyle shouldUpdate={(a, b) => a.mode !== b.mode}>
              {({ getFieldValue }) => getFieldValue('mode') === 'state' ? null : (
                <Form.Item label="回差" name="deadband" rules={[{ required: true }]}><InputNumber min={0} step={0.01} /></Form.Item>
              )}
            </Form.Item>
          </Space>
          <Space wrap>
            <Form.Item label="重复提醒间隔（分钟）" name="remind" rules={[{ required: true }]}><InputNumber min={1} /></Form.Item>
            <Form.Item label="风暴限流（条/小时）" name="storm" rules={[{ required: true }]}><InputNumber min={1} /></Form.Item>
            <Form.Item label="通知策略" name="policy" rules={[{ required: true, message: '请选择通知策略' }]}>
              <Select style={{ width: 240 }} options={notificationRows.map(n => ({ value: n.code, label: `${n.code} ${n.name}` }))} />
            </Form.Item>
          </Space>
          <Form.Item label="备注" name="remark"><Input.TextArea rows={2} placeholder="模板适用场景与参数依据，如：温度热惯性大，持续 60s 过滤加工载荷波动" /></Form.Item>
        </Form>
        </div>
      </Modal>

      {/* 应用到设备（弹窗）：批量生成规则草稿 */}
      <Modal
        title={`应用模板到设备（${applyRow?.name || ''}）`}
        width={560}
        open={!!applyRow}
        onOk={submitApply}
        onCancel={() => setApplyRow(null)}
        okText="生成规则草稿" cancelText="取消"
      >
        {applyRow && (
          <>
            <div style={{ fontSize: 12, color: '#5d6b78', lineHeight: 1.8, marginBottom: 8 }}>
              触发：{conditionOf(applyRow)} · 恢复：{recoveryOf(applyRow)} · 通知策略 {applyRow.policy}
            </div>
            <Select
              mode="multiple" placeholder="选择要应用的设备（可多选）" style={{ width: '100%' }}
              value={applyDevices} onChange={setApplyDevices} options={deviceOptions}
            />
            <div style={{ fontSize: 12, color: '#8a97a3', marginTop: 8, lineHeight: 1.7 }}>
              将为每台设备生成 1 条规则草稿：设备绑定按各自绑定关系自动匹配「{applyRow.metricType}」中已勾选指标；生成后为草稿状态，需逐条确认参数（个别设备可微调）后发布。
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
