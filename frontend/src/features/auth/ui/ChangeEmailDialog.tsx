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
import { EmailVerificationDialog } from "./EmailVerificationDialog";

interface ChangeEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangeEmailDialog({ isOpen, onClose }: ChangeEmailDialogProps) {
  const user = useAuthStore((state) => state.user);
  const requestEmailChange = useAuthStore((state) => state.requestEmailChange);
  const verifyEmailChange = useAuthStore((state) => state.verifyEmailChange);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingExpiresAt, setPendingExpiresAt] = useState<string | null>(null);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasPassword = Boolean(user?.passwordHash);

  useEffect(() => {
    if (!isOpen) return;
    setNewEmail("");
    setPassword("");
    setPendingEmail("");
    setPendingExpiresAt(null);
    setIsVerificationOpen(false);
    setIsLoading(false);
    setStatus(null);
    setError(null);
  }, [isOpen]);

  const handleClose = () => {
    setIsVerificationOpen(false);
    onClose();
  };

  const handleRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setStatus(null);

    if (!hasPassword) {
      setError("Please create a password before changing your email.");
      setIsLoading(false);
      return;
    }

    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      setError("New email is required.");
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Current password is required.");
      setIsLoading(false);
      return;
    }

    if (user?.email && trimmedEmail.toLowerCase() === user.email.toLowerCase()) {
      setError("New email must be different from your current email.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await requestEmailChange(trimmedEmail, password);
      setPendingEmail(response.email);
      setPendingExpiresAt(response.expiresAt);
      setIsVerificationOpen(true);
      setStatus(`Verification code sent to ${response.email}.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    setIsVerificationOpen(false);
    onClose();
  };

  const handleVerify = async (_email: string, code: string) => {
    await verifyEmailChange(code);
  };

  const handleResend = async (email: string) => {
    if (!password.trim()) {
      throw new Error("Current password is required to resend the code.");
    }
    return requestEmailChange(email, password);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-2xl font-semibold tracking-tight">
              Change Email
            </DialogTitle>
            <DialogDescription>
              Enter your new email and confirm with a verification code.
            </DialogDescription>
          </DialogHeader>
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
            {!hasPassword && (
              <div className="p-3 text-sm text-amber-700 bg-amber-50 rounded-md border border-amber-200">
                You need to create a password before changing your email.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="change-email-current">Current Email</Label>
              <Input
                id="change-email-current"
                type="email"
                value={user?.email ?? ""}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-email-new">New Email</Label>
              <Input
                id="change-email-new"
                type="email"
                placeholder="name@example.com"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-email-password">Current Password</Label>
              <Input
                id="change-email-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !hasPassword}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send verification code
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <EmailVerificationDialog
        isOpen={isVerificationOpen}
        email={pendingEmail}
        expiresAt={pendingExpiresAt}
        onClose={() => setIsVerificationOpen(false)}
        onVerified={handleVerificationComplete}
        title="Confirm Email Change"
        description="Enter the verification code sent to your new email address."
        onVerify={handleVerify}
        onResend={handleResend}
      />
    </>
  );
}
