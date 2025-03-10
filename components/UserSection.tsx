import Link from "next/link";
import { Settings } from "lucide-react";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function UserSection() {
  return (
    <div className="p-4 border-t">
      <div className="flex items-center justify-between">
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                userButtonBox: {
                  flexDirection: "row-reverse",
                },
              },
            }}
            showName
          />
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <Button className="w-full">Sign in</Button>
          </SignInButton>
        </SignedOut>
      </div>
    </div>
  );
}
