import type { MetaFunction } from "@remix-run/node";
import { Button } from "../components/ui/button";

export const meta: MetaFunction = () => {
  return [{ title: "New Remix App" }, { name: "description", content: "Welcome to Remix!" }];
};

export default function Index() {
  return (
    <div className="h-[144px] w-[434px]">
      <img src="/logo-light.png" alt="Remix" />
      <Button>My Button</Button>
    </div>
  );
}
