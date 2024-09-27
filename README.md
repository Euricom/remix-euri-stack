# Remix Euricom Stack

## What's in the stack?

- [x] Custom fast [Hono](https://hono.dev/) server for production
- [x] Security headers and Content Security Policy with nonces
- [x] Styling with [Tailwind CSS](https://tailwindcss.com/), [clsx](https://www.npmjs.com/package/clsx), and
      [tailwind-merge](https://www.npmjs.com/package/tailwind-merge)
- [x] Code & Tailwind formatting with [Prettier](https://prettier.io/)
- [x] Static Types with [TypeScript](https://typescriptlang.org/)
- [x] UI Components with [Shadcn](https://ui.shadcn.com/)
- [x] [Sentry](https://sentry.io/) integration for client & server
- [x] [Docker](https://docs.docker.com/engine/install) setup for nodejs.
- [x] Honeypot security to prevent spam bots to submit forms
- [x] Icons from [Lucide](https://lucide.dev/icons/)
- [x] Has built-in support to prevent CSRF attacks
- [x] Favicon & site webmanifest
- [x] Unit testing with [Vitest](https://vitest.dev/) & [MSW](https://mswjs.io/)
- [x] Global ErrorBoundary
- [x] 404 Error handling
- [ ] Improve typing with [ts-reset](https://github.com/mattpocock/ts-reset)
- [ ] E2E testing with [Playwright](https://playwright.dev/)
- [ ] Toaster preconfigured with [remix-toast](https://remix.run/resources/remix-toast)
- [ ] Form sample based on [conform](https://github.com/edmundhung/conform)
- [ ] Use [Flat Routes](https://github.com/kiliman/remix-flat-routes)
- [ ] I18n with [remix-i18next](https://www.npmjs.com/package/remix-i18next)
- [ ] Improve the DX with [@Epic-web/remember](https://remix.run/resources/@epic-web/remember)
- [ ] Typesafe routes with [remix-routes](https://github.com/yesmeck/remix-routes)
- [ ] Access rights with [casl](https://casl.js.org/v6/en/)


## Useful libraries (not used for now)

- [SpinDelay](https://github.com/smeijer/spin-delay)
- [ClientHints](https://github.com/epicweb-dev/client-hints)
- [lru-cache](https://www.npmjs.com/package/lru-cache)
- [cashified](https://github.com/epicweb-dev/cachified)
  

## Other idea's

### UI Libraries

These are the major tailwind based UI libraries

* [NextUI](https://nextui.org/)
* [ShadCN](https://ui.shadcn.com/)
* [PrimeReact](https://primereact.org/)

> Do we need to test them?

**ShadCN**

Works perfectly with tailwindcss, requires more boilerplate, can be customized in-depth.

```html
<FormItem>
  <FormLabel>Email</FormLabel>
  <FormControl>
    <Input type="email" {...field} />
  <FormControl>
  <FormMessage>
</FormItem>
```

**NextUI**

Works perfectly with tailwindcss, requires more boilerplate, can be customized in-depth.

```html
<Input type="email"
      label="Email" 
      errorMessage={errors.email} 
      isInvalid={!!errors.email}
      {...field}
/>
```

You can also combine them, see: https://www.perplexity.ai/search/justd-vs-shadcn-qs6zyFajT2W7pOJj9I4L0A

### Security

See more:
* https://remix.run/resources/http-helmet

### Mono Repo

Place ui, utils, tsconfig, eslint in separated package.
See more: https://github.com/dan5py/turborepo-shadcn-ui

### OAuth2

Build your authentication with OAuth2 where the tokens are NOT stored 
in the client. 

See more: 
* https://www.npmjs.com/package/remix-auth
* https://sergiodxa.com/articles/working-with-refresh-tokens-in-remix
* https://remix.run/resources/remix-auth-oauth2-strategy
* https://remix.run/resources/remix-auth-microsoft-strategy
  
### Fast BE Server with Hono or Fastify

See More: 
* https://remix.run/resources/remix-+-hono
* https://github.com/yusukebe/hono-and-remix-on-vite
* https://remix.run/resources/remix-fastify
* https://github.com/kiliman/remix-express-vite-plugin
  
### SVG handling

Combine all SVG to a SVG Sprite; faster to download and use

* https://remix.run/resources/vite-svg-sprite-plugin

### Reason to use eslint in favor of 

* [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
* [prettier - tailwind sorting](https://tailwindcss.com/blog/automatic-class-sorting-with-prettier) 
