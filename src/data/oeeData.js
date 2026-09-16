// ============================================================
// OEE 数据层（演示数据 + 计算口径）
// 口径（与业务约定一致）：
//   负荷时间   = 运行 + 故障 + 待机 时间总和
//   可用率     = 运行时间 / (负荷时间 - 计划停机时间) × 100%
//   性能率     = 实际生产速度 / 理想生产速度 × 100%（历史页按当天各物料平均速度）
//   合格率     = 合格数量 / 生产数量 × 100%（历史页按当天各物料合计数量）
//   OEE        = 可用率 × 性能率 × 合格率
// ============================================================

// 确定性伪随机，保证演示数据在多次渲染/刷新间稳定
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round1 = (v) => Math.round(v * 10) / 10;

// OEE 统计的设备范围（与 demoData.devices 对应，便于跳转设备监测详情）
export const oeeDevices = [
  { id: 'DEV-001', code: 'MT2024A1201', name: 'CNC加工中心-01', model: 'VMC-850', type: '加工中心', dept: '一号车间' },
  { id: 'DEV-002', code: 'MT2024A1202', name: 'CNC加工中心-02', model: 'VMC-850', type: '加工中心', dept: '一号车间' },
  { id: 'DEV-003', code: 'MT2024A1204', name: '激光焊接机-03', model: 'LW-3000', type: '激光设备', dept: '一号车间' },
  { id: 'DEV-004', code: 'MT2024A1205', name: '数控铲齿机-04', model: 'YH-200T', type: '铲齿机', dept: '二号车间' },
  { id: 'DEV-005', code: 'MT2024A1206', name: '机器人焊接-05', model: 'RB-2000', type: '焊接机器人', dept: '二号车间' },
];

// ---------------- 实时 OEE（统计窗口：最近 1 小时） ----------------
export const oeeRealtimeRows = [
  // 负荷时间/计划停机/运行时间单位：分钟；速度单位：个/小时
  { device: 'DEV-001', load: 60, plannedDowntime: 5, runTime: 45, idealSpeed: 30, actualSpeed: 27, output: 40, qualified: 39 },
  { device: 'DEV-002', load: 60, plannedDowntime: 5, runTime: 42, idealSpeed: 30, actualSpeed: 25.5, output: 48, qualified: 46 },
  { device: 'DEV-003', load: 60, plannedDowntime: 5, runTime: 20, idealSpeed: 12, actualSpeed: 8, output: 8, qualified: 8 },
  { device: 'DEV-004', load: 60, plannedDowntime: 5, runTime: 18, idealSpeed: 10, actualSpeed: 6, output: 9, qualified: 8 },
  { device: 'DEV-005', load: 60, plannedDowntime: 5, runTime: 0, idealSpeed: 18, actualSpeed: 0, output: 0, qualified: 0 },
];

export const pct = (num, den) => (den > 0 ? round1((num / den) * 100) : null);

// 实时行派生指标
export function buildRealtimeRow(r) {
  const availability = pct(r.runTime, r.load - r.plannedDowntime);
  const performance = pct(r.actualSpeed, r.idealSpeed);
  const quality = pct(r.qualified, r.output);
  const oee = availability != null && performance != null && quality != null
    ? round1((availability * performance * quality) / 10000) : null;
  return { ...r, availability, performance, quality, oee };
}

// ---------------- 理想生产速度配置 ----------------
export const materialPool = [
  { code: 'XN010102-000001', name: '52S液冷电池插箱（0.5C）', model: 'XN-LM314-52S-1', idealSpeed: 30 },
  { code: 'XN010102-000002', name: '52S液冷电池插箱（1C）', model: 'XN-LM314-52S-2', idealSpeed: 24 },
  { code: 'XN020105-000003', name: '端板总成', model: 'XN-DB-2025', idealSpeed: 40 },
  { code: 'XN020301-000004', name:'侧板总成', model: 'XN-CB-3140', idealSpeed: 36 },
];

