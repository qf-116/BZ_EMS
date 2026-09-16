// ============================================================
// 统一停机事实（DowntimeFact）初始快照；§3.2 / §6.7
// 计划停机、故障停机、维修停机、换模、待料、数据中断 均写入本表；
// 计划停机只按明确口径影响可用率，不扣性能率或合格率。
// ============================================================

export const downtimeFacts = [
  // —— 计划停机（来自计划停机管理登记，人工/排程来源）——
  { downtimeId: 'DT-20260916-101', deviceId: 'DEV-001', deviceName: 'CNC加工中心-01', category: '计划停机', start: '2026-09-16 05:00', end: '2026-09-16 05:20', minutes: 20, reason: '班前点检润滑', source: '计划排程', status: '已结束', relatedAlarmId: null, relatedRepairOrderId: null, affectsProduction: false },
  { downtimeId: 'DT-20260916-102', deviceId: 'DEV-002', deviceName: 'CNC加工中心-02', category: '计划停机', start: '2026-09-16 05:00', end: '2026-09-16 05:20', minutes: 20, reason: '班前点检润滑', source: '计划排程', status: '已结束', relatedAlarmId: null, relatedRepairOrderId: null, affectsProduction: false },
  { downtimeId: 'DT-20260916-103', deviceId: 'DEV-004', deviceName: '数控铲齿机-04', category: '计划停机', start: '2026-09-16 05:00', end: '2026-09-16 05:15', minutes: 15, reason: '班前点检润滑', source: '计划排程', status: '已结束', relatedAlarmId: null, relatedRepairOrderId: null, affectsProduction: false },
  // —— 故障停机（报警联动）——
  { downtimeId: 'DT-20260916-901', deviceId: 'DEV-004', deviceName: '数控铲齿机-04', category: '故障停机', start: '2026-09-16 16:22:35', end: null, minutes: null, reason: '主轴温度高高报警，设备联锁停机', source: '报警联动', status: '进行中', relatedAlarmId: 'ALM-20260916-001', relatedRepairOrderId: null, affectsProduction: true },
  { downtimeId: 'DT-20260916-902', deviceId: 'DEV-002', deviceName: 'CNC加工中心-02', category: '故障停机', start: '2026-09-16 14:45:00', end: '2026-09-16 15:00:00', minutes: 15, reason: '程序参数不一致，暂停加工', source: '报警联动', status: '已结束', relatedAlarmId: 'ALM-20260916-003', relatedRepairOrderId: 'RO-20260916-001', affectsProduction: true },
  // —— 维修停机（维修联动）——
  { downtimeId: 'DT-20260916-902r', deviceId: 'DEV-002', deviceName: 'CNC加工中心-02', category: '维修停机', start: '2026-09-16 15:20:00', end: null, minutes: null, reason: '维修工单 RO-20260916-001 检修中', source: '维修联动', status: '进行中', relatedAlarmId: null, relatedRepairOrderId: 'RO-20260916-001', affectsProduction: true },
  { downtimeId: 'DT-20260915-903', deviceId: 'DEV-001', deviceName: 'CNC加工中心-01', category: '维修停机', start: '2026-09-15 10:00', end: '2026-09-15 11:20', minutes: 80, reason: '维修工单 RO-20260915-002 冷却管路检修', source: '维修联动', status: '已结束', relatedAlarmId: null, relatedRepairOrderId: 'RO-20260915-002', affectsProduction: true },
  { downtimeId: 'DT-20260910-904', deviceId: 'DEV-004', deviceName: '数控铲齿机-04', category: '维修停机', start: '2026-09-10 09:00', end: '2026-09-10 10:40', minutes: 100, reason: '维修工单 RO-20260910-003 润滑系统处理', source: '维修联动', status: '已结束', relatedAlarmId: 'ALM-20260910-000', relatedRepairOrderId: 'RO-20260910-003', affectsProduction: true },
  // —— 数据中断（接入联动；影响可用率口径为「不可计算」而非 0）——
  { downtimeId: 'DT-20260916-905', deviceId: 'DEV-005', deviceName: '机器人焊接-05', category: '数据中断', start: '2026-09-16 15:22:30', end: null, minutes: null, reason: '主设备心跳超时，数据中断', source: '报警联动', status: '进行中', relatedAlarmId: null, relatedRepairOrderId: null, affectsProduction: false },
  // —— 未来计划停机（计划停机管理登记，未到生效时间）——
  { downtimeId: 'DT-20260917-201', deviceId: 'DEV-004', deviceName: '数控铲齿机-04', category: '换模', start: '2026-09-17 13:30', end: '2026-09-17 14:30', minutes: 60, reason: '模具更换与调试', source: '计划排程', status: '待执行', relatedAlarmId: null, relatedRepairOrderId: null, affectsProduction: false },
  { downtimeId: 'DT-20260918-202', deviceId: 'DEV-001', deviceName: 'CNC加工中心-01', category: '计划停机', start: '2026-09-18 18:00', end: '2026-09-18 19:00', minutes: 60, reason: '月度计划保养', source: '计划排程', status: '待执行', relatedAlarmId: null, relatedRepairOrderId: null, affectsProduction: false },
  { downtimeId: 'DT-20260920-203', deviceId: 'DEV-003', deviceName: '激光焊接机-03', category: '计划停机', start: '2026-09-20 08:00', end: '2026-09-20 09:30', minutes: 90, reason: '激光器光路校准', source: '计划排程', status: '待执行', relatedAlarmId: null, relatedRepairOrderId: null, affectsProduction: false },
];
