"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";

export default function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/modules");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Join Study Chat</h1>
        <p className="text-muted-foreground mt-2">
          Create an account to start your learning journey
        </p>
      </div>
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
        afterSignUpUrl="/modules"
      />
    </div>
  );
}
