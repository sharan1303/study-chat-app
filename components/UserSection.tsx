import Link from "next/link";
import { Settings } from "lucide-react";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function UserSection() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

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
                // Apply different text colors based on theme
                userButtonOuterIdentifier: {
                  color: mounted && theme === "dark" ? "white" : "black",
                },
                userButtonTrigger: {
                  color: mounted && theme === "dark" ? "white" : "black",
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
