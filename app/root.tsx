import { json, Links, Meta, MetaFunction, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';
import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import { withSentry } from '@sentry/remix';
import { HoneypotProvider } from 'remix-utils/honeypot/react';
import appleTouchIconAssetUrl from './assets/favicons/apple-touch-icon.png';
import faviconAssetUrl from './assets/favicons/favicon.svg';
import { getEnv } from './utils/env.server';
import { useNonce } from './utils/nonce-provider';
import { Theme } from './utils/theme.server';
import { GeneralErrorBoundary } from './components/error-boundary';
import { honeypot } from './utils/honeypot.server';
import { i18n } from './utils/i18n.ts'
import { i18next } from './utils/i18next.server.ts'

import tailwindUrl from './tailwind.css?url';

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
  { rel: 'icon', type: 'image/svg+xml', href: faviconAssetUrl },
  { rel: 'apple-touch-icon', href: appleTouchIconAssetUrl },
  {
    rel: 'manifest',
    href: '/site.webmanifest',
    crossOrigin: 'use-credentials',
  } as const, // necessary to make typescript happy

  { rel: 'stylesheet', href: tailwindUrl },
];

export const meta: MetaFunction<typeof loader> = () => {
  // prettier-ignore
  return [
    { title: "My Remix App" },
    { name: "description", content: `Your own captain's log` },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = await i18next.getLocale(request)
  const honeyProps = honeypot.getInputProps();
  return json({
    ENV: getEnv(),
    honeyProps,
    locale
  });
}

function Document({
  children,
  nonce,
  theme = 'light',
  locale = i18n.fallbackLng,
  env = {},
  allowIndexing = true,
}: {
  children: React.ReactNode;
  nonce: string;
  theme?: Theme;
  locale?: string
  env?: Record<string, string>;
  allowIndexing?: boolean;
}) {
  return (
    <html lang={locale} className={`${theme} h-full overflow-x-hidden`}>
      <head>
        <Meta />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {allowIndexing ? null : <meta name="robots" content="noindex, nofollow" />}
        <Links />
      </head>
      <body className="bg-background text-foreground">
        {children}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

function App() {
  const data = useLoaderData<typeof loader>();
  const nonce = useNonce();
  const allowIndexing = data.ENV.ALLOW_INDEXING !== 'false';
  return (
    <Document locale={data.locale} nonce={nonce} allowIndexing={allowIndexing} env={data.ENV}>
      <div className="flex h-screen flex-col">
        <header className="container py-6">
          <h1 className="text-2xl font-bold">Hello Remix</h1>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </Document>
  );
}

function AppWithProviders() {
  const data = useLoaderData<typeof loader>();
  return (
    <HoneypotProvider {...data.honeyProps}>
      <App />
    </HoneypotProvider>
  );
}

export default withSentry(AppWithProviders);

export function ErrorBoundary() {
  // the nonce doesn't rely on the loader so we can access that
  const nonce = useNonce();

  // NOTE: you cannot use useLoaderData in an ErrorBoundary because the loader
  // likely failed to run so we have to do the best we can.
  // We could probably do better than this (it's possible the loader did run).
  // This would require a change in Remix.

  // Just make sure your root route never errors out and you'll always be able
  // to give the user a better UX.

  return (
    <Document nonce={nonce}>
      <GeneralErrorBoundary />
    </Document>
  );
}
