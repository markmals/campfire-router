// import { compileLitTemplates } from '@lit-labs/compiler';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        typescript({
            // This currently breaks on using ElementPart directives
            // transformers: {
            //     before: [compileLitTemplates()],
            // },
        }),
    ],
});
