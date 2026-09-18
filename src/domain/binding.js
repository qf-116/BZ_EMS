// ============================================================
// IoT 绑定领域层（纯 JS：绑定状态机与校验；§6.1）
// ============================================================

import { BINDING_CONFIG_STATUS } from './device.js';

// 绑定状态机：待配置 → 草稿 → 校验通过 → 待生效 → 已启用 →（已停用 / 换绑中）
// 主/子角色由设备管理系统在绑定时指定（IoT 上报类型仅作参考）：每绑定恰好 1 个主设备，子设备可多个。
export const BINDING_TRANSITIONS = {
  '未配置': ['草稿'],
  '草稿': ['校验中', '已停用'],
  '校验中': ['校验通过', '草稿'],
  '校验通过': ['待生效', '草稿'],
  '待生效': ['已启用', '草稿'],
  '已启用': ['已停用', '换绑中'],
  '换绑中': ['已启用', '已停用'],
  '已停用': ['草稿'],
};

export function canTransitionBinding(from, to) {
  return (BINDING_TRANSITIONS[from] || []).includes(to);
}

// 校验一条绑定草稿：恰好 1 个主设备、至少 1 个启用项、
// 至少选择一项有效（未失效）指标、同一绑定内来源编码不重复。
// 说明：IoT 来源编码被其它设备占用仅作提示、不作为限制条件（业务允许多台设备绑定同一来源）。
// ctx: { sourceDevicesById, metricsByKey }
export function validateBindingDraft(draft, ctx = {}) {
  const errors = [];
  const items = draft.items || [];
  const enabled = items.filter(i => i.enabled);
  if (enabled.length === 0) errors.push('至少保留一个启用的 IoT 来源设备');
  const mains = enabled.filter(i => i.role === 'main');
  if (mains.length !== 1) errors.push('必须恰好启用一个 IoT 主设备');
  const codes = enabled.map(i => i.iotDeviceCode);
  if (new Set(codes).size !== codes.length) errors.push('同一绑定内 IoT 来源编码重复');
  // 指标校验：启用项至少选择一项有效（未失效）指标
  const metricsByKey = ctx.metricsByKey || {};
  let validMetric = false;
  enabled.forEach(item => (item.metrics || []).forEach(sel => {
    if (!sel.selected) return;
    const def = metricsByKey[sel.metricCode];
    if (!def) errors.push(`指标 ${sel.metricCode} 不在平台指标清单中`);
    else if (def.syncStatus === '已失效') errors.push(`指标 ${def.name}（${sel.metricCode}）已失效，不能参与绑定`);
    else validMetric = true;
  }));
  if (enabled.length > 0 && !validMetric) errors.push('至少选择一项有效指标才能启用绑定');
  return { ok: errors.length === 0, errors };
}

// 影响范围：绑定变更影响报警规则、监测、OEE 与报表（供 saveBinding 反馈展示）
export function bindingImpact(binding) {
  if (!binding) return { devices: 0, domains: [] };
  return {
    devices: 1,
    domains: ['数据接入', '运行监测', '报警中心', 'OEE', '报表', '大屏'],
    description: `绑定版本 v${binding.version} 变更将影响该设备的实时监测、指标报警判定、OEE 计算与报表统计`,
  };
}
