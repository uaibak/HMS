import type { ThemeConfig } from 'antd';

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: '#0f766e',
    colorSuccess: '#16a34a',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorInfo: '#0284c7',
    colorBgBase: '#f4f7fb',
    colorTextBase: '#0f172a',
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 10,
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
    fontSize: 14,
    fontSizeHeading1: 34,
    fontSizeHeading2: 28,
    fontSizeHeading3: 22,
    boxShadow:
      '0 1px 2px rgba(15, 23, 42, 0.05), 0 8px 24px rgba(15, 23, 42, 0.06)',
    boxShadowSecondary:
      '0 1px 2px rgba(15, 23, 42, 0.03), 0 4px 12px rgba(15, 23, 42, 0.05)',
  },
  components: {
    Layout: {
      bodyBg: '#f4f7fb',
      headerBg: '#ffffff',
      siderBg: '#0f172a',
      triggerBg: '#0f172a',
      triggerColor: '#e2e8f0',
    },
    Menu: {
      darkItemBg: '#0f172a',
      darkItemColor: '#94a3b8',
      darkItemSelectedBg: '#134e4a',
      darkItemSelectedColor: '#f0fdfa',
      darkItemHoverColor: '#e2e8f0',
      darkSubMenuItemBg: '#111827',
      itemBorderRadius: 10,
    },
    Card: {
      borderRadiusLG: 16,
      headerFontSize: 16,
    },
    Table: {
      borderColor: '#e2e8f0',
      headerBg: '#f8fafc',
      headerColor: '#334155',
      rowHoverBg: '#f1f5f9',
    },
    Button: {
      borderRadius: 10,
      controlHeight: 38,
    },
    Input: {
      borderRadius: 10,
      controlHeight: 38,
    },
    Select: {
      borderRadius: 10,
      controlHeight: 38,
    },
    Modal: {
      borderRadiusLG: 16,
    },
    Tag: {
      borderRadiusSM: 999,
    },
  },
};
