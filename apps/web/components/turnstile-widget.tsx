"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (element: string | HTMLElement, options: Record<string, unknown>) => void;
    };
  }
}

interface Props {
  siteKey?: string;
  onToken: (token: string | null) => void;
}

export function TurnstileWidget({ siteKey, onToken }: Props) {
  useEffect(() => {
    if (!siteKey) return;
    const scriptId = "turnstile-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = () => {
        window.turnstile?.render("#turnstile-container", {
          sitekey: siteKey,
          callback: (token: string) => onToken(token),
          "error-callback": () => onToken(null)
        });
      };
    } else {
      window.turnstile?.render("#turnstile-container", {
        sitekey: siteKey,
        callback: (token: string) => onToken(token),
        "error-callback": () => onToken(null)
      });
    }
  }, [siteKey, onToken]);

  if (!siteKey) return null;

  return <div id="turnstile-container" className="mt-4" />;
}
