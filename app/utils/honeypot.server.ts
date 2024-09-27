import { Honeypot, SpamError } from 'remix-utils/honeypot/server';

export const honeypot = new Honeypot({
  validFromFieldName: process.env.NODE_ENV === 'test' ? null : undefined,
  encryptionSeed: process.env.HONEYPOT_SECRET,
});

// A honeypot prevent spam bots to submit forms (see Remix-utils)
// Make sure to validate the form in every action
// ```
// export async function action({ request }: ActionFunctionArgs) {
//   const formData = await request.formData();
//   checkHoneypot(formData);
//   // ...
// }

export function checkHoneypot(formData: FormData) {
  try {
    honeypot.check(formData);
  } catch (error) {
    if (error instanceof SpamError) {
      throw new Response('Form not submitted properly', { status: 400 });
    }
    throw error;
  }
}
