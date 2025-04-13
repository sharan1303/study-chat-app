import React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

interface WelcomeScreenProps {
  showLogo: boolean;
}

export default function WelcomeScreen({ showLogo }: WelcomeScreenProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="text-center flex items-center justify-center h-screen z-20">
      <div className="flex flex-col items-center space-y-2">
        <div className="w-[200px] h-[175px] relative">
          {!showLogo ? (
            ""
          ) : (
            <Image
              src={
                mounted && resolvedTheme === "dark"
                  ? "/Study Chat Icon Dark mode.svg"
                  : "/Study Chat Icon Light mode.svg"
              }
              alt="Study Chat Logo"
              width={200}
              height={200}
              priority
              loading="eager"
            />
          )}
        </div>
        <h3 className="text-lg font-medium">Welcome to Study Chat!</h3>
        <p className="text-muted-foreground">
          Create individual modules and provide context to your chat threads
        </p>
      </div>
    </div>
  );
}
