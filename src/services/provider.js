import { getApiBaseUrl, isApiProviderEnabled } from './providerConfig.js';

export function createProviderState(data, extra = {}) {
  return {
    data,
    loading: false,
    error: null,
    isStale: false,
    source: extra.source || 'demo',
    updatedAt: extra.updatedAt || new Date().toISOString(),
  };
}

async function request(path, options = {}) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('未配置 VITE_API_BASE_URL');
  const response = await fetch(`${base}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail || `请求失败（${response.status}）`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export function createApiProvider() {
  return {
    async query(path, options) {
      return request(path, options);
    },
    async mutate(path, options = {}) {
      return request(path, options);
    },
  };
}

export function getActiveProvider(apiProvider, demoProvider) {
  return isApiProviderEnabled() ? apiProvider : demoProvider;
}
