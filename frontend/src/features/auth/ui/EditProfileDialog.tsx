"use client";

import { useState, useEffect, useRef } from "react";
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
import { Loader2, UploadCloud, Unlink, CheckCircle2, XCircle } from "lucide-react";
import { useAuthStore } from "../state/authStore";
import { getErrorMessage } from "@/shared/api/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { GoogleLinkButton } from "./GoogleLinkButton";
import { GithubLoginButton } from "./GithubLoginButton";
import { ChangeEmailDialog } from "./ChangeEmailDialog";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { DeleteAccountDialog } from "./DeleteAccountDialog";

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileDialog({
  isOpen,
  onClose,
}: EditProfileDialogProps) {
  const {
    user,
    updateProfile,
    uploadAvatar,
    unlinkOAuthProvider,
  } = useAuthStore();
  const oauthAccounts = (user?.oauthAccounts as Array<{ provider: string; id: string; email?: string }>) || [];
  const isGoogleLinked = oauthAccounts.some((account) => account.provider === "google");
  const isGithubLinked = oauthAccounts.some((account) => account.provider === "github");
  const googleAccount = oauthAccounts.find((account) => account.provider === "google");
  const githubAccount = oauthAccounts.find((account) => account.provider === "github");

  const [name, setName] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isChangeEmailDialogOpen, setIsChangeEmailDialogOpen] = useState(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsChangeEmailDialogOpen(false);
      setIsChangePasswordDialogOpen(false);
      return;
    }

    if (user) {
      setName(user.name || "");

      setFile(null); // Clear file selection on dialog open
      setError(null);
      setSuccess(false);
      setOauthLoadingProvider(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear file input visual
      }
    }
  }, [isOpen, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // First, upload avatar if a file is selected
      if (file) {
        await uploadAvatar(file);
      }

      const updates: { name?: string } = {};
      if (name !== user?.name) updates.name = name;

      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
      }

      if (!file && Object.keys(updates).length === 0) {
        // If no file uploaded, no password changes, no other fields changed
        setSuccess(true);
        setTimeout(() => onClose(), 1500);
        return;
      }

      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkProvider = async (provider: "google" | "github") => {
    setOauthLoadingProvider(provider);
    setError(null);
    setSuccess(false);

    try {
      await unlinkOAuthProvider(provider);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setOauthLoadingProvider(null);
    }
  };

  const currentAvatarPreview = file ? URL.createObjectURL(file) : user?.avatarUrl ?? undefined;
  const isProfileBusy = isLoading || success;
  const isOauthBusy = oauthLoadingProvider !== null;
  const passwordButtonLabel = user?.passwordHash ? "Change Password" : "Create Password";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information, password, and linked accounts.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="grid gap-6 py-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm text-green-500 bg-green-50 rounded-md border border-green-200">
                Profile updated successfully!
              </div>
            )}

            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={currentAvatarPreview} alt={user?.name || "User"} />
                <AvatarFallback className="text-4xl">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : <UploadCloud className="h-12 w-12 text-muted-foreground" />}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-2 w-full">
                <Label htmlFor="avatar-upload">Profile Picture</Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/gif, image/webp"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="file:text-sm file:font-semibold file:cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">Max 5MB (jpg, png, gif, webp)</p>
              </div>
            </div>

            <Separator />

            {/* Basic Info Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Basic Information</h4>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    id="email"
                    type="email"
                    value={user?.email ?? ""}
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsChangeEmailDialogOpen(true)}
                  >
                    Change Email
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Changing your email requires password verification.
                </p>
              </div>
            </div>

            <Separator />

            {/* Security Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Security</h4>
              <p className="text-xs text-muted-foreground">
                Update your password or create one for OAuth-only accounts.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsChangePasswordDialogOpen(true)}
              >
                {passwordButtonLabel}
              </Button>
            </div>

            <Separator />

            {/* OAuth Providers Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Linked Accounts</h4>
              <p className="text-xs text-muted-foreground">
                Connect OAuth providers to your account for quick sign-in.
              </p>

              <div className="space-y-2">
                {/* Google */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">G</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Google</p>
                      {googleAccount && (
                        <p className="text-xs text-muted-foreground">
                          {googleAccount.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGoogleLinked ? (
                      <>
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          Linked
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlinkProvider("google")}
                          disabled={isProfileBusy || isOauthBusy}
                          title="Unlink Google"
                        >
                          {oauthLoadingProvider === "google" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Unlink className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Not Linked
                        </Badge>
                        <GoogleLinkButton
                          onError={(msg) => setError(msg)}
                          setIsLoading={(loading) =>
                            setOauthLoadingProvider(loading ? "google" : null)
                          }
                          isLoading={isProfileBusy || isOauthBusy}
                          label="Link"
                          size="sm"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* GitHub */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-700">GH</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">GitHub</p>
                      {githubAccount && (
                        <p className="text-xs text-muted-foreground">
                          {githubAccount.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGithubLinked ? (
                      <>
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          Linked
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlinkProvider("github")}
                          disabled={isProfileBusy || isOauthBusy}
                          title="Unlink GitHub"
                        >
                          {oauthLoadingProvider === "github" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Unlink className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Not Linked
                        </Badge>
                        <GithubLoginButton
                          onError={(msg) => setError(msg)}
                          setIsLoading={(loading) =>
                            setOauthLoadingProvider(loading ? "github" : null)
                          }
                          isLoading={isProfileBusy || isOauthBusy}
                          mode="link"
                          label="Link"
                          size="sm"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <h4 className="text-sm font-semibold text-destructive">Danger Zone</h4>
              <div className="p-4 border border-destructive/20 rounded-md bg-destructive/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Delete Account</p>
                    <p className="text-xs text-muted-foreground">
                      Permanently delete your account and all associated data.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteAccountDialogOpen(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full mt-4" disabled={isLoading || success}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <ChangeEmailDialog
        isOpen={isChangeEmailDialogOpen}
        onClose={() => setIsChangeEmailDialogOpen(false)}
      />
      <ChangePasswordDialog
        isOpen={isChangePasswordDialogOpen}
        onClose={() => setIsChangePasswordDialogOpen(false)}
      />
    </>
  );
}
