"use client";

import { useEffect, useState } from "react";
import { getAuthConfig } from "@/shared/api/auth";
import { OAuthConfigProvider } from "../context/OAuthConfigContext";

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [githubClientId, setGithubClientId] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await getAuthConfig();
        setGoogleClientId(config.googleClientId ?? null);
        setGithubClientId(config.githubClientId ?? null);
      } catch {
        // Silent fallback: render without OAuth config if unavailable.
      }
    };
    fetchConfig();
  }, []);

  return (
    <OAuthConfigProvider googleClientId={googleClientId} githubClientId={githubClientId}>
      {children}
    </OAuthConfigProvider>
  );
}

