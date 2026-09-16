// ============================================================
// 停机领域层（纯 JS：统一停机事实的校验与口径；§6.7）
// ============================================================

// 停机原因分类：计划停机、故障停机、维修停机、换模、待料、数据中断 均为停机事实
export const DOWNTIME_CATEGORIES = ['计划停机', '故障停机', '维修停机', '换模', '待料', '数据中断'];

export const DOWNTIME_SOURCES = ['人工登记', '报警联动', '维修联动', '计划排程'];

// 停机事实状态
export const DOWNTIME_STATUS = ['待执行', '进行中', '已结束', '已取消'];

// 计划停机只按明确口径影响可用率（扣可用率分母），不扣性能率或合格率
export function affectsAvailability(category) {
  return DOWNTIME_CATEGORIES.includes(category);
}
export function affectsPerformance() { return false; }
export function affectsQuality() { return false; }

// 分钟数（跨天窗口以绝对时间计算）
export function overlapMinutes(factStart, factEnd, winStart, winEnd) {
  const s = Math.max(factStart, winStart);
  const e = Math.min(factEnd, winEnd);
  return e > s ? (e - s) / 60000 : 0;
}

// 校验一条停机登记：开始<结束、不允许与同设备进行中事实重叠、取消需原因
export function validateDowntime(fact, existingFacts = []) {
  const errors = [];
  const start = new Date(fact.start).getTime();
  const end = fact.end ? new Date(fact.end).getTime() : null;
  if (!Number.isFinite(start)) errors.push('开始时间无效');
  if (end !== null) {
    if (!Number.isFinite(end)) errors.push('结束时间无效');
    else if (end <= start) errors.push('结束时间必须晚于开始时间');
  }
  if (!DOWNTIME_CATEGORIES.includes(fact.category)) errors.push('停机原因分类无效');
  if (fact.status === '已取消' && !(fact.reason || '').trim()) errors.push('取消停机必须填写原因');
  // 重叠校验：同设备同分类的进行中/已结束事实不允许时间重叠（已取消除外）
  existingFacts
    .filter(f => f.deviceId === fact.deviceId && f.status !== '已取消' && f.downtimeId !== fact.downtimeId)
    .forEach(f => {
      const fs = new Date(f.start).getTime();
      const fe = f.end ? new Date(f.end).getTime() : Number.MAX_SAFE_INTEGER;
      const ns = start, ne = end ?? Number.MAX_SAFE_INTEGER;
      if (ns < fe && ne > fs) errors.push(`与既有停机事实 ${f.downtimeId}（${f.category}）时间重叠`);
    });
  return { ok: errors.length === 0, errors };
}

// 分钟转展示（8h 30m）
export function fmtMinutes(min) {
  if (min == null) return '--';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
