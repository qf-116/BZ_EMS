// ============================================================
// 程序参数比对与处理记录初始快照（§0.2 数据接入域）
// ============================================================

export const programCompare = [
  { recordId: 'PC-20260916-001', deviceId: 'DEV-002', deviceName: 'CNC加工中心-02', program: 'P-8842', version: 'V3.2', baseline: 2, result: '参数不一致', diff: '进给倍率：105% / 120%；冷却流量：8.0 / 7.2 L/min', tolerance: '±3%', handled: '处理中', user: '王强', time: '16:20:12', relatedAlarmId: 'ALM-20260916-003' },
  { recordId: 'PC-20260916-002', deviceId: 'DEV-001', deviceName: 'CNC加工中心-01', program: 'P-8842', version: 'V3.2', baseline: 1, result: '一致', diff: '--', tolerance: '±1%', handled: '无需处理', user: '--', time: '16:18:55', relatedAlarmId: null },
  { recordId: 'PC-20260916-003', deviceId: 'DEV-004', deviceName: '数控铲齿机-04', program: 'P-7310', version: 'V5.0', baseline: 1, result: '比对失败', diff: 'PLC 读取超时', tolerance: '±0.5%', handled: '待确认', user: '王强', time: '15:44:10', relatedAlarmId: null },
  { recordId: 'PC-20260916-004', deviceId: 'DEV-003', deviceName: '激光焊接机-03', program: 'P-5521', version: 'V2.1', baseline: 0, result: '不适用', diff: '无程序下发基线', tolerance: '--', handled: '无需处理', user: '--', time: '--', relatedAlarmId: null },
];

// 基线参数明细（程序比对详情：基线 vs 实际）
export const programBaselines = {
  'P-8842|V3.2': [
    { param: '进给倍率', baseline: '105%', actual: '120%', tolerance: '±3%', match: false },
    { param: '主轴转速倍率', baseline: '100%', actual: '100%', tolerance: '±2%', match: true },
    { param: '冷却流量', baseline: '8.0 L/min', actual: '7.2 L/min', tolerance: '±10%', match: true },
  ],
  'P-7310|V5.0': [
    { param: '铲齿节拍', baseline: '4.1 s/件', actual: '--（读取超时）', tolerance: '±0.5%', match: false },
  ],
};

// 处理记录（ProgramHandleRecord）
export const programHandles = [
  { recordId: 'PCR-20260916-001', deviceId: 'DEV-002', deviceName: 'CNC加工中心-02', program: 'P-8842 / V3.2', handler: '王强', time: '16:30:12', conclusion: '现场按基线回改参数', action: '停止加工，恢复进给倍率和冷却流量', relatedAlarmId: 'ALM-20260916-003', relatedRepairOrderId: 'RO-20260916-001', attachment: '处置照片.jpg', impactScope: 'ALM-20260916-003 处置依据；比对结果恢复一致后可关闭报警' },
  { recordId: 'PCR-20260916-002', deviceId: 'DEV-001', deviceName: 'CNC加工中心-01', program: 'P-8842 / V3.2', handler: '李明', time: '16:20:30', conclusion: '无需处理', action: '参数一致，继续生产', relatedAlarmId: null, relatedRepairOrderId: null, attachment: '--', impactScope: '--' },
];
