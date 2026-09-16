import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Space, Input, Select, Tree, App, Modal, Form, DatePicker, Upload, Tag } from 'antd';
import { Upload as UploadIcon, Plus, Download, Printer, Pencil, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatusTag from '../components/StatusTag.jsx';
import EmptyState from '../components/EmptyState.jsx';
import DataSourceBadge from '../components/DataSourceBadge.jsx';
import { useDemoState } from '../state/DemoStore.jsx';
import { selectDevice, selectRealtime, selectHealth, selectBinding } from '../state/selectors.js';

// 设备台账列表：数据来自 devicesById + crosswalk（§3.1 唯一映射）。
// 行点击进入 /device-ledger/detail/:deviceId；新增/编辑为演示弹窗（不落快照）。
export default function DeviceLedgerPage() {
  const navigate = useNavigate();
  const state = useDemoState();
  const { message, modal } = App.useApp();
  const [searchParams] = useSearchParams();
  const meta = state.meta;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null=新增，对象=编辑
  const [kw, setKw] = useState('');
  const [lifecycle, setLifecycle] = useState(null);
  const [workshop, setWorkshop] = useState(null);

  const rows = useMemo(() => Object.values(state.entities.devicesById).map((d) => {
    const device = selectDevice(state, d.deviceId);
    const binding = selectBinding(state, d.deviceId);
    const health = selectHealth(state, d.deviceId);
    const realtime = selectRealtime(state, d.deviceId);
    const lifecycleOnly = device.lifecycleStatus !== '在用';
    return {
      deviceId: d.deviceId,
      assetCode: device.assetCode,
      name: device.name,
      model: device.model,
      type: device.type,
      brand: device.brand,
      organizationId: device.organizationId,
      workshopName: device.workshopName,
      lineName: device.lineName,
      stationName: device.stationName,
      lifecycleStatus: device.lifecycleStatus,
      owner: device.owner,
      enableDate: device.enableDate,
      assetNo: device.assetNo,
      oeeEligible: device.oeeEligible,
      bindingStatus: binding?.configStatus || '未配置',
      healthStatus: lifecycleOnly ? null : health.status,
      runStatus: lifecycleOnly ? null : realtime.runStatus,
    };
  }), [state]);

  // 旧入口兼容：?code=资产编码 或 ?deviceId= 打开编辑弹窗
  useEffect(() => {
    const code = searchParams.get('code');
    const qDeviceId = searchParams.get('deviceId');
    if (!code && !qDeviceId) return;
    const hit = rows.find(r => r.assetCode === code || r.deviceId === qDeviceId);
    if (hit) { setEditing(hit); setModalOpen(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const workshops = useMemo(() => [...new Set(rows.map(r => r.workshopName).filter(Boolean))], [rows]);
  const lifecycles = useMemo(() => [...new Set(rows.map(r => r.lifecycleStatus).filter(Boolean))], [rows]);

  const filtered = rows
    .filter(r => !lifecycle || r.lifecycleStatus === lifecycle)
    .filter(r => !workshop || r.workshopName === workshop)
    .filter(r => {
      const k = kw.trim().toLowerCase();
      if (!k) return true;
      return [r.assetCode, r.name, r.model, r.owner].some(v => (v || '').toLowerCase().includes(k));
    });

  // 设备类型树：由台账数据派生，不使用静态业务数组
  const typeTree = useMemo(() => {
    const types = [...new Set(rows.map(r => r.type).filter(Boolean))];
    return [
      { title: '全部设备', key: 'all' },
      ...types.map(t => ({ title: t, key: t })),
    ];
  }, [rows]);

  const openModal = (record) => { setEditing(record || null); setModalOpen(true); };

  const confirmDelete = (record) => modal.confirm({
    title: '删除设备档案',
    content: record
      ? `确定删除设备档案「${record.name}（${record.assetCode}）」吗？删除后数据不可恢复。`
      : '确定删除选中的设备档案吗？删除后数据不可恢复。',
    okText: '删除', okButtonProps: { danger: true }, cancelText: '取消',
    onOk: () => message.info('演示快照模式：台账删除不生效，重置演示可恢复初始数据'),
  });

  const columns = [
    { title: '资产编号', dataIndex: 'assetCode', width: 130 },
    { title: '设备名称', dataIndex: 'name', width: 130 },
    { title: '规格型号', dataIndex: 'model', width: 100, render: v => v || '--' },
    { title: '组织', dataIndex: 'organizationId', width: 110, render: v => v || '--' },
    { title: '车间', dataIndex: 'workshopName', width: 100, render: v => v || '--' },
    { title: '产线', dataIndex: 'lineName', width: 100, render: v => v || '--' },
    { title: '生命周期', dataIndex: 'lifecycleStatus', width: 100, render: v => <StatusTag value={v} /> },
    {
      title: '运行状态', dataIndex: 'runStatus', width: 100,
      render: (v, r) => (r.lifecycleStatus === '在用'
        ? <StatusTag value={v} />
        : <StatusTag value={null} tip="停用/报废设备不参与运行监测" />),
    },
    { title: '通信健康', dataIndex: 'healthStatus', width: 100, render: (v, r) => (r.lifecycleStatus === '在用' ? <StatusTag value={v} /> : <StatusTag value={null} />) },
    { title: '绑定状态', dataIndex: 'bindingStatus', width: 100, render: v => <StatusTag value={v} /> },
    { title: 'OEE统计', width: 90, render: (_, r) => <Tag color={r.oeeEligible ? 'success' : 'default'}>{r.oeeEligible ? '是' : '否'}</Tag> },
    { title: '工位', dataIndex: 'stationName', width: 90, render: v => v || '--' },
    { title: '设备负责人', dataIndex: 'owner', width: 100, render: v => v || '--' },
    { title: '启用日期', dataIndex: 'enableDate', width: 100, render: v => v || '--' },
    {
      title: '操作', width: 200, fixed: 'right',
      render: (_, r) => (
        <Space size={4} onClick={e => e.stopPropagation()}>
          <Button type="link" size="small" onClick={() => navigate(`/device-ledger/detail/${r.deviceId}`)}>详情</Button>
          <Button type="link" size="small" onClick={() => openModal(r)}>编辑</Button>
          <Button type="link" size="small" danger onClick={() => confirmDelete(r)}>删除</Button>
          <Button type="link" size="small" onClick={() => navigate(`/device-ledger/net-config?deviceId=${r.deviceId}`)}>联网配置</Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="设备台账"
        subtitle={`演示快照更新于 ${meta.updatedAt || '--'} · 台账↔监测映射由 crosswalk 统一解析 · 新增/编辑为弹窗（演示不落库）`}
        actions={<DataSourceBadge meta={meta} />}
      />
      <div style={{ display: 'flex', gap: 12 }}>
        <Card size="small" title="设备类型" style={{ width: 200, flexShrink: 0 }}>
          <Tree
            defaultExpandAll
            defaultSelectedKeys={['all']}
            treeData={typeTree}
            onSelect={(keys) => setKw(keys[0] && keys[0] !== 'all' ? keys[0] : '')}
          />
        </Card>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Card size="small" style={{ marginBottom: 12 }}>
            <Space wrap>
              <Select style={{ width: 130 }} placeholder="生命周期" allowClear value={lifecycle} onChange={setLifecycle} options={lifecycles.map(v => ({ value: v, label: v }))} />
              <Select style={{ width: 130 }} placeholder="车间" allowClear value={workshop} onChange={setWorkshop} options={workshops.map(v => ({ value: v, label: v }))} />
              <Input style={{ width: 200 }} placeholder="资产编号 / 名称 / 型号 / 负责人" allowClear value={kw} onChange={e => setKw(e.target.value)} />
              <Button type="primary" onClick={() => message.info('列表已按当前条件实时筛选')}>查询</Button>
              <Button onClick={() => { setLifecycle(null); setWorkshop(null); setKw(''); }}>重置</Button>
            </Space>
          </Card>
          <Card size="small" style={{ marginBottom: 12 }}>
            <Space wrap>
              <Button type="primary" icon={<Plus size={14} />} onClick={() => openModal(null)}>新增</Button>
              <Button icon={<Printer size={14} />}>打印二维码</Button>
              <Button icon={<UploadIcon size={14} />}>导入</Button>
              <Button icon={<Download size={14} />}>导出</Button>
              <Button icon={<Pencil size={14} />} onClick={() => openModal(rows[0] || null)}>编辑</Button>
              <Button danger icon={<Trash2 size={14} />} onClick={() => confirmDelete(null)}>删除</Button>
            </Space>
          </Card>
          <Card size="small">
            <Table
              rowKey="deviceId" size="small" scroll={{ x: 1500 }}
              rowSelection={{ columnWidth: 40 }}
              dataSource={filtered}
              onRow={(r) => ({ onClick: () => navigate(`/device-ledger/detail/${r.deviceId}`), style: { cursor: 'pointer' } })}
              locale={{ emptyText: <EmptyState description="没有匹配筛选条件的设备" reason="请调整生命周期 / 车间 / 关键字筛选" next="重置筛选" onNext={() => { setLifecycle(null); setWorkshop(null); setKw(''); }} nextLabel="重置筛选" /> }}
              columns={columns}
              pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
            />
          </Card>
        </div>
      </div>

      {/* 新增/编辑设备档案（演示弹窗：不修改演示快照中的台账事实） */}
      <Modal
        title={editing ? `编辑设备档案（${editing.assetCode}）` : '新增设备档案'}
        width={860}
        open={modalOpen}
        destroyOnClose
        onCancel={() => setModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)}>取消</Button>,
          <Button key="ok" type="primary" onClick={() => { setModalOpen(false); message.info('演示快照模式：台账编辑不保存，重置演示可恢复初始数据'); }}>确认</Button>,
        ]}
      >
        <Form labelCol={{ span: 6 }} wrapperCol={{ span: 16 }} labelWrap initialValues={editing || {}} style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
          <Form.Item label="资产编号" required><Input value={editing ? editing.assetCode : '新增由平台生成（演示）'} disabled /></Form.Item>
          <Form.Item label="设备名称" name="name" required><Input placeholder="请输入设备名称" /></Form.Item>
          <Form.Item label="设备类型" name="type">
            <Select placeholder="请选择设备类型" options={[...new Set(rows.map(r => r.type).filter(Boolean))].map(v => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item label="规格型号" name="model"><Input placeholder="请输入规格型号" /></Form.Item>
          <Form.Item label="品牌" name="brand"><Input placeholder="请输入品牌" /></Form.Item>
          <Form.Item label="车间" name="workshopName"><Input placeholder="请输入车间" /></Form.Item>
          <Form.Item label="产线" name="lineName"><Input placeholder="请输入产线" /></Form.Item>
          <Form.Item label="设备负责人" name="owner"><Input placeholder="请输入设备负责人" /></Form.Item>
          <Form.Item label="生命周期" name="lifecycleStatus">
            <Select placeholder="请选择生命周期" options={['在用', '闲置', '停用', '报废/归档'].map(v => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item label="资产编号（档案）" name="assetNo"><Input placeholder="请输入资产编号" /></Form.Item>
          <Form.Item label="采购日期" name="buyDate"><DatePicker style={{ width: '100%' }} placeholder="请选择日期" /></Form.Item>
          <Form.Item label="启用日期" name="enableDate"><DatePicker style={{ width: '100%' }} placeholder="请选择日期" /></Form.Item>
          <Form.Item label="设备图片"><Upload maxCount={5}><Button>上传图片</Button></Upload></Form.Item>
          <Form.Item label="备注"><Input.TextArea rows={2} placeholder="请输入备注" /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
