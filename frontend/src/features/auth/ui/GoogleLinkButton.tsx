"use client";

import type { ComponentProps } from "react";
import type { GoogleOAuthMode } from "../utils/googleOAuth";
import { GoogleLoginButton } from "./GoogleLoginButton";

interface GoogleLinkButtonProps {
  onError: (message: string) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  label?: string;
  size?: ComponentProps<typeof GoogleLoginButton>["size"];
  mode?: GoogleOAuthMode;
}

export function GoogleLinkButton({
  label,
  size,
  mode = "link",
  ...props
}: GoogleLinkButtonProps) {
  return (
    <GoogleLoginButton
      {...props}
      mode={mode}
      label={label ?? "Link"}
      size={size}
    />
  );
}
