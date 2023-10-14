import { defineConfig } from 'vitest/config';

import typescript from '@rollup/plugin-typescript';
// import { compileLitTemplates } from '@lit-labs/compiler';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [
        tsconfigPaths(),
        typescript({
            // This currently breaks on using ElementPart directives
            // transformers: {
            //     before: [compileLitTemplates()],
            // },
        }),
    ],
    test: {
        environment: 'jsdom',
    },
});
