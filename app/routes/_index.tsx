import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Button } from '../components/ui/button';
import { Camera } from 'lucide-react';
import { useLoaderData } from '@remix-run/react';

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

export const loader = ({ context }: LoaderFunctionArgs) => {
  console.log('context', context);
  return {
    testString: 'peter',
    testDate: new Date(),
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
