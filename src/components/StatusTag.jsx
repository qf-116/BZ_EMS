// ============================================================
// 统一状态标签：设备状态轴 / 报警状态 / 通信健康 / 绑定配置（§8.2 字典统一）
// ============================================================

import React from 'react';
import { Tag, Tooltip } from 'antd';

const COLOR_MAP = {
  // 通信健康 / 接入
  正常: 'success', 延迟: 'processing', 部分中断: 'warning', 数据中断: 'error',
  恢复中: 'processing', 补偿中: 'processing', 未知: 'default',
  // 绑定配置
  未配置: 'default', 草稿: 'default', 校验中: 'processing', 校验通过: 'processing',
  待生效: 'warning', 已启用: 'success', 换绑中: 'processing', 已停用: 'default',
  // 运行状态
  运行: 'success', 待机: 'processing', 计划停机: 'warning', 故障: 'error', 故障停机: 'error',
  维修中: 'processing', 无数据: 'default',
  // 报警状态
  已触发: 'error', 已确认: 'orange', 处理中: 'processing', 已恢复待关闭: 'warning', 已关闭: 'default',
  // 维修状态
  待派工: 'warning', 已派工: 'processing', 挂起: 'warning', 待验收: 'orange', 已完成: 'success', 已取消: 'default',
  // 点检 / 保养 / 巡检任务状态（演示模块）
  待执行: 'processing', 进行中: 'processing', 已逾期: 'error',
  // 生命周期
  在用: 'success', 闲置: 'warning', 停用: 'default', '报废/归档': 'default',
  // 库存
  低于安全库存: 'error', 超过最大库存: 'warning',
  // 接入任务
  成功: 'success', 失败: 'error', 重试中: 'processing', 部分成功: 'warning',
};

export default function StatusTag({ value, tip }) {
  if (value === null || value === undefined || value === '--') {
    return <Tag>--</Tag>; // 无数据 ≠ 0
  }
  const tag = <Tag color={COLOR_MAP[value] || 'default'}>{value}</Tag>;
  return tip ? <Tooltip title={tip}>{tag}</Tooltip> : tag;
}
