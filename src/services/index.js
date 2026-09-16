import { createApiProvider, getActiveProvider } from './provider.js';
import { createDemoProvider } from './demoProvider.js';

export const apiProvider = createApiProvider();
export const demoProvider = createDemoProvider();
export const dataProvider = getActiveProvider(apiProvider, demoProvider);

export function providerMeta() {
  return {
    source: dataProvider === apiProvider ? 'api' : 'demo',
    updatedAt: new Date().toISOString(),
  };
}
