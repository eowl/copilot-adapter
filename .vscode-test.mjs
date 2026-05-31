import { defineConfig } from '@vscode/test-cli';

export default defineConfig([
  {
    files: 'test/**/*.test.ts',
    mocha: {
      require: ['ts-node/register'],
      timeout: 20_000,
    },
    env: {
      TS_NODE_PROJECT: 'tsconfig.test.json',
    },
    workspaceFolder: '.',
  },
]);
