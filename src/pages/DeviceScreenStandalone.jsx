// ============================================================
// 设备监测大屏（独立页 /screen/*：新标签页打开，不走后台布局与登录态）
// 数据来自 selectScreenViewModel（与后台同源只读读模型）：
// 前 5 台设备的运行状态 / 通信健康 / 关键温度 / OEE / 报警数 + 汇总卡片。
// 保留深色大屏视觉风格与轮播（卡片顺序定时轮转，可暂停）。
// 硬规则：不使用 Date.now（时间取 meta / 样本自带）；空值显示 '--'；底部标注「演示数据」。
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import { DemoStoreProvider, useDemoState } from '../state/DemoStore.jsx';
import { selectScreenViewModel } from '../state/selectors.js';

const C = {
  bg: '#07131b',
  surface: '#0c202a',
  surface2: '#102a35',
  line: '#244652',
  lineSoft: '#1b3944',
  text: '#e8f1f2',
  muted: '#8ea7ae',
  muted2: '#66818a',
  cyan: '#53d3e2',
  green: '#36c98f',
  amber: '#ffb454',
  red: '#ff5c5c',
  offline: '#8b98a0',
};

const RUN_COLOR = { '运行': C.green, '待机': C.amber, '计划停机': C.amber, '故障': C.red, '维修中': C.cyan, '无数据': C.offline };
const HEALTH_COLOR = { '正常': C.green, '延迟': C.amber, '部分中断': C.amber, '恢复中': C.cyan, '数据中断': C.red, '未知': C.offline };

const PROVIDER_LABEL = {
  'mock-polling': '演示轮询',
  'mock-subscription': '演示订阅',
  disconnect: '已断开（降级）',
};

function fmtValue(v, unit) {
  if (v === null || v === undefined || v === '--') return '--';
  return `${v}${unit && unit !== '--' ? ` ${unit}` : ''}`;
}

