import { json, Links, Meta, MetaFunction, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { withSentry } from "@sentry/remix";

import { getEnv } from "./utils/env.server";
import { useNonce } from "./utils/nonce-provider";
import { Theme } from "./utils/theme.server";
import { GeneralErrorBoundary } from "./components/error-boundary";

import tailwindUrl from "./tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "stylesheet", href: tailwindUrl },
];

export const meta: MetaFunction<typeof loader> = () => {
  // prettier-ignore
  return [
    { title: "My Remix App" },
    { name: "description", content: `Your own captain's log` },
  ];
};

export async function loader({ context }: LoaderFunctionArgs) {
  return json({
    ENV: getEnv(),
  });
}

function Document({
  children,
  nonce,
  theme = "light",
  env = {},
  allowIndexing = true,
}: {
  children: React.ReactNode;
  nonce: string;
  theme?: Theme;
  env?: Record<string, string>;
  allowIndexing?: boolean;
}) {
  return (
    <html lang="en" className={`${theme} h-full overflow-x-hidden`}>
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
  const allowIndexing = data.ENV.ALLOW_INDEXING !== "false";
  return (
    <Document nonce={nonce} allowIndexing={allowIndexing} env={data.ENV}>
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
  // const data = useLoaderData<typeof loader>();
  return (
    // <HoneypotProvider {...data.honeyProps}>
    <App />
    // </HoneypotProvider>
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
