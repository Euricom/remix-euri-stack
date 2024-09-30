/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import { resolve } from 'path';
import { PassThrough } from 'node:stream';
import chalk from 'chalk';
import * as Sentry from '@sentry/remix';

import type { ActionFunctionArgs, HandleDocumentRequestFunction, LoaderFunctionArgs } from '@remix-run/node';
import { createReadableStreamFromReadable } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import FSBackend from 'i18next-fs-backend';
import { getEnv, init } from './utils/env.server';
import { NonceProvider } from './utils/nonce-provider';
import { i18n } from './utils/i18n.ts';
import { i18next } from './utils/i18next.server.ts';

const ABORT_DELAY = 5_000;

init();
global.ENV = getEnv();

type DocRequestArgs = Parameters<HandleDocumentRequestFunction>;

export default async function handleRequest(...args: DocRequestArgs) {
  const [request, responseStatusCode, responseHeaders, remixContext, loadContext] = args;
  // responseHeaders.set("fly-region", process.env.FLY_REGION ?? "unknown");
  // responseHeaders.set("fly-app", process.env.FLY_APP_NAME ?? "unknown");

  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    responseHeaders.append('Document-Policy', 'js-profiling');
  }

  const callbackName = isbot(request.headers.get('user-agent')) ? 'onAllReady' : 'onShellReady';

  // First, we create a new instance of i18next so every request will have a
  // completely unique instance and not share any state
  const i18nInstance = createInstance();
  // Then we could detect locale from the request
  const lng = await i18next.getLocale(request);
  // And here we detect what namespaces the routes about to render want to use
  const ns = i18next.getRouteNamespaces(remixContext);

  console.log('lng', lng, ns);

  await i18nInstance
    .use(initReactI18next)
    .use(FSBackend)
    .init({
      ...i18n,
      lng,
      ns,
      backend: {
        loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json'),
      },
    });

  const nonce = loadContext.cspNonce?.toString() ?? '';
  return new Promise((resolve, reject) => {
    let didError = false;
    // NOTE: this timing will only include things that are rendered in the shell
    // and will not include suspended components and deferred loaders
    // const timings = makeTimings("render", "renderToPipeableStream");

    const { pipe, abort } = renderToPipeableStream(
      <NonceProvider value={nonce}>
        <I18nextProvider i18n={i18nInstance}>
          <RemixServer context={remixContext} url={request.url} nonce={nonce} />
        </I18nextProvider>
      </NonceProvider>,
      {
        [callbackName]: () => {
          const body = new PassThrough();
          responseHeaders.set('Content-Type', 'text/html');

          // responseHeaders.append("Server-Timing", timings.toString());
          resolve(
            new Response(createReadableStreamFromReadable(body), {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            }),
          );
          pipe(body);
        },
        onShellError: (err: unknown) => {
          reject(err);
        },
        onError: () => {
          didError = true;
        },
        nonce,
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

export async function handleDataRequest(response: Response) {
  // response.headers.set("fly-region", process.env.FLY_REGION ?? "unknown");
  // response.headers.set("fly-app", process.env.FLY_APP_NAME ?? "unknown");
  return response;
}

export function handleError(error: unknown, { request }: LoaderFunctionArgs | ActionFunctionArgs): void {
  // Skip capturing if the request is aborted as Remix docs suggest
  // Ref: https://remix.run/docs/en/main/file-conventions/entry.server#handleerror
  if (request.signal.aborted) {
    return;
  }
  if (error instanceof Error) {
    console.error(chalk.red(error.stack));
    void Sentry.captureRemixServerException(error, 'remix.server', request, true);
  } else {
    console.error(error);
    Sentry.captureException(error);
  }
}
