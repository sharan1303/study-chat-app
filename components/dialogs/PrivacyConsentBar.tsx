"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "privacy-policy-consent";

export function PrivacyConsentBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem(CONSENT_KEY) === "true";
    if (!hasConsented) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex-1 text-sm">
          By using Study Chat, you agree to our{" "}
          <Link href="/privacy-policy" className="text-primary hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link
            href="/terms-of-service"
            className="text-primary hover:underline"
          >
            Terms of Service
          </Link>
          .
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={handleAccept}>
            Accept
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAccept}
            className="p-1"
          >
            <X size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PrivacyConsentBar;
