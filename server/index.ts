import { serve, ServerType } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { type AppLoadContext, createCookieSessionStorage, type ServerBuild } from '@remix-run/node';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { remix } from 'remix-hono/handler';
import { session } from 'remix-hono/session';
import { cache } from './middlewares';
import { secureHeaders } from 'hono/secure-headers';
import { compress } from 'hono/compress';
import { poweredBy } from 'hono/powered-by';
import { createCSP } from './csp';
import closeWithGrace from 'close-with-grace';

const MODE = process.env.NODE_ENV === 'test' ? 'development' : process.env.NODE_ENV;
const IS_PROD = MODE === 'production';
const ALLOW_INDEXING = process.env.ALLOW_INDEXING !== 'false';
const CSP_REPORT_ONLY = process.env.CSP_REPORT_ONLY !== 'false';
const CSP_REPORT_TO = process.env.CSP_REPORT_TO;

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
 * add compression
 */
app.use(compress());

/**
 * add X-Robots-Tag to disable indexing
 */
if (!ALLOW_INDEXING) {
  app.use('*', (c, next) => {
    c.header('X-Robots-Tag', 'noindex, nofollow');
    return next();
  });
}

/**
 * add Content Security Policy
 */
app.use(
  '*',
  secureHeaders({
    strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
    referrerPolicy: 'same-origin',
    crossOriginEmbedderPolicy: false,
    xContentTypeOptions: false,
    xXssProtection: false,
    reportingEndpoints: CSP_REPORT_TO
      ? [
          {
            name: 'endpoint-1',
            url: CSP_REPORT_TO,
          },
        ]
      : undefined,
    contentSecurityPolicy: CSP_REPORT_ONLY ? undefined : createCSP(CSP_REPORT_ONLY),
    contentSecurityPolicyReportOnly: CSP_REPORT_ONLY ? createCSP(CSP_REPORT_ONLY) : undefined,
  }),
);
app.use('*', poweredBy());

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
    mode: MODE,
    getLoadContext() {
      return {
        cspNonce: c.get('secureHeadersNonce') || '',
        appVersion: IS_PROD ? build.assets.version : 'dev',
        /* add here more context */
      } satisfies AppLoadContext;
    },
  })(c, next);
});

/**
 * Start the production server
 */

let server: ServerType;
if (IS_PROD) {
  server = serve(
    {
      ...app,
      port: Number(process.env.PORT) || 3000,
    },
    async (info) => {
      console.log(`🚀 Server started on http://localhost:${info.port}`);
    },
  );
}

closeWithGrace(async () => {
  console.log('[Hono] Called shutdown event');
  await new Promise((resolve, reject) => {
    server?.close((e) => (e ? reject(e) : resolve('ok')));
  });
});

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
    readonly cspNonce: string;
  }
}

async function getBuild() {
  try {
    const build = viteDevServer
      ? await viteDevServer.ssrLoadModule('virtual:remix/server-build')
      : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line import/no-unresolved
        await import('../build/server/remix.js');

    return { build: build as unknown as ServerBuild, error: null };
  } catch (error) {
    // Catch error and return null to make express happy and avoid an unrecoverable crash
    console.error('Error creating build:', error);
    return { error: error, build: null as unknown as ServerBuild };
  }
}
