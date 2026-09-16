import React from 'react';
import { Table, Button } from 'antd';
import { Plus } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { baseTypes } from '../data/standardData.js';

export default function BaseTypeConfigPage() {
  return (
    <>
      <PageHeader title="基础类型配置" subtitle="设备类型、等级、故障类型等字典维护" actions={<Button type="primary" icon={<Plus size={14} />}>新增分类</Button>} />
      <Table rowKey="category" size="small" dataSource={baseTypes} columns={[
        { title: '分类', dataIndex: 'category', width: 120 },
        { title: '可选值', dataIndex: 'values' },
        { title: '项数', dataIndex: 'count', width: 80 },
        { title: '更新人', dataIndex: 'updater', width: 100 },
        { title: '更新日期', dataIndex: 'updateDate', width: 110 },
        { title: '操作', width: 120, render: () => <Button size="small" type="link">编辑</Button> },
      ]} />
    </>
  );
}
