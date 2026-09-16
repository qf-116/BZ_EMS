// ============================================================
// DemoStore（§4）：React 上下文封装 —— 状态、dispatch、actions、selectors 统一出口
// resetDemo 直接以初始快照替换状态（§4.2），清空 localStorage 快照。
// ============================================================

import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { createDemoState, STORE_VERSION } from '../data/demo/index.js';
import { reducer } from './reducer.js';
import { createDemoActions } from './actions.js';
import { loadDemoState, saveDemoState, clearDemoState } from './persistence.js';

const DemoStateContext = createContext(null);
const DemoActionsContext = createContext(null);

const RESET = Symbol('demo-reset');

// store 级 reducer：处理 reset 与函数式更新，业务动作交给业务 reducer
function storeReducer(prev, next) {
  if (next === RESET) return { state: createDemoState(), notice: '已重置为三个标准演示剧本的初始状态' };
  if (typeof next === 'function') return next(prev);
  return next;
}

function initStore() {
  const { state, notice } = loadDemoState();
  return { state: state || createDemoState(), notice };
}

export function DemoStoreProvider({ children }) {
  const [store, setStoreRaw] = useReducer(storeReducer, undefined, initStore);

  const dispatch = (action) => {
    if (action && action.type === 'demo/reset') {
      clearDemoState();
      setStoreRaw(RESET);
      return;
    }
    setStoreRaw((prev) => ({ ...prev, state: reducer(prev.state, action) }));
  };

  const actions = useMemo(() => createDemoActions(store.state, dispatch), [store.state]);

  // 快照持久化（§4.2）：只写业务快照，不写临时弹窗与分页
  useEffect(() => { saveDemoState(store.state); }, [store.state]);

  const value = useMemo(() => ({ ...store, dispatch }), [store]);

  return (
    <DemoStateContext.Provider value={value}>
      <DemoActionsContext.Provider value={actions}>{children}</DemoActionsContext.Provider>
    </DemoStateContext.Provider>
  );
}

export function useDemoStore() {
  const ctx = useContext(DemoStateContext);
  if (!ctx) throw new Error('useDemoStore 必须在 <DemoStoreProvider> 内使用');
  return ctx;
}

export function useDemoState() {
  return useDemoStore().state;
}

export function useDemoNotice() {
  const ctx = useContext(DemoStateContext);
  return ctx ? ctx.notice : null;
}

export function useDemoActions() {
  return useContext(DemoActionsContext);
}

export function useDemoReset() {
  return useDemoStore().dispatch; // 调用 dispatch({ type: 'demo/reset' })
}

export { STORE_VERSION };
