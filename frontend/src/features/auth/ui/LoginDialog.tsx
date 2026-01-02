"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "../state/authStore";
import { getErrorMessage } from "@/shared/api/client";
import { GoogleLoginButton } from "./GoogleLoginButton";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onRegisterClick: () => void;
}

export function LoginDialog({
  isOpen,
  onClose,
  onLoginSuccess,
  onRegisterClick,
}: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const login = useAuthStore((state) => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login({ email, password });

      onLoginSuccess();
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-semibold tracking-tight">Login</DialogTitle>
          <DialogDescription>
            Enter your email and password to access your account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4 pt-2">
          {error && (
             <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                {error}
             </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Button 
                variant="link" 
                size="sm" 
                className="px-0 h-auto text-xs font-normal" 
                type="button"
                tabIndex={-1}
              >
                Forgot password?
              </Button>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <GoogleLoginButton 
              onSuccess={() => {
                onLoginSuccess();
                onClose();
              }}
              onError={(msg) => setError(msg)}
              setIsLoading={setIsLoading}
              isLoading={isLoading}
            />
            <Button variant="outline" type="button" disabled>
               GitHub
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-4">
            Don&apos;t have an account?{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-normal underline-offset-4"
              onClick={onRegisterClick}
              type="button"
            >
              Sign up
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
