import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { envOnlyMacros } from 'vite-env-only';
import devServer from '@hono/vite-dev-server';
import { flatRoutes } from 'remix-flat-routes';
import esbuild from 'esbuild';

export default defineConfig({
  server: {
    port: 3000,
    // https://github.com/remix-run/remix/discussions/8917#discussioncomment-8640023
    warmup: {
      // prettier-ignore
      clientFiles: [
        './app/entry.client.tsx',
        './app/root.tsx',
        './app/routes/**/*'
      ],
    },
  },
  // https://github.com/remix-run/remix/discussions/8917#discussioncomment-8640023
  optimizeDeps: {
    include: ['./app/routes/**/*'],
  },
  plugins: [
    envOnlyMacros(),
    tsconfigPaths(),
    devServer({
      injectClientScript: false,
      entry: 'server/index.ts', // The file path of your server.
      exclude: [/^\/(app)\/.+/, /^\/@.+$/, /^\/node_modules\/.*/],
    }),
    // it would be really nice to have this enabled in tests, but we'll have to
    // wait until https://github.com/remix-run/remix/issues/9871 is fixed
    process.env.NODE_ENV === 'test'
      ? null
      : remix({
          future: {
            v3_fetcherPersist: true,
            v3_relativeSplatPath: true,
            v3_throwAbortReason: true,
          },
          serverBuildFile: 'remix.js',
          ignoredRouteFiles: ['**/*'],
          serverModuleFormat: 'esm',
          routes: async (defineRoutes) => {
            return flatRoutes('routes', defineRoutes, {
              ignoredRouteFiles: [
                '.*',
                '**/*.css',
                '**/*.test.{js,jsx,ts,tsx}',
                '**/__*.*',
                // This is for server-side utilities you want to colocate
                // next to your routes without making an additional
                // directory. If you need a route that includes "server" or
                // "client" in the filename, use the escape brackets like:
                // my-route.[server].tsx
                '**/*.server.*',
                '**/*.client.*',
              ],
            });
          },
          buildEnd: async () => {
            await esbuild
              .build({
                alias: { '~': './app' },
                // The final file name
                outfile: 'build/server/index.js',
                // Our server entry point
                entryPoints: ['server/index.ts'],
                // Dependencies that should not be bundled
                // We import the remix build from "../build/server/remix.js", so no need to bundle it again
                external: ['./build/server/*'],
                platform: 'node',
                format: 'esm',
                // Don't include node_modules in the bundle
                packages: 'external',
                bundle: true,
                logLevel: 'info',
              })
              .catch((error: unknown) => {
                console.error(error);
                process.exit(1);
              });
          },
        }),
  ],
  test: {
    include: ['./app/**/*.spec.{ts,tsx}'],
    setupFiles: ['./tests/setup/setup-test-env.ts'],
    globalSetup: ['./tests/setup/global-setup.ts'],
    restoreMocks: true,
    coverage: {
      include: ['app/**/*.{ts,tsx}'],
      all: true,
    },
  },
});
