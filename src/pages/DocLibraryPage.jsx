import React from 'react';
import { Table, Tag, Button, Space, Select, Input, Upload, Card } from 'antd';
import { Download, FileText } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { docLibrary } from '../data/standardData.js';

export default function DocLibraryPage() {
  return (
    <>
      <PageHeader
        title="综合文档库"
        subtitle="技术资料 · 操作规程 · 维修手册 · 合同附件"
      />
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap>
          <Select defaultValue="all" style={{ width: 140 }} options={[{ value: 'all', label: '全部类型' }, { value: 'tech', label: '技术资料' }, { value: 'sop', label: '操作规程' }, { value: 'repair', label: '维修手册' }]} />
          <Select defaultValue="all" style={{ width: 150 }} options={[{ value: 'all', label: '全部设备' }, { value: 'cnc', label: 'CNC加工中心' }, { value: 'laser', label: '激光焊接机' }]} />
          <Input.Search placeholder="文档名称" style={{ width: 200 }} />
          <Button type="primary">查询</Button>
        </Space>
      </Card>
      <Space wrap style={{ marginBottom: 12 }}>
        <Upload><Button type="primary" icon={<FileText size={14} />}>上传文档</Button></Upload>
      </Space>
      <Table rowKey="code" size="small" dataSource={docLibrary} columns={[
        { title: '文档编号', dataIndex: 'code', width: 100 },
        { title: '文档名称', dataIndex: 'name', render: v => <Button type="link" size="small" style={{ padding: 0 }} icon={<FileText size={13} />}>{v}</Button> },
        { title: '类型', dataIndex: 'type', width: 100, render: v => <Tag>{v}</Tag> },
        { title: '关联设备', dataIndex: 'device', width: 130 },
        { title: '版本', dataIndex: 'version', width: 70 },
        { title: '更新人', dataIndex: 'updater', width: 90 },
        { title: '更新日期', dataIndex: 'updateDate', width: 110 },
        { title: '大小', dataIndex: 'size', width: 90 },
        { title: '操作', width: 80, render: () => <Button size="small" type="link" icon={<Download size={13} />}>下载</Button> },
      ]} />
    </>
  );
}
