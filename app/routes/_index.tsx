import type { MetaFunction } from '@remix-run/node';
import { Button } from '../components/ui/button';
import { useLoaderData } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

// export const loader = ({ context }) => {
//   console.log('context', context);
//   return {
//     context,
//   };
// };

export default function Index() {
  // const data = useLoaderData();
  // console.log(data);
  return (
    <div className="h-[144px] w-[434px]">
      <img src="/logo-light.png" alt="Remix" />
      <Button>My Button</Button>
    </div>
  );
}
