import { createProviderState } from './provider.js';

const PREFIX = 'dms-demo:';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Demo 模式允许在存储不可用时退回内存态，由页面继续展示当前操作结果。
  }
  return value;
}

export function readDemoValue(key, fallback) {
  return read(key, fallback);
}

export function writeDemoValue(key, value) {
  return write(key, value);
}

export function createDemoProvider() {
  return {
    query(key, fallback) {
      return createProviderState(read(key, fallback));
    },
    mutate(key, value) {
      return createProviderState(write(key, value));
    },
  };
}

export function appendDemoRecord(key, record) {
  const records = read(key, []);
  return write(key, [...(Array.isArray(records) ? records : []), record]);
}
