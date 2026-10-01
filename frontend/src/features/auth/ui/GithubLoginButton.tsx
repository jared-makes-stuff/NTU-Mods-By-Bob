"use client";

import type { ComponentProps } from "react";
import { Button } from "@/shared/ui/button";
import { config } from "@/shared/config";
import { useOAuthConfig } from "../context/OAuthConfigContext";
import {
  createGithubOAuthState,
  storeGithubOAuthState,
  buildGithubAuthorizeUrl,
  type GithubOAuthMode,
} from "../utils/githubOAuth";

interface GithubLoginButtonProps {
  onError: (message: string) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  mode?: GithubOAuthMode;
  label?: string;
  size?: ComponentProps<typeof Button>["size"];
}

export function GithubLoginButton({
  onError,
  setIsLoading,
  isLoading,
  mode = "login",
  label,
  size = "default",
}: GithubLoginButtonProps) {
  const { githubClientId, isGithubReady } = useOAuthConfig();

  const handleGithubLogin = () => {
    if (!githubClientId) {
      onError("GitHub OAuth is not configured.");
      return;
    }

    const state = createGithubOAuthState();
    const redirectPath = `${window.location.pathname}${window.location.search}`;
    const redirectUri = `${config.appUrl}/api/auth/github/callback`;

    storeGithubOAuthState(state, redirectPath, mode);
    setIsLoading(true);

    const authUrl = buildGithubAuthorizeUrl({
      clientId: githubClientId,
      redirectUri,
      state,
    });

    window.location.assign(authUrl);
  };

  return (
    <Button
      variant="outline"
      size={size}
      type="button"
      onClick={handleGithubLogin}
      disabled={!isGithubReady || isLoading}
    >
      {isGithubReady ? (label ?? "GitHub") : "GitHub (Unavailable)"}
    </Button>
  );
}
