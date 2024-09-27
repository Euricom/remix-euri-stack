import { CSRF } from 'remix-utils/csrf/server';
import { createCookie } from '@remix-run/node'; // or cloudflare/deno

export const cookie = createCookie('csrf', {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  secrets: ['s3cr3t'],
});

/**
 * Create the csrf cookie
 * For more info, see https://github.com/sergiodxa/remix-utils#csrf
 *
 * ```
 * import { csrf } from "~/utils/csrf.server";
 *
 * export async function loader({ request }: LoaderFunctionArgs) {
 * 	let token = csrf.generate();
 * }
 */
export const csrf = new CSRF({
  cookie,
  // what key in FormData objects will be used for the token, defaults to `csrf`
  formDataKey: 'csrf',
  // an optional secret used to sign the token, recommended for extra safety
  secret: 's3cr3t',
});
