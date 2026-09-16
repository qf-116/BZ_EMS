// ============================================================
// 持久化（§4.2）：可序列化业务快照写入 localStorage 键 dms-demo:state
// 解析失败 / 版本不兼容 / 存储不可用 → 回初始快照并给出明确演示提示
// 不把临时弹窗、输入草稿（bindingDraftsByDeviceId 除外，属绑定业务草稿）和分页写入
// ============================================================

import { createDemoState, STORE_VERSION } from '../data/demo/index.js';

const STORAGE_KEY = 'dms-demo:state';

export function loadDemoState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: null, notice: null };
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== STORE_VERSION) {
      return { state: null, notice: '演示快照版本已更新，已恢复初始剧本状态' };
    }
    return { state: parsed, notice: null };
  } catch {
    return { state: null, notice: '演示快照解析失败，已恢复初始剧本状态' };
  }
}

export function saveDemoState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch {
    // 存储不可用时保持内存态，页面继续展示当前操作结果（演示模式允许）
    return { ok: false };
  }
}

export function clearDemoState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* 存储不可用时忽略 */ }
}

export function resetDemo() {
  clearDemoState();
  return createDemoState();
}
