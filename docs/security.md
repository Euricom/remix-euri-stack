# Security

The Remix Euricom Stack has several security measures in place to protect your users and yourself. This (incomplete) document, explains some of the security measures that are in place and how to use them.

## Content Security Policy

The Stack uses a strict
[Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP). This means that only resources from trusted sources are allowed to be loaded. However, by default, the CSP is set to `report-only` which means that the browser will report violations of the CSP without actually blocking the resource.

This is to prevent new users of the Epic Stack from being blocked or surprised by the CSP by default. However, it is recommended to enable the CSP by removing the setting the CSP_REPORT_ONLY=false option.

## Secrets

The currently recommended policy for managing secrets is to place them in a `.env` file in the root of the application (which is `.gitignore`d). There is a `.env.example` which can be used as a template for this file (and if you do not need to actually connect to real services, this can be used as `cp .env.example .env`).

## [Cross-Site Scripting (XSS)](https://developer.mozilla.org/en-US/docs/Glossary/Cross-site_scripting)

React has built-in support for XSS protection. It does this by escaping all values by default. This means that if you want to render HTML, you need to use the `dangerouslySetInnerHTML` prop. This is a good thing, but it does mean that you need to be careful when rendering HTML. Never pass anything that is user-generated to this prop.

## [Cross-Site Request Forgery (CSRF)](https://forms.epicweb.dev/07)

The Stack has built-in support to prevent CSRF attacks. We use the
[`remix-utils`](https://github.com/sergiodxa/remix-utils)
[CSRF-related utilities](https://github.com/sergiodxa/remix-utils#csrf) to do this.

## [Honeypot](https://forms.epicweb.dev/06)

The Stack has built-in support for honeypot fields. We use the
[`remix-utils`](https://github.com/sergiodxa/remix-utils)
[honeypot-related utilities](https://github.com/sergiodxa/remix-utils#form-honeypot) to do this.