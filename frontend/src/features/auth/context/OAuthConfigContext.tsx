"use client";

import React, { createContext, useContext } from "react";

interface OAuthConfigContextType {
  googleClientId?: string;
  githubClientId?: string;
  isGoogleReady: boolean;
  isGithubReady: boolean;
}

const OAuthConfigContext = createContext<OAuthConfigContextType>({
  isGoogleReady: false,
  isGithubReady: false,
});

export const useOAuthConfig = () => useContext(OAuthConfigContext);

export function OAuthConfigProvider({
  children,
  googleClientId,
  githubClientId,
}: {
  children: React.ReactNode;
  googleClientId?: string | null;
  githubClientId?: string | null;
}) {
  const normalizedGoogle = googleClientId?.trim() || undefined;
  const normalizedGithub = githubClientId?.trim() || undefined;

  return (
    <OAuthConfigContext.Provider
      value={{
        googleClientId: normalizedGoogle,
        githubClientId: normalizedGithub,
        isGoogleReady: Boolean(normalizedGoogle),
        isGithubReady: Boolean(normalizedGithub),
      }}
    >
      {children}
    </OAuthConfigContext.Provider>
  );
}
