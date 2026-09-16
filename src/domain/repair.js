// ============================================================
// 维修领域层（纯 JS：报修/主工单统一状态机、幂等约束；§6.5）
// ============================================================

// 维修状态机：
// 报修草稿 → 已提交/待派工 → 已派工 → 维修中 → 待验收 → 已完成
//                          ↘ 挂起 → 恢复      ↘ 返修 → 维修中
//                          ↘ 已取消
export const REPAIR_TRANSITIONS = {
  '草稿': ['已提交'],
  '待派工': ['已派工', '已取消'],
  '已派工': ['维修中', '已取消'],
  '维修中': ['挂起', '待验收'],
  '挂起': ['维修中', '已取消'],
  '待验收': ['已完成', '维修中'], // 验收通过 → 已完成；退回返修 → 维修中
  '已完成': [],
  '已取消': [],
};

export function canRepairTransition(from, to) {
  return (REPAIR_TRANSITIONS[from] || []).includes(to);
}

export const REPAIR_LEVELS = ['紧急', '严重', '一般'];
export const FAULT_TYPES = ['机械', '电气', '液压', '气动', '控制系统', '过热', '磨损', '其他'];

// 一条活动故障默认只允许一张活动主工单：报警转维修幂等（repair-from-alarm:alarmId）
export function hasActiveRepairForAlarm(orders, alarmId) {
  return (orders || []).some(o => o.alarmId === alarmId && !['已完成', '已取消'].includes(o.status));
}

// 验收通过才允许恢复设备 / 结算；提交维修结果只进入待验收
export function acceptanceResultRepairStatus(result) {
  return result === '通过' ? '已完成' : '维修中'; // 返修保留原履历
}

// SLA 等级对应的响应时限（演示口径，小时）
export const SLA_HOURS = { '紧急': 2, '严重': 8, '一般': 24 };

// 维修时间线事件类型
export const REPAIR_TIMELINE_TYPES = ['创建', '派工', '接单', '开工', '挂起', '恢复', '领料', '提交', '验收通过', '退回返修', '取消'];
