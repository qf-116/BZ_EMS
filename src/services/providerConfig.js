const STORAGE_KEY = 'dms-data-provider-mode';

export function getProviderMode() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'api' ? 'api' : 'demo';
  } catch {
    return 'demo';
  }
}

export function setProviderMode(mode) {
  const next = mode === 'api' ? 'api' : 'demo';
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // 存储不可用时保持当前内存模式，不阻断页面操作。
  }
  return next;
}

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
}

export function isApiProviderEnabled() {
  return getProviderMode() === 'api' && Boolean(getApiBaseUrl());
}
