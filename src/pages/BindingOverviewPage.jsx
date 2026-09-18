// ============================================================
// 绑定总览（/binding-overview · 数据接入域核心交互页）
// 列表 8 台设备的绑定状态（crosswalk + bindingsByDeviceId + 绑定草稿）；
// 状态轴：未配置 → 草稿 → 校验 → 待生效 → 已启用 → 已停用/换绑中（domain/binding.js）。
// DEV-008 故意未配置，用于演示「首次绑定」全流程：
//   新建绑定（草稿走 store 的 bindingDraftsByDeviceId，页面不用 useState 存草稿）
//   → 勾选数据源并指定主/子角色（主设备唯一）与指标 → 校验（validateBindingDraft：恰好 1 个主设备 / 至少 1 项有效指标 / 绑定内编码不重复；
//     来源编码被其它设备占用仅提示不拦截）
//   → 保存（binding-{deviceId}-NN 新版本，状态「待生效」）→ 启用。
// 已启用设备可「停用」（填原因）；换绑说明见页尾文案。
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  App, Alert, Button, Card, Checkbox, Col, Input, Modal, Row, Select, Space, Statistic, Steps, Table, Tag, Tooltip, Typography,
} from 'antd';
import { Plus, ShieldCheck, Save, Play, PauseCircle, Settings2, LayoutTemplate, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatusTag from '../components/StatusTag.jsx';
import ApplyTemplateModal from '../components/ApplyTemplateModal.jsx';
import { useDemoState, useDemoActions } from '../state/DemoStore.jsx';
import { selectAllDevices, selectBindingDraft } from '../state/selectors.js';
import { validateBindingDraft } from '../domain/binding.js';

const metricTagColor = (m) => (m.syncStatus === '已失效' ? 'error' : 'default');

// ---------- 绑定草稿弹窗（两步向导：第 1 步选数据源并指定主/子角色 → 第 2 步选指标；草稿状态全部来自 store，不经页面 useState）
// 角色由本系统在绑定时指定（IoT 上报类型不作判定依据）：每绑定恰好 1 个主设备，子设备可多个；
// IoT 来源编码被其它设备占用仅提示、不限制绑定（domain/binding.js 校验同口径）。 ----------
function BindingDraftModal({ deviceId, deviceName, open, onClose }) {
  const state = useDemoState();
  const actions = useDemoActions();
  const { message } = App.useApp();
  const [step, setStep] = useState(0);                        // 向导步骤：0=选择数据源，1=选择指标
  const [validateResult, setValidateResult] = useState(null); // UI 局部状态：仅展示校验结果
  const [sourceKw, setSourceKw] = useState('');               // 来源列表搜索（设备多时缓解弹窗拥挤）
  const [tplNameOpen, setTplNameOpen] = useState(false);      // 存为模板：命名小弹窗
  const [tplName, setTplName] = useState('');

  const draft = selectBindingDraft(state, deviceId);
  const metrics = Object.values(state.entities.metricsByKey);
  const sourceDevicesAll = Object.values(state.entities.sourceDevicesById);
  const sourceDevices = useMemo(() => {
    const k = sourceKw.trim().toLowerCase();
    if (!k) return sourceDevicesAll;
    return sourceDevicesAll.filter((s) => `${s.iotDeviceCode} ${s.name}`.toLowerCase().includes(k));
  }, [sourceDevicesAll, sourceKw]);
  const currentVersion = state.entities.bindingsByDeviceId[deviceId]?.version || 0;

  // 每次打开重置向导进度（换设备时同样重置）
  useEffect(() => {
    if (open) { setStep(0); setValidateResult(null); setSourceKw(''); }
  }, [open, deviceId]);

  // 仅提示用：其它设备已启用绑定占用的 IoT 来源编码（不作为校验限制，允许重复绑定）
  const occupiedCodes = useMemo(() => {
    const set = new Set();
    Object.values(state.entities.bindingsByDeviceId).forEach((b) => {
      if (b.deviceId !== deviceId && b.configStatus === '已启用') {
        (b.items || []).forEach((i) => { if (i.enabled) set.add(i.iotDeviceCode); });
      }
    });
    return set;
  }, [state, deviceId]);

  const draftItems = draft?.items || [];
  const metricCount = draftItems.reduce((s, i) => s + (i.metrics || []).filter((m) => m.selected).length, 0);
  const hasMain = draftItems.some((i) => i.role === 'main');

  const goNext = () => {
    if (!draftItems.length) { message.warning('请先勾选至少 1 个 IoT 数据源'); return; }
    setValidateResult(null);
    setStep(1);
  };

  const doValidate = () => {
    if (!draft) { message.warning('请先勾选 IoT 数据源，生成绑定草稿'); return; }
    const res = validateBindingDraft(draft, { metricsByKey: state.entities.metricsByKey });
    setValidateResult(res);
    if (res.ok) message.success('校验通过：可以保存绑定草稿');
    else message.error(`校验未通过（${res.errors.length} 项）`);
  };

  const doSave = () => {
    if (!draft) { message.warning('没有待保存的绑定草稿'); return; }
    const res = validateBindingDraft(draft, { metricsByKey: state.entities.metricsByKey });
    setValidateResult(res);
    if (!res.ok) { message.error('校验未通过，保存被拒绝：请先处理校验项'); return; }
    const r = actions.saveBinding(deviceId, `绑定草稿 v${draft.version}：${draftItems.length} 个来源 / ${metricCount} 项指标`);
    if (r.ok) {
      message.success(r.message);
      onClose();
    } else {
      message.error(r.message);
    }
  };

  const toggleMetric = (item, metric) => {
    if (metric.syncStatus === '已失效') {
      // 已失效指标可点击，但校验不通过：即时提示（domain/reducer 同口径）
      message.warning(`指标 ${metric.name}（${metric.metricCode}）已失效，不能参与绑定：请改选有效指标，否则校验不通过`);
      return;
    }
    actions.toggleBindingMetric(deviceId, item.iotDeviceId, metric.metricCode);
  };

  // 存为模板：把当前草稿的「来源结构 + 指标口径」固化，供批量应用到同型号设备
  const doSaveTemplate = () => {
    const name = tplName.trim();
    if (!name) { message.warning('请填写模板名称'); return; }
    if (!draftItems.length) { message.warning('当前草稿没有数据源，无法保存为模板'); return; }
    const template = {
      templateId: `bt-${Date.now()}`,
      name,
      sourceName: `${deviceName}（${deviceId}）`,
      items: draftItems.map((i) => ({
        role: i.role, kind: i.kind || (i.role === 'main' ? '主设备' : '子传感器'), sensorType: i.sensorType,
        metrics: (i.metrics || []).map((m) => ({ metricCode: m.metricCode, metricVersion: m.metricVersion, selected: !!m.selected })),
      })),
    };
    const r = actions.saveBindingTemplate(template);
    r.ok ? message.success(r.message) : message.error(r.message);
    setTplNameOpen(false);
  };

  // 底部按钮按步骤切换：第 1 步「下一步」，第 2 步「校验 / 存为模板 / 保存」
  const footer = step === 0 ? [
    <Button key="cancel" onClick={onClose}>取消</Button>,
    <Button key="next" type="primary" disabled={!draftItems.length} onClick={goNext}>
      下一步：选择指标 <ArrowRight size={14} style={{ verticalAlign: '-2px' }} />
    </Button>,
  ] : [
    <Button key="cancel" onClick={onClose}>取消</Button>,
    <Button key="prev" icon={<ArrowLeft size={14} />} onClick={() => { setStep(0); setValidateResult(null); }}>上一步</Button>,
    <Button key="tpl" icon={<LayoutTemplate size={14} />} disabled={!draftItems.length} onClick={() => { setTplName(`${deviceName || ''}绑定模板`); setTplNameOpen(true); }}>存为模板</Button>,
    <Button key="validate" icon={<ShieldCheck size={14} />} onClick={doValidate}>校验</Button>,
    <Button key="save" type="primary" icon={<Save size={14} />} onClick={doSave}>保存（生成待生效版本）</Button>,
  ];

  return (
    <Modal
      title={<>绑定草稿 · {deviceName}（{deviceId}）<Tag style={{ marginLeft: 8 }}>新版本 v{currentVersion + 1}</Tag></>}
      width={1000}
      open={open}
      onCancel={onClose}
      footer={footer}
    >
      <Steps
        size="small" current={step} style={{ marginBottom: 16, maxWidth: 560 }}
        items={[{ title: '选择 IoT 数据源' }, { title: '选择指标' }]}
      />
      <Alert
        type="info" showIcon style={{ marginBottom: 12 }}
        message="草稿仅保存在页面状态中（未保存不影响现有绑定）；保存后生成新版本，状态「待生效」，需再点「启用」才影响监测/报警/OEE/报表。"
      />
      {validateResult && step === 1 && (
        validateResult.ok ? (
          <Alert type="success" showIcon style={{ marginBottom: 12 }} message="校验通过：恰好 1 个启用的主设备、至少 1 项有效指标、同一绑定内来源编码不重复。" />
        ) : (
          <Alert
            type="error" showIcon style={{ marginBottom: 12 }}
            message="校验未通过"
            description={(
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {validateResult.errors.map((e) => <li key={e}>{e}</li>)}
              </ul>
            )}
          />
        )
      )}

      {step === 0 && (
        <>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 6 }}>
            第 1 步 · 勾选 IoT 数据源并指定角色（IoT 上报类型不作判定依据；每次绑定恰好 1 个主设备，子设备可多个）
          </Typography.Paragraph>
          <Input
            allowClear size="small" style={{ width: 260, marginBottom: 8 }}
            placeholder="搜索来源编码 / 名称" value={sourceKw} onChange={(e) => setSourceKw(e.target.value)}
          />
          <div style={{ border: '1px solid #eef1f4', borderRadius: 6, padding: '8px 12px', marginBottom: 12, maxHeight: 320, overflow: 'auto' }}>
            {sourceDevices.map((s) => {
              const item = draftItems.find((i) => i.iotDeviceId === s.iotDeviceId);
              const checked = !!item;
              const occupied = occupiedCodes.has(s.iotDeviceCode);
              return (
                <div key={s.iotDeviceId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <Checkbox
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // 角色不依据 IoT 上报类型判定：默认加入为子设备，由用户在此指定主/子
                        actions.addBindingSource(deviceId, {
                          iotDeviceId: s.iotDeviceId,
                          iotDeviceCode: s.iotDeviceCode,
                          name: s.name,
                          role: 'sensor',
                          sensorType: s.name,
                          kind: '子传感器',
                          metrics: [],
                        });
                      } else {
                        actions.removeBindingSource(deviceId, s.iotDeviceId);
                      }
                      setValidateResult(null);
                    }}
                  >
                    {s.iotDeviceCode} · {s.name}
                  </Checkbox>
                  {checked && (
                    <Select
                      size="small" style={{ width: 96 }} value={item.role}
                      options={[{ value: 'main', label: '主设备' }, { value: 'sensor', label: '子设备' }]}
                      onChange={(v) => { actions.setBindingSourceRole(deviceId, s.iotDeviceId, v); setValidateResult(null); }}
                    />
                  )}
                  {occupied && (
                    <Tooltip title="仅提示：该编码已被其它设备绑定，不影响本次绑定（业务允许多台设备绑定同一来源）">
                      <Tag color="warning" style={{ cursor: 'help' }}>已被其它设备占用</Tag>
                    </Tooltip>
                  )}
                </div>
              );
            })}
          </div>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
            已选 <b>{draftItems.length}</b> 个来源（主设备 {draftItems.filter((i) => i.role === 'main').length} 个 / 子设备 {draftItems.filter((i) => i.role !== 'main').length} 个）
            {draftItems.length > 0 && !hasMain && '；尚未指定主设备——请在列表中把一个来源设为「主设备」（校验要求恰好 1 个）'}
            ；点击「下一步」为各数据源选择指标。
          </Typography.Paragraph>
        </>
      )}

      {step === 1 && (
        <>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 6 }}>
            第 2 步 · 为每个已选数据源勾选指标（已失效指标「环境湿度 M.ambient_humidity」可点选，但校验不通过时会被拦截）
          </Typography.Paragraph>
          {draftItems.length === 0 ? (
            <div style={{ color: '#8a97a3', fontSize: 12, padding: '8px 0 4px' }}>
              尚未选择数据源：请先「上一步」勾选至少 1 个 IoT 主设备。
            </div>
          ) : (
            draftItems.map((item) => (
              <Card
                key={item.iotDeviceId}
                size="small"
                style={{ marginBottom: 8 }}
                title={(
                  <Space wrap>
                    <span>{item.iotDeviceCode} · {item.name || '--'}</span>
                    <Tag color={item.role === 'main' ? 'blue' : 'default'}>{item.role === 'main' ? '主设备' : '子设备'}</Tag>
                    <a
                      onClick={() => { actions.removeBindingSource(deviceId, item.iotDeviceId); setValidateResult(null); }}
                      style={{ fontSize: 12 }}
                    >
                      移除
                    </a>
                  </Space>
                )}
                extra={<span style={{ fontSize: 12, color: '#8a97a3' }}>已选 {(item.metrics || []).filter((m) => m.selected).length} 项</span>}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 4 }}>
                  {metrics.map((m) => {
                    const sel = (item.metrics || []).find((x) => x.metricCode === m.metricCode);
                    return (
                      <Checkbox
                        key={m.metricCode}
                        checked={!!sel?.selected}
                        onChange={() => toggleMetric(item, m)}
                      >
                        <span>{m.name}（{m.metricCode} · {m.metricVersion}）</span>
                        {m.syncStatus === '已失效' && <Tag color={metricTagColor(m)} style={{ marginLeft: 6 }}>已失效</Tag>}
                      </Checkbox>
                    );
                  })}
                </div>
              </Card>
            ))
          )}
        </>
      )}

      {/* 存为模板：命名后固化「来源结构 + 指标口径」，供批量应用到同型号设备 */}
      <Modal
        title="保存为绑定模板"
        width={460}
        open={tplNameOpen}
        destroyOnClose
        onCancel={() => setTplNameOpen(false)}
        onOk={doSaveTemplate}
        okText="保存模板" cancelText="取消"
      >
        <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
          模板记录来源结构（1 主设备 + 子传感器组合）与指标口径，不记录具体 IoT 编码——批量应用时由物联网平台按设备自动分配专属来源编码（演示模拟），因此同一模板可应用到任意多台设备。
        </Typography.Paragraph>
        <Input placeholder="模板名称（如：CNC 加工中心标准联网模板）" value={tplName} onChange={(e) => setTplName(e.target.value)} />
      </Modal>
    </Modal>
  );
}

