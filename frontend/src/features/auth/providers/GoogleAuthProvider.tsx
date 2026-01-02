"use client";

import { useEffect, useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { getAuthConfig } from "@/shared/api/auth";
import { GoogleConfigProvider } from "../context/GoogleConfigContext";

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await getAuthConfig();
        if (config.googleClientId) {
          setClientId(config.googleClientId);
        }
      } catch {
        // Silent fallback: render without Google OAuth if config is unavailable.
      }
    };
    fetchConfig();
  }, []);

  return (
    <GoogleConfigProvider isReady={!!clientId}>
      {clientId ? (
        <GoogleOAuthProvider clientId={clientId}>
          {children}
        </GoogleOAuthProvider>
      ) : (
        children
      )}
    </GoogleConfigProvider>
  );
}

