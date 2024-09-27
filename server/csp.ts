import { NONCE } from 'hono/secure-headers';

const MODE = process.env.NODE_ENV === 'test' ? 'development' : process.env.NODE_ENV;

// CSP Constants
const SELF = "'self'";
const STRICT_DYNAMIC = "'strict-dynamic'";
const UNSAFE_INLINE = "'unsafe-inline'";
const DATA = 'data:';
const NONE = "'none'";
const UNSAFE_EVAL = "'unsafe-eval'";
const HTTPS = 'https:';

export function createCSP(reportOnly: boolean) {
  const csp = {
    objectSrc: [NONE],
    baseUri: [NONE],
    // prettier-ignore
    connectSrc: [
      MODE === 'development' ? 'ws:' : null,
      process.env.SENTRY_DSN ? '*.sentry.io' : null, "'self'"
    ].filter(Boolean) as string[],
    frameSrc: [SELF],
    fontSrc: [SELF, 'https://fonts.gstatic.com'],
    imgSrc: [SELF, DATA],
    scriptSrc: [NONCE, UNSAFE_INLINE, UNSAFE_EVAL, STRICT_DYNAMIC, NONCE, HTTPS],
    styleSrc: [SELF, UNSAFE_INLINE, 'https://fonts.googleapis.com'],
    reportTo: "'endpoint-1'",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
  if (!reportOnly) {
    csp.upgradeInsecureRequests = 1;
  }
  if (process.env.CSP_REPORT_TO) {
    csp.reportUri = process.env.CSP_REPORT_TO;
  }
  return csp;
}