function ScreenBody() {
  const state = useDemoState();
  const vm = useMemo(() => selectScreenViewModel(state), [state]);
  const [paused, setPaused] = useState(false);
  const [offset, setOffset] = useState(0);

  // 轮播：每 5 秒轮转一次卡片顺序（仅展示层行为，不改业务数据）
  useEffect(() => {
    if (paused) return undefined;
    const timer = setInterval(() => setOffset((o) => o + 1), 5000);
    return () => clearInterval(timer);
  }, [paused]);

  const devices = vm.devices.map((_, i) => vm.devices[(i + offset) % vm.devices.length]);
  const { summary, meta } = vm;

  const summaryCards = [
    { label: '接入设备', value: summary.total, color: C.cyan },
    { label: '运行', value: summary.running, color: C.green },
    { label: '故障', value: summary.fault, color: summary.fault ? C.red : C.text },
    { label: '无数据', value: summary.noData, color: summary.noData ? C.offline : C.text },
    { label: '活动报警', value: summary.activeAlarms, color: summary.activeAlarms ? C.amber : C.text },
    { label: '未确认报警', value: summary.unacked, color: summary.unacked ? C.red : C.text },
  ];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: C.bg, color: C.text,
      fontFamily: '"Geist", "Microsoft YaHei", "PingFang SC", Arial, sans-serif',
    }}>
      {/* 顶栏 */}
      <header style={{
        flex: '0 0 64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderBottom: `1px solid ${C.lineSoft}`, background: '#071720',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>设备监测大屏</span>
          <span style={{ color: C.muted2, fontSize: 12 }}>东浩智创 · 装备智能运营中枢 · 独立大屏（/screen/* 不走后台布局）</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12, color: C.muted }}>
          <span>最后样本 <b style={{ color: C.text, fontVariantNumeric: 'tabular-nums' }}>{meta.lastSampleAt || '--'}</b></span>
          <span>延迟 <b style={{ color: C.text }}>{meta.latencySec ?? '--'}s</b></span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i style={{ width: 7, height: 7, borderRadius: '50%', background: meta.degraded ? C.red : C.cyan, boxShadow: `0 0 0 4px ${meta.degraded ? 'rgba(255,92,92,.12)' : 'rgba(83,211,226,.12)'}` }} />
            {meta.degraded ? '演示降级' : '演示数据'} · {PROVIDER_LABEL[meta.provider] || meta.provider}
          </span>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            style={{
              height: 28, padding: '0 12px', borderRadius: 5, cursor: 'pointer',
              border: `1px solid ${C.line}`, background: C.surface2, color: C.text, fontSize: 12,
            }}
          >
            {paused ? '▶ 继续轮播' : '⏸ 暂停轮播'}
          </button>
        </div>
      </header>

      {/* 汇总卡片 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 12,
        padding: '14px 18px 0',
      }}>
        {summaryCards.map((c) => (
          <div key={c.label} style={{
            border: `1px solid ${C.lineSoft}`, background: C.surface, borderRadius: 7, padding: '12px 14px',
          }}>
            <div style={{ color: C.muted, fontSize: 12 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.4, color: c.color, fontVariantNumeric: 'tabular-nums' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* 设备卡片（轮播） */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12, padding: '14px 18px' }}>
        {devices.map((d, i) => {
          const runColor = RUN_COLOR[d.runStatus] || C.offline;
          const healthColor = HEALTH_COLOR[d.healthStatus] || C.offline;
          const interrupted = d.healthStatus === '数据中断';
          const highTemp = d.spindleTemp !== null && d.spindleTemp >= 85;
          const first = i === 0;
          return (
            <div key={d.deviceId} style={{
              minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10,
              border: `1px solid ${interrupted ? 'rgba(139,152,160,.72)' : d.runStatus === '故障' ? 'rgba(255,92,92,.9)' : first ? C.cyan : C.line}`,
              borderRadius: 7, background: C.surface, padding: '14px 15px',
              boxShadow: first ? '0 0 0 1px rgba(83,211,226,.25), 0 10px 22px rgba(0,0,0,.2)' : 'none',
              transition: 'border-color .3s ease, box-shadow .3s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 25, height: 25, display: 'grid', placeItems: 'center', borderRadius: 5,
                  background: interrupted ? '#40515a' : d.runStatus === '故障' ? '#8c2431' : '#17333e',
                  color: C.text, fontWeight: 700, fontSize: 12,
                }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
              </div>
              <div style={{ color: C.muted2, fontSize: 12 }}>{d.assetCode || '--'} · {d.deviceId}</div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,.06)', color: runColor }}>
                  {d.runStatus || '--'}
                </span>
                <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,.06)', color: healthColor }}>
                  {d.healthStatus || '--'}
                </span>
                {highTemp && (
                  <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: 'rgba(255,92,92,.16)', color: C.red }}>
                    高温
                  </span>
                )}
                {interrupted && (
                  <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: 'rgba(255,92,92,.16)', color: C.red }}>
                    数据中断
                  </span>
                )}
              </div>

              <div style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ color: C.muted }}>主轴温度</span>
                  <b style={{ color: highTemp ? C.red : C.text, fontVariantNumeric: 'tabular-nums' }}>{fmtValue(d.spindleTemp, '℃')}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ color: C.muted }}>冷却液温度</span>
                  <b style={{ color: C.text, fontVariantNumeric: 'tabular-nums' }}>{fmtValue(d.coolantTemp, '℃')}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ color: C.muted }}>OEE</span>
                  <b style={{ color: d.oee === null || d.oee === undefined ? C.offline : C.cyan, fontVariantNumeric: 'tabular-nums' }}>
                    {d.oee === null || d.oee === undefined ? '--' : `${d.oee}%`}
                  </b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ color: C.muted }}>报警</span>
                  <b style={{ color: d.alarms ? C.red : C.text, fontVariantNumeric: 'tabular-nums' }}>{d.alarms} 条</b>
                </div>
              </div>

              <div style={{ marginTop: 'auto', borderTop: `1px solid ${C.lineSoft}`, paddingTop: 8, fontSize: 11, color: C.muted2, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.urgentAlarm ? `紧急：${d.urgentAlarm.name}` : interrupted ? '最近样本 ' : '最后样本 '}
                </span>
                <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{d.lastSampleAt || '--'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部标注 */}
      <footer style={{
        flex: '0 0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderTop: `1px solid ${C.lineSoft}`, color: C.muted2, fontSize: 12,
      }}>
        <span>演示数据 · 数据来源：{PROVIDER_LABEL[meta.provider] || meta.provider || '--'} · 时区 {meta.timezone || '--'} · 快照更新 {meta.updatedAt || '--'}</span>
        <span>与后台同源读模型（selectScreenViewModel）· OEE / 报警口径与后台一致</span>
      </footer>
    </div>
  );
}

// /screen/* 路由在 App.jsx 中提前返回、位于 DemoStoreProvider 之外，
// 因此本页自行挂载 Provider（只读大屏，不触发业务动作）。
export default function DeviceScreenStandalone() {
  return (
    <DemoStoreProvider>
      <ScreenBody />
    </DemoStoreProvider>
  );
}
