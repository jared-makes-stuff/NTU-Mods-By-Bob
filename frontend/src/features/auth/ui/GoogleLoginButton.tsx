"use client";

import type { ComponentProps } from "react";
import { Button } from "@/shared/ui/button";
import { config } from "@/shared/config";
import { useOAuthConfig } from "../context/OAuthConfigContext";
import {
  buildGoogleAuthorizeUrl,
  createGoogleOAuthState,
  storeGoogleOAuthState,
  type GoogleOAuthMode,
} from "../utils/googleOAuth";

interface GoogleLoginButtonProps {
  onError: (message: string) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  mode?: GoogleOAuthMode;
  label?: string;
  size?: ComponentProps<typeof Button>["size"];
}

export function GoogleLoginButton({
  onError,
  setIsLoading,
  isLoading,
  mode = "login",
  label,
  size = "default",
}: GoogleLoginButtonProps) {
  const { googleClientId, isGoogleReady } = useOAuthConfig();

  const handleGoogleLogin = () => {
    if (!googleClientId) {
      onError("Google OAuth is not configured.");
      return;
    }

    const state = createGoogleOAuthState();
    const redirectPath = `${window.location.pathname}${window.location.search}`;
    const redirectUri = `${config.appUrl}/api/auth/google/callback`;

    storeGoogleOAuthState(state, redirectPath, mode);
    setIsLoading(true);

    const authUrl = buildGoogleAuthorizeUrl({
      clientId: googleClientId,
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
      onClick={handleGoogleLogin}
      disabled={!isGoogleReady || isLoading}
    >
      {isGoogleReady ? (label ?? "Google") : "Google (Unavailable)"}
    </Button>
  );
}
