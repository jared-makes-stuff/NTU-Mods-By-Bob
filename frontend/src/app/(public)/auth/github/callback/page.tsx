"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/features/auth/state/authStore";
import { getErrorMessage } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import {
  clearGithubOAuthState,
  getGithubOAuthProcessingState,
  getGithubOAuthState,
  setGithubOAuthProcessingState,
} from "@/features/auth/utils/githubOAuth";

export default function GithubOAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const loginWithGithub = useAuthStore((state) => state.loginWithGithub);
  const linkWithGithub = useAuthStore((state) => state.linkWithGithub);
  const errorParam = searchParams.get("error");
  const errorMessageParam = searchParams.get("message");

  const statusMessage = useMemo(() => {
    if (!errorParam) {
      return "Completing GitHub sign-in...";
    }
    if (errorMessageParam) {
      return errorMessageParam;
    }
    if (errorParam === "access_denied") {
      return "GitHub authorization was cancelled.";
    }
    if (errorParam === "missing_code") {
      return "Missing authorization code from GitHub.";
    }
    if (errorParam === "state_mismatch") {
      return "GitHub sign-in could not be verified. Please try again.";
    }
    return "GitHub sign-in failed. Please try again.";
  }, [errorMessageParam, errorParam]);

  useEffect(() => {
    if (errorParam) {
      return;
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const stored = getGithubOAuthState();
    const redirectPath = stored.redirectPath || "/";
    const mode = stored.mode === "link" ? "link" : "login";

    if (!code) {
      router.replace("/auth/github/callback?error=missing_code");
      return;
    }

    if (!state || !stored.state || state !== stored.state) {
      if (state && getGithubOAuthProcessingState() === state) {
        return;
      }
      clearGithubOAuthState();
      router.replace("/auth/github/callback?error=state_mismatch");
      return;
    }

    if (getGithubOAuthProcessingState() === state) {
      return;
    }

    setGithubOAuthProcessingState(state);

    const oauthAction = mode === "link" ? linkWithGithub : loginWithGithub;

    oauthAction(code)
      .then(() => {
        clearGithubOAuthState();
        router.replace(redirectPath);
      })
      .catch((err: unknown) => {
        clearGithubOAuthState();
        const errorMessage = encodeURIComponent(getErrorMessage(err));
        router.replace(`/auth/github/callback?error=login_failed&message=${errorMessage}`);
      });
  }, [errorParam, linkWithGithub, loginWithGithub, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-4 rounded-lg border bg-background p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">GitHub Sign-In</h1>
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