// 模板批量应用弹窗已抽为共享组件（components/ApplyTemplateModal.jsx），供本页与「绑定模板管理」页共用。

// ---------- 停用弹窗（填原因） ----------
function DisableBindingModal({ deviceId, deviceName, version, open, onClose }) {
  const actions = useDemoActions();
  const { message } = App.useApp();
  const [reason, setReason] = useState('');

  const doDisable = () => {
    if (!reason.trim()) { message.warning('停用必须填写原因（留痕）'); return; }
    const r = actions.disableBinding(deviceId);
    if (r.ok) {
      message.success(`${r.message}（停用原因：${reason.trim()}）`);
      setReason('');
      onClose();
    } else {
      message.error(r.message);
    }
  };

  return (
    <Modal
      title={`停用绑定 · ${deviceName}（${deviceId} · v${version}）`}
      width={520}
      open={open}
      onOk={doDisable}
      onCancel={() => { setReason(''); onClose(); }}
      okText="确认停用" cancelText="取消"
    >
      <Alert
        type="warning" showIcon style={{ marginBottom: 12 }}
        message="停用后该设备实时监测 / 指标报警 / OEE / 报表立即失去数据来源（状态「已停用」），失效指标不再参与统计；可重新编辑绑定后再次启用。"
      />
      <div style={{ marginBottom: 6, fontSize: 12, color: '#5d6b78' }}>停用原因（必填，进入业务履历留痕）</div>
      <Input.TextArea
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="如：设备转产停用 / IoT 网关更换，待重新绑定"
      />
    </Modal>
  );
}

