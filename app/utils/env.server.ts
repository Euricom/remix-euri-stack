/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-var */
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test'] as const),
  SESSION_SECRET: z.string(),
  // If you plan on using Sentry, uncomment this line
  // SENTRY_DSN: z.string(),
  ALLOW_INDEXING: z.enum(['true', 'false']).optional(),
  CSP_REPORT_ONLY: z.enum(['true', 'false']).optional(),
  CSP_REPORT_TO: z.string().optional(),
});

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof schema> {}
  }
}

export function init() {
  const parsed = schema.safeParse(process.env);

  if (parsed.success === false) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);

    throw new Error('Invalid environment variables');
  }
}

/**
 * This is used in both `entry.server.ts` and `root.tsx` to ensure that
 * the environment variables are set and globally available before the app is
 * started.
 *
 * NOTE: Do *not* add any environment variables in here that you do not wish to
 * be included in the client.
 * @returns all public ENV variables
 */
export function getEnv() {
  return {
    MODE: process.env.NODE_ENV,
    SENTRY_DSN: process.env.SENTRY_DSN,
    ALLOW_INDEXING: process.env.ALLOW_INDEXING,
  };
}

type ENV = ReturnType<typeof getEnv>;

declare global {
  var ENV: ENV;
  interface Window {
    ENV: ENV;
  }
}
