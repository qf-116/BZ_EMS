// ============================================================
// 设备资产领域层（纯 JS：枚举、校验、状态轴；禁止引用 React / antd / localStorage）
// 设计依据：device-management-standard-development-design.md §3.2
// ============================================================

// 资产生命周期轴（与绑定/通信/运行/维修/生产各状态轴严格分离）
export const LIFECYCLE_STATUS = ['草稿', '在用', '闲置', '停用', '报废/归档'];

// 绑定配置轴
export const BINDING_CONFIG_STATUS = ['未配置', '草稿', '校验中', '校验通过', '待生效', '已启用', '换绑中', '已停用'];

// 通信健康轴（健康状态不覆盖绑定配置状态）
export const COMM_HEALTH = ['正常', '延迟', '部分中断', '数据中断', '恢复中', '补偿中', '未知'];

// 运行状态轴
export const RUN_STATUS = ['运行', '待机', '计划停机', '故障停机', '维修中', '无数据'];

// 维修锁定轴
export const REPAIR_LOCK = ['可维修', '维修中', '待验收'];

// 生产可用性轴
export const PRODUCTION_STATUS = ['可生产', '计划停机', '故障停机', '待料', '未配置'];

// 「无数据/未配置」与数字 0 的显式区分（硬规则 6）
export const NULLISH = '--';

export function isNullish(v) {
  return v === null || v === undefined || v === NULLISH;
}

// 由 crosswalk 得到展示口径（所有页面只传 deviceId，展示字段经此解析）
export function displayDevice(crosswalk, device) {
  if (!crosswalk || !device) return null;
  return {
    deviceId: device.deviceId,
    assetCode: crosswalk.assetCode,
    monitorCode: crosswalk.monitorCode,
    name: device.name,
    model: device.model,
    type: device.type,
    location: [device.workshopName, device.lineName, device.stationName].filter(Boolean).join(' / '),
  };
}

// 设备生产可用性推导：绑定未启用 → 未配置；健康数据中断 → 未配置（不可误判为运行）
export function productionStatus(device, binding, health) {
  if (!binding || binding.configStatus !== '已启用') return '未配置';
  if (health && (health.status === '数据中断')) return '未配置';
  if (device && device.currentRunStatus === '计划停机') return '计划停机';
  if (device && device.currentRunStatus === '故障停机') return '故障停机';
  if (device && device.currentRunStatus === '无数据') return '未配置';
  return '可生产';
}
