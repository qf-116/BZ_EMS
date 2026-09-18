import React from 'react';
import { Card, Form, Input, Button, Checkbox, Typography, Space, Tag } from 'antd';
import { Truck, Lock, User } from 'lucide-react';

// 标准版演示登录：任意输入或点击“一键演示登录”即可进入，不校验后端。
export default function LoginPage({ onLogin }) {
  const onFinish = () => onLogin({ name: '李明', role: '设备管理员' });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse 70% 50% at 20% 0%, rgba(0, 184, 212, 0.28), transparent), radial-gradient(ellipse 60% 45% at 85% 100%, rgba(64, 150, 255, 0.26), transparent), linear-gradient(160deg, #0d2a5c 0%, #122f66 55%, #182646 100%)',
    }}>
      <Card style={{ width: 380, borderRadius: 10 }} styles={{ body: { padding: '32px 32px 24px' } }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #00b8d4, #1668dc)',
            boxShadow: '0 6px 16px rgba(22, 104, 220, 0.38)',
          }}>
            <Truck color="#fff" size={26} />
          </span>
          <Typography.Title level={4} style={{ marginTop: 8, marginBottom: 0 }}>设备管理系统标准版</Typography.Title>
          <Typography.Text type="secondary">东浩智创 · 数字化设备管理平台</Typography.Text>
        </div>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ username: 'admin', password: '123456', remember: true }}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<User size={14} />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<Lock size={14} />} placeholder="密码" />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 12 }}>
            <Checkbox>记住登录</Checkbox>
          </Form.Item>
          <Button type="primary" htmlType="submit" block>登录</Button>
          <Button block style={{ marginTop: 10 }} onClick={onFinish}>一键登录</Button>
        </Form>
        <Space style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
          <Tag>账号 admin / 123456</Tag>
        </Space>
      </Card>
    </div>
  );
}
