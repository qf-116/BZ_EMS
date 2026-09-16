import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App.jsx';
import './styles.css';

// 视觉基线：深青蓝主色 + 更大圆角 + 柔和投影 + 冷灰蓝底色，
// 统一提升标准版后台的整体质感（详见 styles.css 的全局样式层）。
ReactDOM.createRoot(document.getElementById('root')).render(
  <ConfigProvider
    locale={zhCN}
    theme={{
      algorithm: theme.defaultAlgorithm,
      token: {
        colorPrimary: '#0e5a74',
        colorInfo: '#0e7ea6',
        colorLink: '#0e7ea6',
        colorTextBase: '#182631',
        colorBgLayout: '#edf1f6',
        borderRadius: 8,
        borderRadiusLG: 12,
        fontSize: 13,
        fontFamily: "-apple-system, 'Segoe UI', 'PingFang SC', 'HarmonyOS Sans SC', 'Microsoft YaHei', Arial, sans-serif",
        boxShadow: '0 6px 24px rgba(13, 38, 53, 0.10)',
        boxShadowSecondary: '0 2px 8px rgba(13, 38, 53, 0.08)',
      },
      components: {
        Layout: {
          headerBg: '#ffffff',
          siderBg: '#0c2231',
          bodyBg: '#edf1f6',
        },
        Menu: {
          darkItemBg: 'transparent',
          darkSubMenuItemBg: 'transparent',
          darkPopupBg: '#0f2a3c',
          darkItemColor: 'rgba(214, 232, 240, 0.72)',
          darkItemHoverColor: '#ffffff',
          darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
          darkItemSelectedBg: '#0e5a74',
          darkItemSelectedColor: '#ffffff',
        },
        Card: {
          boxShadowTertiary: '0 1px 2px rgba(13, 38, 53, 0.04), 0 3px 14px rgba(13, 38, 53, 0.05)',
        },
        Table: {
          headerBg: '#f3f7fa',
          headerSplitColor: 'transparent',
          rowHoverBg: '#f2f8fb',
          headerBorderRadius: 10,
        },
        Button: {
          fontWeight: 500,
          primaryShadow: '0 2px 8px rgba(14, 90, 116, 0.28)',
        },
        Tag: {
          borderRadiusSM: 6,
        },
      },
    }}
  >
    <AntdApp>
      <HashRouter>
        <App />
      </HashRouter>
    </AntdApp>
  </ConfigProvider>,
);
