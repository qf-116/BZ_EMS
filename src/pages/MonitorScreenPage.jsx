import React from 'react';
import { Button, Pagination, Space, Tag } from 'antd';
import { Pause, Play } from 'lucide-react';
import { devices } from '../data/demoData.js';

const screenOne = Array.from({ length: 16 }, (_, i) => devices[i % devices.length]);

export default function MonitorScreenPage() {
  return (
    <div className="monitor-screen">
      <header className="screen-header">
        <div>
          <h1>设备监测大屏</h1>
          <span>最后刷新 16:41:10 · Asia/Shanghai</span>
        </div>
        <Space>
          <Button icon={<Pause size={14} />}>暂停轮播</Button>
          <Button icon={<Play size={14} />}>继续</Button>
          <Button>导出</Button>
        </Space>
      </header>
      <div className="screen-layout">
        <aside className="screen-side">
          <section className="screen-summary">
            <h2>状态分布</h2>
            <div className="screen-stat"><span>运行</span><strong>40</strong></div>
            <div className="screen-stat"><span>待机</span><strong>6</strong></div>
            <div className="screen-stat"><span>故障</span><strong>2</strong></div>
            <div className="screen-stat"><span>离线</span><strong>2</strong></div>
          </section>
          <section className="screen-summary">
            <h2>异常设备 Top 5</h2>
            {devices.map(d => <div key={d.id} className="screen-row"><span>{d.name}</span><Tag color={d.alarm > 1 ? 'error' : 'warning'}>{d.alarm > 0 ? `${d.alarm} 条报警` : d.comm === 'OFFLINE' ? '离线' : '延迟'}</Tag></div>)}
          </section>
          <section className="screen-summary">
            <h2>数据接入质量</h2>
            <div className="screen-row"><span>数据完整率</span><strong>99.62%</strong></div>
            <div className="screen-row"><span>延迟设备</span><strong>1 台</strong></div>
            <div className="screen-row"><span>死信消息</span><strong>3 条</strong></div>
          </section>
        </aside>
        <main className="device-grid">
          {screenOne.map((d, i) => (
            <article key={`${d.id}-${i}`} className="device-card">
              <div className="device-card-title">
                <strong>{d.name}</strong>
                <span>{d.code}</span>
              </div>
              <div className="device-state">
                <Tag color={d.run === 'RUN' ? 'success' : d.run === 'FAULT' ? 'error' : 'default'}>{d.run === 'RUN' ? '运行' : d.run === 'FAULT' ? '故障' : '待机'}</Tag>
                <Tag color={d.comm === 'ONLINE' ? 'processing' : d.comm === 'DELAYED' ? 'warning' : 'default'}>{d.comm === 'ONLINE' ? '在线' : d.comm === 'DELAYED' ? '延迟' : '离线'}</Tag>
              </div>
              <div className="device-lines">
                <span>润滑：{d.lubricant}</span><span>冷却：{d.coolant}</span>
                <span>报警：{d.alarm}</span><span>更新：{d.updated}</span>
              </div>
            </article>
          ))}
        </main>
      </div>
      <footer className="screen-footer">
        <span>46 台设备 · 16+16+14 三屏</span>
        <Pagination defaultCurrent={1} total={46} pageSize={16} showSizeChanger={false} />
      </footer>
    </div>
  );
}
