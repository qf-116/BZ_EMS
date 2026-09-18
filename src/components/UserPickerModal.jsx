import React, { useMemo, useState } from 'react';
import { Modal, Table, Input, Tag } from 'antd';
import { Search } from 'lucide-react';
import { users } from '../data/demo/masterData.js';

// 人员选择弹窗：主数据来自三方（demo/masterData.js），单选后回填表单
export default function UserPickerModal({ open, title = '选择人员', onCancel, onSelect }) {
  const [kw, setKw] = useState('');

  const rows = useMemo(() => users.filter(u => {
    const k = kw.trim().toLowerCase();
    if (!k) return true;
    return [u.userId, u.name, u.dept, u.role].some(v => (v || '').toLowerCase().includes(k));
  }), [kw]);

  const columns = [
    { title: '工号', dataIndex: 'userId', width: 90 },
    { title: '姓名', dataIndex: 'name', width: 90, render: (v) => <b>{v}</b> },
    { title: '部门', dataIndex: 'dept', width: 110 },
    { title: '岗位', dataIndex: 'role', width: 110 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v) => <Tag color={v === '在职' ? 'success' : 'default'}>{v}</Tag>,
    },
  ];

  return (
    <Modal
      title={title}
      width={560}
      open={open}
      footer={null}
      onCancel={onCancel}
      destroyOnClose
    >
      <Input
        allowClear
        prefix={<Search size={14} />}
        placeholder="搜索工号 / 姓名 / 部门 / 岗位"
        style={{ marginBottom: 12 }}
        value={kw}
        onChange={(e) => setKw(e.target.value)}
      />
      <Table
        rowKey="userId"
        size="small"
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 6, showTotal: t => `共 ${t} 人` }}
        onRow={(r) => ({
          onClick: () => onSelect(r),
          style: { cursor: 'pointer' },
        })}
      />
    </Modal>
  );
}
