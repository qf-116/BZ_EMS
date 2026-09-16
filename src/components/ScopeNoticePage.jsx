// ============================================================
// 范围外页面（§0.3 / §7.3）：点检、巡检、保养、系统管理等路径统一渲染本页，
// 说明「由宿主平台或其他业务模块提供 / 本次演示不包含」，并提供返回白名单入口。
// 不得自动跳转到可执行页面，也不得把范围外页面继续放入菜单。
// ============================================================

import React from 'react';
import { Result, Button, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';

export default function ScopeNoticePage({ title = '该页面不在本次演示范围', reason, host = null }) {
  const navigate = useNavigate();
  return (
    <Result
      status="info"
      title={title}
      subTitle={
        <Space direction="vertical" size={4} style={{ textAlign: 'left' }}>
          <Typography.Text type="secondary">
            {reason || '该业务域属于范围外内容：由宿主平台或其他业务模块提供，或本次演示不包含其内部流程。'}
          </Typography.Text>
          <Typography.Text type="secondary">
            依据《设备管理系统标准版开发设计方案》§0.3「明确不做」与 §7.3「范围外路由」。
          </Typography.Text>
          {host && <Typography.Text type="warning">承接方：{host}</Typography.Text>}
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ArrowLeft size={14} />} onClick={() => navigate(-1)}>返回上一页</Button>
          <Button type="primary" icon={<LayoutDashboard size={14} />} onClick={() => navigate('/')}>回到工作台</Button>
        </Space>
      }
    />
  );
}
