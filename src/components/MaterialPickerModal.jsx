import React, { useMemo, useState } from 'react';
import { Modal, Table, Input } from 'antd';
import { Search } from 'lucide-react';
import { materials } from '../data/demo/masterData.js';

// 物料/备件选择弹窗：主数据来自三方（demo/masterData.js），
// 选中后由调用方自动回填 物料编码 / 名称 / 规格型号 / 单位
export default function MaterialPickerModal({ open, title = '选择物料', onCancel, onSelect }) {
  const [kw, setKw] = useState('');

  const rows = useMemo(() => materials.filter(m => {
    const k = kw.trim().toLowerCase();
    if (!k) return true;
    return [m.code, m.name, m.spec].some(v => (v || '').toLowerCase().includes(k));
  }), [kw]);

  const columns = [
    { title: '物料编码', dataIndex: 'code', width: 100 },
    { title: '物料名称', dataIndex: 'name', width: 110, render: (v) => <b>{v}</b> },
    { title: '规格型号', dataIndex: 'spec', width: 110 },
    { title: '单位', dataIndex: 'unit', width: 70 },
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
        placeholder="搜索物料编码 / 名称 / 规格"
        style={{ marginBottom: 12 }}
        value={kw}
        onChange={(e) => setKw(e.target.value)}
      />
      <Table
        rowKey="code"
        size="small"
        columns={columns}
        dataSource={rows}
        pagination={false}
        onRow={(r) => ({
          onClick: () => onSelect(r),
          style: { cursor: 'pointer' },
        })}
      />
    </Modal>
  );
}