// ---------- 主页面 ----------
export default function BindingOverviewPage() {
  const state = useDemoState();
  const actions = useDemoActions();
  const { message } = App.useApp();
  const navigate = useNavigate();

  // UI 局部状态：弹窗开关
  const [draftTarget, setDraftTarget] = useState(null);   // { deviceId, deviceName }
  const [disableTarget, setDisableTarget] = useState(null); // { deviceId, deviceName, version }
  const [applyTarget, setApplyTarget] = useState(null);   // null=关闭；字符串=预选模板 id（''=不预选）

  const rows = useMemo(() => selectAllDevices(state).map((d) => {
    const binding = state.entities.bindingsByDeviceId[d.deviceId] || null;
    const draft = selectBindingDraft(state, d.deviceId);
    const health = state.entities.healthByDeviceId[d.deviceId] || {};
    const status = draft ? draft.configStatus : (binding?.configStatus || '未配置');
    const metricCount = (draft || binding)?.items?.reduce((s, i) => s + (i.metrics || []).filter((m) => m.selected).length, 0) ?? null;
    return { device: d, binding, draft, health, status, metricCount };
  }), [state]);

  const activeCount = rows.filter((r) => r.status === '已启用').length;
  const unconfiguredCount = rows.filter((r) => r.status === '未配置').length;
  const interruptedCount = rows.filter((r) => r.health.status === '数据中断').length;

  const enable = (r) => {
    const res = actions.enableBinding(r.device.deviceId);
    if (res.ok) message.success(res.message);
    else message.error(res.message);
  };

  const renderActions = (r) => {
    const { status, binding, device } = r;
    if (status === '未配置') {
      return <Button type="primary" size="small" icon={<Plus size={13} />} onClick={() => setDraftTarget({ deviceId: device.deviceId, deviceName: device.name })}>新建绑定</Button>;
    }
    if (status === '已启用') {
      return (
        <Space size={4}>
          <Button size="small" icon={<PauseCircle size={13} />} onClick={() => setDisableTarget({ deviceId: device.deviceId, deviceName: device.name, version: binding?.version ?? '--' })}>停用</Button>
          <Tooltip title="换绑说明：直接打开绑定草稿，修改来源/指标后保存，将生成新版本（旧版本留痕不覆盖）；新版本「待生效」→「启用」后完成换绑。">
            <Button size="small" type="text" icon={<Settings2 size={13} />}>换绑</Button>
          </Tooltip>
        </Space>
      );
    }
    if (status === '待生效') {
      return (
        <Space size={4}>
          <Button type="primary" size="small" icon={<Play size={13} />} onClick={() => enable(r)}>启用</Button>
          <Button size="small" onClick={() => setDraftTarget({ deviceId: device.deviceId, deviceName: device.name })}>编辑草稿</Button>
        </Space>
      );
    }
    if (status === '已停用') {
      // 状态机约束：已停用 → 草稿（重新绑定保存后「待生效」→「启用」），不能直接启用
      return <Button size="small" icon={<Plus size={13} />} onClick={() => setDraftTarget({ deviceId: device.deviceId, deviceName: device.name })}>重新绑定</Button>;
    }
    // 草稿 / 校验中 / 换绑中：继续编辑草稿
    return <Button size="small" onClick={() => setDraftTarget({ deviceId: device.deviceId, deviceName: device.name })}>继续编辑</Button>;
  };

  return (
    <>
      <PageHeader
        title="联网配置总览"
        subtitle="设备 ↔ IoT 平台绑定关系（状态机：未配置 → 草稿 → 校验 → 待生效 → 已启用 → 已停用/换绑中）· 网关/协议/点位由物联网平台管理，本页不维护"
      />
      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={6}><Card size="small"><Statistic title="设备绑定关系" value={rows.length} suffix="台" /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="已启用" value={activeCount} suffix="台" valueStyle={{ color: '#3f8600' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="未配置" value={unconfiguredCount} suffix="台" valueStyle={{ color: unconfiguredCount ? '#d46b08' : undefined }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="数据中断" value={interruptedCount} suffix="台" valueStyle={{ color: interruptedCount ? '#cf1322' : undefined }} /></Card></Col>
      </Row>

      {/* 绑定模板已独立成「绑定模板管理」页；此处保留入口提示 + 批量应用快捷入口 */}
      <Alert
        type="info" showIcon icon={<LayoutTemplate size={14} />} style={{ marginBottom: 12 }}
        message={(
          <Space size={4} wrap>
            <span>同型号设备可复用绑定模板批量联网：模板的新建 / 编辑 / 删除在「绑定模板管理」页维护。</span>
            <a onClick={() => navigate('/binding-templates')}>前往绑定模板管理 →</a>
          </Space>
        )}
      />

      <Card
        size="small" style={{ marginBottom: 12 }}
        title="绑定状态列表（8 台设备）"
        extra={(
          <Space size={8}>
            <Button size="small" icon={<LayoutTemplate size={13} />} onClick={() => setApplyTarget('')}>应用到设备</Button>
            <Button type="primary" size="small" icon={<Plus size={13} />} onClick={() => { const t = rows.find((r) => r.status === '未配置') || rows[0]; setDraftTarget({ deviceId: t.device.deviceId, deviceName: t.device.name }); }}>新建绑定</Button>
          </Space>
        )}
      >
        <Table
          rowKey={(r) => r.device.deviceId}
          size="small"
          dataSource={rows}
          pagination={false}
          columns={[
            { title: '设备编号', width: 100, render: (_, r) => r.device.deviceId },
            { title: '设备名称', width: 130, render: (_, r) => r.device.name },
            {
              title: '配置状态', width: 100,
              render: (_, r) => (
                <StatusTag
                  value={r.status}
                  tip={r.draft ? '存在未保存的绑定草稿（保存后生成新版本「待生效」）' : undefined}
                />
              ),
            },
            { title: '健康状态', width: 100, render: (_, r) => <StatusTag value={r.health.status || '--'} /> },
            {
              title: '绑定版本', width: 90,
              render: (_, r) => (r.draft ? <span>草稿 v{r.draft.version}</span> : (r.binding ? `v${r.binding.version}` : '--')),
            },
            {
              title: '主数据源', width: 130,
              render: (_, r) => {
                const items = (r.draft || r.binding)?.items || [];
                const main = items.find((i) => i.enabled && i.role === 'main');
                return main?.iotDeviceCode || '--';
              },
            },
            {
              title: '来源数 / 已选指标', width: 130,
              render: (_, r) => {
                if (r.metricCount === null) return '--';
                const items = (r.draft || r.binding)?.items || [];
                return `${items.filter((i) => i.enabled).length} / ${r.metricCount} 项`;
              },
            },
            { title: '拉取周期', width: 90, render: (_, r) => (r.binding ? `${r.binding.pullCycleSec} 秒` : '--') },
            { title: '最近拉取', width: 150, render: (_, r) => (r.binding?.lastPullTime || '--') },
            {
              title: '待补偿', width: 90,
              render: (_, r) => (r.binding?.pendingCompensation ? <span style={{ color: '#d46b08' }}>{r.binding.pendingCompensation} 个</span> : '0 个'),
            },
            { title: '操作', width: 190, fixed: 'right', render: (_, r) => renderActions(r) },
          ]}
          expandable={{
            expandedRowRender: (r) => {
              const items = (r.draft || r.binding)?.items || [];
              if (!items.length) return <span style={{ color: '#8a97a3', fontSize: 12 }}>无绑定来源（{r.status === '未配置' ? '未配置：点击「新建绑定」创建首个绑定' : '--'}）</span>;
              return (
                <div style={{ display: 'grid', gap: 6 }}>
                  {items.map((i) => (
                    <div key={i.iotDeviceId} style={{ fontSize: 12 }}>
                      <Space size={6} wrap>
                        <Tag color={i.enabled ? (i.role === 'main' ? 'blue' : 'default') : 'default'}>{i.iotDeviceCode}{i.enabled ? '' : '（停用）'}</Tag>
                        <span>{i.role === 'main' ? '主设备' : (i.sensorType || '子传感器')}</span>
                        {(i.metrics || []).filter((m) => m.selected).map((m) => {
                          const def = state.entities.metricsByKey[m.metricCode];
                          return <Tag key={m.metricCode} color={def?.syncStatus === '已失效' ? 'error' : 'default'}>{def?.name || m.metricCode} {m.metricVersion}</Tag>;
                        })}
                      </Space>
                    </div>
                  ))}
                </div>
              );
            },
          }}
        />
        <div style={{ color: '#5d6b78', fontSize: 12, marginTop: 8 }}>
          换绑说明：已启用设备可点击「换绑」打开绑定草稿，修改来源/指标后保存将生成新版本 binding-&#123;deviceId&#125;-NN（旧版本留痕不覆盖），新版本状态「待生效」，点「启用」后完成换绑并影响监测/报警/OEE/报表/大屏。
          校验规则：每次绑定恰好 1 个主设备、子设备可多个、至少 1 项有效（未失效）指标、同一绑定内来源编码不重复；来源编码被其它设备占用仅提示、不限制绑定。主/子角色由本系统在绑定时指定（IoT 上报类型仅作参考）。接入任务健康度见 <a onClick={() => navigate('/platform-metrics')}>平台指标清单 / 接入任务</a>。
        </div>
      </Card>

      <BindingDraftModal
        deviceId={draftTarget?.deviceId}
        deviceName={draftTarget?.deviceName}
        open={!!draftTarget}
        onClose={() => setDraftTarget(null)}
      />
      <DisableBindingModal
        deviceId={disableTarget?.deviceId}
        deviceName={disableTarget?.deviceName}
        version={disableTarget?.version}
        open={!!disableTarget}
        onClose={() => setDisableTarget(null)}
      />
      <ApplyTemplateModal
        open={applyTarget !== null}
        initialTemplateId={applyTarget || ''}
        onClose={() => setApplyTarget(null)}
      />
    </>
  );
}
