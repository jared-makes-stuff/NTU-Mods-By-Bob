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
import { useAuthStore } from "../state/authStore";
import { getErrorMessage } from "@/shared/api/client";

interface EmailVerificationDialogProps {
  isOpen: boolean;
  email: string;
  expiresAt?: string | null;
  onClose: () => void;
  onVerified: () => void;
  title?: string;
  description?: string;
  onVerify?: (email: string, code: string) => Promise<void>;
  onResend?: (email: string) => Promise<{ email?: string; expiresAt: string }>;
}

const formatExpiry = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

export function EmailVerificationDialog({
  isOpen,
  email,
  expiresAt: initialExpiresAt,
  onClose,
  onVerified,
  title,
  description,
  onVerify,
  onResend,
}: EmailVerificationDialogProps) {
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const requestEmailVerification = useAuthStore((state) => state.requestEmailVerification);
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(initialExpiresAt ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCode("");
    setError(null);
    setStatus(null);
    setExpiresAt(initialExpiresAt ?? null);
  }, [isOpen, email, initialExpiresAt]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setStatus(null);

    if (!email) {
      setError("Email is required.");
      setIsLoading(false);
      return;
    }

    if (!code.trim()) {
      setError("Verification code is required.");
      setIsLoading(false);
      return;
    }

    try {
      if (onVerify) {
        await onVerify(email, code.trim());
      } else {
        await verifyEmail(email, code.trim());
      }
      onVerified();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setStatus(null);

    if (!email) {
      setError("Email is required.");
      setIsResending(false);
      return;
    }

    try {
      const response = onResend
        ? await onResend(email)
        : await requestEmailVerification(email);
      setExpiresAt(response.expiresAt);
      setStatus(`Verification code sent to ${response.email ?? email}.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            {title ?? "Verify Email"}
          </DialogTitle>
          <DialogDescription>
            {description ?? "Enter the verification code sent to your email address."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleVerify} className="space-y-4 pt-2">
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
            <Label htmlFor="verification-email">Email</Label>
            <Input id="verification-email" type="email" value={email} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
            />
            {expiresAt && (
              <p className="text-xs text-muted-foreground">
                Code expires at {formatExpiry(expiresAt)}.
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify and Continue
          </Button>
          <Button
            type="button"
            variant="link"
            className="w-full text-sm"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resend verification code
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
