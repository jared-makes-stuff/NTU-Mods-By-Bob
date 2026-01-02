"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { Button } from "@/shared/ui/button";
import { useGoogleConfig } from "../context/GoogleConfigContext";
import { useAuthStore } from "../state/authStore";
import { getErrorMessage } from "@/shared/api/client";

interface GoogleLoginButtonProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
}

function RealGoogleButton({ onSuccess, onError, setIsLoading, isLoading }: GoogleLoginButtonProps) {
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);

  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      try {
        await loginWithGoogle(codeResponse.code);
        onSuccess();
      } catch (err: unknown) {
        onError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      onError("Google Login failed. Please try again.");
    },
    flow: 'auth-code',
  });

  return (
    <Button 
      variant="outline" 
      type="button" 
      onClick={() => googleLogin()} 
      disabled={isLoading}
    >
      Google
    </Button>
  );
}

export function GoogleLoginButton(props: GoogleLoginButtonProps) {
  const { isReady } = useGoogleConfig();

  if (!isReady) {
    return (
      <Button variant="outline" type="button" disabled>
        Google (Loading...)
      </Button>
    );
  }

  return <RealGoogleButton {...props} />;
}
