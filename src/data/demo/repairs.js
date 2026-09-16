// ============================================================
// 维修（RepairReport 报修 / RepairOrder 主工单 / RepairAcceptance 验收）初始快照；§3.2
// 一条活动故障默认一张主工单；报警转维修幂等并回写 repairOrderId（§6.5）
// ============================================================

// 报修记录（RepairReport）：来源 = 报警转维修 / 人工报修 / 监测异常
export const repairReports = [
  { reportId: 'BX-20260916-001', code: 'BX-20260916-001', title: '空压机排气压力低报修', deviceId: 'DEV-006', deviceName: '空压机', deviceCode: 'MT2024A1206', faultType: '气动', level: '一般', faultTime: '2026-09-15 08:05:00', desc: '排气压力低于 0.5 MPa，疑似进气阀故障，请安排检修。', status: '待派工', creator: '李明', createTime: '2026-09-15 08:12', linkedRepairOrderId: null, source: '人工报修' },
  { reportId: 'BX-20260916-002', code: 'BX-20260916-002', title: 'CNC-02 主轴异响报修', deviceId: 'DEV-002', deviceName: 'CNC加工中心-02', deviceCode: 'MT2024A1202', faultType: '机械', level: '严重', faultTime: '2026-09-14 15:40:00', desc: '加工时主轴出现周期性异响，表面振纹明显。', status: '已转工单', creator: '张三', createTime: '2026-09-14 15:45', linkedRepairOrderId: 'RO-20260916-001', source: '人工报修' },
];

// 维修主工单（RepairOrder）：报修与维修统一对象
// status: 待派工 / 已派工 / 维修中 / 挂起 / 待验收 / 已完成 / 已取消
export const repairOrders = [
  {
    repairOrderId: 'RO-20260916-001', code: 'RO-20260916-001', deviceId: 'DEV-002', deviceName: 'CNC加工中心-02', deviceCode: 'MT2024A1202',
    title: '主轴异响与程序参数恢复', source: 'alarm+report', alarmId: 'ALM-20260916-003', reportId: 'BX-20260916-002',
    faultType: '机械', level: '严重', faultDesc: '主轴周期性异响；MES 程序进给倍率被误改为 120%，需恢复基线 105%。',
    status: '维修中', assignee: '周强', assigneeGroup: '机修班', reporter: '王强',
    createdAt: '2026-09-16 14:52', assignedAt: '2026-09-16 15:05', startedAt: '2026-09-16 15:20', submittedAt: null, acceptedAt: null,
    slaHours: 8, slaDueAt: '2026-09-16 22:52',
    downtimeFactId: 'DT-20260916-902', downtimeDuringRepair: true,
    measures: '', verification: '', laborHours: 1.5,
    parts: [], // { spareCode, spareName, qty, warehouseId, outboundId }
    timeline: [
      { type: '创建', time: '2026-09-16 14:52', actor: '王强', detail: '由报警 ALM-20260916-003 转维修生成' },
      { type: '派工', time: '2026-09-16 15:05', actor: '王强', detail: '派工至机修班 周强' },
      { type: '开工', time: '2026-09-16 15:20', actor: '周强', detail: '开始检修主轴与参数恢复' },
    ],
    acceptance: null, reworkCount: 0,
  },
  {
    repairOrderId: 'RO-20260915-002', code: 'RO-20260915-002', deviceId: 'DEV-001', deviceName: 'CNC加工中心-01', deviceCode: 'MT2024A1201',
    title: '冷却管路渗漏处理', source: 'report', alarmId: null, reportId: null,
    faultType: '机械', level: '一般', faultDesc: '冷却管路接头渗漏，流量下降。',
    status: '待验收', assignee: '周强', assigneeGroup: '机修班', reporter: '张三',
    createdAt: '2026-09-15 09:30', assignedAt: '2026-09-15 09:40', startedAt: '2026-09-15 10:00', submittedAt: '2026-09-15 11:20', acceptedAt: null,
    slaHours: 24, slaDueAt: '2026-09-16 09:30',
    downtimeFactId: 'DT-20260915-903', downtimeDuringRepair: false,
    measures: '更换冷却管路接头并加压检漏，清洗过滤网。', verification: '加压 0.8 MPa 保压 30 分钟无渗漏；流量恢复至 24 L/min。',
    laborHours: 1.3,
    parts: [{ spareCode: '120003', spareName: '备件三', qty: 2, warehouseId: '仓库二', outboundId: 'OB-20260915-002' }],
    timeline: [
      { type: '创建', time: '2026-09-15 09:30', actor: '张三', detail: '人工报修生成' },
      { type: '派工', time: '2026-09-15 09:40', actor: '王强', detail: '派工至机修班 周强' },
      { type: '开工', time: '2026-09-15 10:00', actor: '周强', detail: '开始更换接头' },
      { type: '领料', time: '2026-09-15 10:20', actor: '周强', detail: '备件三 ×2（仓库二）' },
      { type: '提交', time: '2026-09-15 11:20', actor: '周强', detail: '提交验收：更换接头并检漏通过' },
    ],
    acceptance: null, reworkCount: 0,
  },
  {
    repairOrderId: 'RO-20260910-003', code: 'RO-20260910-003', deviceId: 'DEV-004', deviceName: '数控铲齿机-04', deviceCode: 'MT2024A1204',
    title: '润滑油压低报警处理', source: 'alarm', alarmId: 'ALM-20260910-000', reportId: null,
    faultType: '液压', level: '一般', faultDesc: '润滑油压低于 0.15 MPa，润滑泵吸空。',
    status: '已完成', assignee: '赵强', assigneeGroup: '机修班', reporter: '系统',
    createdAt: '2026-09-10 08:40', assignedAt: '2026-09-10 08:50', startedAt: '2026-09-10 09:00', submittedAt: '2026-09-10 10:10', acceptedAt: '2026-09-10 10:40',
    slaHours: 24, slaDueAt: '2026-09-11 08:40',
    downtimeFactId: 'DT-20260910-904', downtimeDuringRepair: true,
    measures: '清洗润滑油泵吸油口，补充润滑油至标准液位。', verification: '油压恢复至 0.32 MPa，运行 2 小时稳定。',
    laborHours: 1.2,
    parts: [{ spareCode: '120001', spareName: '备件一', qty: 1, warehouseId: '备品备件仓库', outboundId: 'OB-20260910-003' }],
    timeline: [
      { type: '创建', time: '2026-09-10 08:40', actor: '系统', detail: '由报警转维修生成' },
      { type: '派工', time: '2026-09-10 08:50', actor: '王强', detail: '派工至机修班 赵强' },
      { type: '开工', time: '2026-09-10 09:00', actor: '赵强', detail: '开始处理润滑系统' },
      { type: '提交', time: '2026-09-10 10:10', actor: '赵强', detail: '提交验收' },
      { type: '验收通过', time: '2026-09-10 10:40', actor: '王强', detail: '油压恢复稳定，验收通过，设备恢复生产' },
    ],
    acceptance: { result: '通过', opinion: '油压恢复稳定，同意验收。', acceptanceTime: '2026-09-10 10:40', acceptor: '王强' },
    reworkCount: 0,
  },
];

// 验收记录（RepairAcceptance）—— 已完成工单的验收留痕
export const repairAcceptances = [
  { acceptanceId: 'AC-20260910-001', repairOrderId: 'RO-20260910-003', result: '通过', opinion: '油压恢复稳定，同意验收。', acceptanceTime: '2026-09-10 10:40', acceptor: '王强', deviceRestored: true, alarmClosedBy: 'ALM-20260910-000 随验收自动恢复关闭' },
];