export const speedConfigs = oeeDevices.flatMap((d, di) =>
  materialPool.slice(0, di === 0 ? 4 : 2).map((m, mi) => ({
    id: `SC-${d.code}-${m.code}`,
    deviceCode: d.code,
    deviceId: d.id,
    deviceName: d.name,
    deviceModel: d.model,
    materialCode: m.code,
    materialName: m.name,
    materialModel: m.model,
    idealSpeed: m.idealSpeed,
    created: '2026-08-12 09:30',
    _di: di, _mi: mi,
  }))
);

// ---------------- 计划停机时间管理 ----------------
export const plannedDowntimes = [
  { id: 'PD-001', date: '2026-09-05', timeRange: '18:00 - 19:00', devices: 'CNC加工中心-01、CNC加工中心-02', reason: '月度计划保养' },
  { id: 'PD-002', date: '2026-09-08', timeRange: '13:30 - 14:30', devices: '数控铲齿机-04', reason: '模具更换与调试' },
  { id: 'PD-003', date: '2026-09-12', timeRange: '08:00 - 09:30', devices: '激光焊接机-03', reason: '激光器光路校准' },
  { id: 'PD-004', date: '2026-09-15', timeRange: '18:00 - 20:00', devices: '全部联网设备', reason: '车间计划停电检修' },
  { id: 'PD-005', date: '2026-09-03', timeRange: '16:00 - 16:30', devices: '机器人焊接-05', reason: '焊接参数程序切换' },
];

// ---------------- 历史 OEE（按天 × 设备，天内多物料） ----------------
export const OEE_MONTH = '2026-09';       // 统计月份（演示：当前月）
export const OEE_DAYS = 30;               // 当月天数
export const OEE_TODAY = 11;              // 今天（9 月 11 日），之后无数据

const oeeDaily = {}; // { [deviceId]: { [day]: summary } }

oeeDevices.forEach((d, di) => {
  oeeDaily[d.id] = {};
  for (let day = 1; day <= OEE_TODAY; day++) {
    const rnd = mulberry32(di * 1000 + day * 37);
    // 当天该设备生产的物料（1 ~ 3 种）
    const matCount = 1 + Math.floor(rnd() * 3);
    const materials = [];
    for (let mi = 0; mi < matCount; mi++) {
      const m = materialPool[(di + mi + day) % materialPool.length];
      const ideal = m.idealSpeed;
      const actual = round1(ideal * (0.72 + rnd() * 0.26));   // 72% ~ 98% 达理想速度
      const output = 20 + Math.floor(rnd() * 40);
      const qualified = output - Math.floor(rnd() * 4);
      materials.push({ ...m, ideal, actual, output, qualified });
    }
    // 时间口径（单位：小时）：负荷 = 运行+故障+待机；再扣计划停机
    const load = [7.5, 8, 8, 9][Math.floor(rnd() * 4)];
    const planned = [0.5, 0.5, 1, 1.5][Math.floor(rnd() * 4)];
    const run = round1((load - planned) * (0.62 + rnd() * 0.33));

    const avgIdeal = round1(materials.reduce((s, m) => s + m.ideal, 0) / materials.length);
    const avgActual = round1(materials.reduce((s, m) => s + m.actual, 0) / materials.length);
    const outputSum = materials.reduce((s, m) => s + m.output, 0);
    const qualifiedSum = materials.reduce((s, m) => s + m.qualified, 0);

    const availability = pct(run, load - planned);
    const performance = pct(avgActual, avgIdeal);
    const quality = pct(qualifiedSum, outputSum);
    const oee = round1((availability * performance * quality) / 10000);

    oeeDaily[d.id][day] = {
      day, load, planned, run, materials,
      idealSpeed: avgIdeal, actualSpeed: avgActual,
      output: outputSum, qualified: qualifiedSum,
      availability, performance, quality, oee,
    };
  }
});

export const getOeeDay = (deviceId, day) => (oeeDaily[deviceId] || {})[day] || null;
export const getOeeMonth = (deviceId) => oeeDaily[deviceId] || {};
