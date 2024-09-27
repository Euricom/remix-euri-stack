import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { type AppLoadContext, createCookieSessionStorage, type ServerBuild } from '@remix-run/node';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { remix } from 'remix-hono/handler';
import { session } from 'remix-hono/session';
import { cache } from './middlewares';
import crypto from 'node:crypto';

const mode = process.env.NODE_ENV === 'test' ? 'development' : process.env.NODE_ENV;
const IS_PROD = mode === 'production';
// const IS_DEV = mode === 'development';
// const ALLOW_INDEXING = process.env.ALLOW_INDEXING !== 'false';

const viteDevServer = IS_PROD
  ? undefined
  : await import('vite').then((vite) =>
      vite.createServer({
        server: { middlewareMode: true },
        appType: 'custom',
      }),
    );

type Variables = {
  cspNonce: string;
};

const app = new Hono<{ Variables: Variables }>();

/**
 * Serve assets files from build/client/assets
 */
app.use(
  '/assets/*',
  cache(60 * 60 * 24 * 365), // 1 year
  serveStatic({ root: './build/client' }),
);

/**
 * Serve public files
 */
app.use('*', cache(60 * 60), serveStatic({ root: IS_PROD ? './build/client' : './public' })); // 1 hour

/**
 * Add logger middleware
 */
app.use('*', logger());

/**
 * add CSP nonce
 */
app.use(async (c, next) => {
  c.set('cspNonce', crypto.randomBytes(16).toString('hex'));
  await next();
});

//
// add compression
//
// app.use(compression());

//
// add X-Robots-Tag to disable indexing
//
// if (!ALLOW_INDEXING) {
//   app.use((_, res, next) => {
//     res.set('X-Robots-Tag', 'noindex, nofollow');
//     next();
//   });
// }

// app.use(
//   helmet({
//     xPoweredBy: false,
//     referrerPolicy: { policy: 'same-origin' },
//     crossOriginEmbedderPolicy: false,
//     contentSecurityPolicy: {
//       // NOTE: Remove reportOnly when you're ready to enforce this CSP
//       reportOnly: true,
//       directives: {
//         'connect-src': [
//           MODE === 'development' ? 'ws:' : null,
//           process.env.SENTRY_DSN ? '*.sentry.io' : null,
//           "'self'",
//         ].filter(Boolean),
//         'font-src': ["'self'", 'https://fonts.gstatic.com'],
//         'frame-src': ["'self'"],
//         'img-src': ["'self'", 'data:'],
//         // @ts-expect-error
//         'script-src': ["'strict-dynamic'", "'self'", (_, res) => `'nonce-${res.locals.cspNonce}'`],
//         // @ts-expect-error
//         'script-src-attr': [(_, res) => `'nonce-${res.locals.cspNonce}'`],
//         'upgrade-insecure-requests': null,
//       } as any,
//     },
//   }),
// );

/**
 * Add session middleware (https://github.com/sergiodxa/remix-hono?tab=readme-ov-file#session-management)
 */
app.use(
  session({
    autoCommit: true,
    createSessionStorage() {
      if (!process.env.SESSION_SECRET) {
        throw new Error('SESSION_SECRET is not defined');
      }

      const sessionStorage = createCookieSessionStorage({
        cookie: {
          name: 'session',
          httpOnly: true,
          path: '/',
          sameSite: 'lax',
          secrets: [process.env.SESSION_SECRET],
          secure: process.env.NODE_ENV === 'production',
        },
      });

      return {
        ...sessionStorage,
        // If a user doesn't come back to the app within 30 days, their session will be deleted.
        async commitSession(session) {
          return sessionStorage.commitSession(session, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
          });
        },
      };
    },
  }),
);

/**
 * Add remix middleware to Hono server
 */
app.use(async (c, next) => {
  const { error, build } = await getBuild();
  if (error) throw error;
  return remix({
    build,
    mode,
    getLoadContext() {
      return {
        cspNonce: c.get('cspNonce'),
        appVersion: IS_PROD ? build.assets.version : 'dev',
      } satisfies AppLoadContext;
    },
  })(c, next);
});

/**
 * Start the production server
 */

if (IS_PROD) {
  serve(
    {
      ...app,
      port: Number(process.env.PORT) || 3000,
    },
    async (info) => {
      console.log(`🚀 Server started on http://localhost:${info.port}`);
    },
  );
}

export default app;

/**
 * Declare our loaders and actions context type
 */
declare module '@remix-run/node' {
  interface AppLoadContext {
    /**
     * The app version from the build assets
     */
    readonly appVersion: string;
  }
}

async function getBuild() {
  try {
    const build = viteDevServer
      ? await viteDevServer.ssrLoadModule('virtual:remix/server-build')
      : await import('../build/server/remix.js');

    return { build: build as unknown as ServerBuild, error: null };
  } catch (error) {
    // Catch error and return null to make express happy and avoid an unrecoverable crash
    console.error('Error creating build:', error);
    return { error: error, build: null as unknown as ServerBuild };
  }
}
