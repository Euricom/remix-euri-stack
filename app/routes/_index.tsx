import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Button } from '../components/ui/button';
import { Camera } from 'lucide-react';
import { useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { i18next } from '@/app/utils/i18next.server';

export const meta: MetaFunction = () => {
  return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

// Old style loader
// export const loader = ({ context }: LoaderFunctionArgs) => {
//   console.log('context', context);
//   return json({
//     testString: 'peter',
//     testDate: new Date(),
//   });
// };

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const locale = await i18next.getLocale(request);
  console.log('context', context);
  return {
    testString: 'peter',
    testDate: new Date(),
    locale,
  };
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  //    ^?
  console.log(data);
  console.log(data.testDate.toDateString());

  return (
    <div className="h-[144px] w-[434px]">
      <img src="/logo-light.png" alt="Remix" />
      <Button>My Button</Button>
      <Camera color="blue" size={64} />
    </div>
  );
}
