"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/features/auth/state/authStore";
import { getErrorMessage } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import {
  clearGoogleOAuthState,
  getGoogleOAuthProcessingState,
  getGoogleOAuthState,
  setGoogleOAuthProcessingState,
} from "@/features/auth/utils/googleOAuth";

export default function GoogleOAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const linkWithGoogle = useAuthStore((state) => state.linkWithGoogle);
  const errorParam = searchParams.get("error");
  const errorMessageParam = searchParams.get("message");

  const statusMessage = useMemo(() => {
    if (!errorParam) {
      return "Completing Google sign-in...";
    }
    if (errorMessageParam) {
      return errorMessageParam;
    }
    if (errorParam === "access_denied") {
      return "Google authorization was cancelled.";
    }
    if (errorParam === "missing_code") {
      return "Missing authorization code from Google.";
    }
    if (errorParam === "state_mismatch") {
      return "Google sign-in could not be verified. Please try again.";
    }
    return "Google sign-in failed. Please try again.";
  }, [errorMessageParam, errorParam]);

  useEffect(() => {
    if (errorParam) {
      return;
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const stored = getGoogleOAuthState();
    const redirectPath = stored.redirectPath || "/";
    const mode = stored.mode === "link" ? "link" : "login";

    if (!code) {
      router.replace("/auth/google/callback?error=missing_code");
      return;
    }

    if (!state || !stored.state || state !== stored.state) {
      if (state && getGoogleOAuthProcessingState() === state) {
        return;
      }
      clearGoogleOAuthState();
      router.replace("/auth/google/callback?error=state_mismatch");
      return;
    }

    if (getGoogleOAuthProcessingState() === state) {
      return;
    }

    setGoogleOAuthProcessingState(state);

    const oauthAction = mode === "link" ? linkWithGoogle : loginWithGoogle;

    oauthAction(code)
      .then(() => {
        clearGoogleOAuthState();
        router.replace(redirectPath);
      })
      .catch((err: unknown) => {
        clearGoogleOAuthState();
        const errorMessage = encodeURIComponent(getErrorMessage(err));
        router.replace(`/auth/google/callback?error=login_failed&message=${errorMessage}`);
      });
  }, [errorParam, linkWithGoogle, loginWithGoogle, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-4 rounded-lg border bg-background p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Google Sign-In</h1>
        <p className="text-sm text-muted-foreground">{statusMessage}</p>
        {errorParam && (
          <Button variant="outline" onClick={() => router.replace("/")}>
            Return Home
          </Button>
        )}
      </div>
    </div>
  );
}
