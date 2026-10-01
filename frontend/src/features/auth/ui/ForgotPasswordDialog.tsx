"use client";

import { useEffect, useState } from "react";
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
import { getErrorMessage } from "@/shared/api/client";
import { requestPasswordReset, resetPassword } from "@/shared/api/auth";

interface ForgotPasswordDialogProps {
  isOpen: boolean;
  initialEmail?: string;
  onClose: () => void;
  onResetSuccess: () => void;
}

const formatExpiry = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

export function ForgotPasswordDialog({
  isOpen,
  initialEmail,
  onClose,
  onResetSuccess,
}: ForgotPasswordDialogProps) {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep("request");
    setEmail(initialEmail ?? "");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setExpiresAt(null);
    setStatus(null);
    setError(null);
  }, [isOpen, initialEmail]);

  const handleRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setStatus(null);

    try {
      const response = await requestPasswordReset({ email });
      setExpiresAt(response.expiresAt);
      setStep("reset");
      setStatus(`Reset code sent to ${response.email}.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword({ email, code, newPassword });
      setStatus("Password reset successfully.");
      onResetSuccess();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError(null);
    setStatus(null);

    try {
      const response = await requestPasswordReset({ email });
      setExpiresAt(response.expiresAt);
      setStatus(`Reset code sent to ${response.email}.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            Forgot Password
          </DialogTitle>
          <DialogDescription>
            {step === "request"
              ? "Enter your email to receive a password reset code."
              : "Enter the code from your email and set a new password."}
          </DialogDescription>
        </DialogHeader>

        {step === "request" ? (
          <form onSubmit={handleRequest} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            {status && (
              <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
                {status}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send reset code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            {status && (
              <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
                {status}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input id="reset-email" type="email" value={email} readOnly />
              {expiresAt && (
                <p className="text-xs text-muted-foreground">
                  Code expires at {formatExpiry(expiresAt)}.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-code">Reset Code</Label>
              <Input
                id="reset-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\\D/g, "").slice(0, 6))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full text-sm"
              onClick={handleResend}
              disabled={isLoading}
            >
              Resend reset code
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
