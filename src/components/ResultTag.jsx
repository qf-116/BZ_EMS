import React from 'react';
import { Tag } from 'antd';

const colorMap = {
  '启用': 'success', '已发布': 'success', '通过': 'success', '一致': 'success', '已完成': 'success', '成功': 'success', '正常': 'success', '支持': 'success', '联调完成': 'success',
  '停用': 'default', '已归档': 'default', '未关联': 'default', '不适用': 'default', '无': 'default', '未配置': 'default', '未上报': 'default', '待确认': 'warning', '联调中': 'warning', '待验收': 'warning', '待配置': 'warning',
  '参数不一致': 'warning', '重要': 'warning', '一般': 'gold', '处理中': 'processing', '比对失败': 'error', '紧急': 'error', '不支持': 'error', '失败': 'error',
};

export default function ResultTag({ value }) {
  return <Tag color={colorMap[value] || 'default'}>{value}</Tag>;
}
