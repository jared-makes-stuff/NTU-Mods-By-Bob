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
import { Loader2, UploadCloud, Eye, EyeOff, Link2, Unlink, CheckCircle2, XCircle } from "lucide-react";
import { useAuthStore } from "../state/authStore";
import { getErrorMessage } from "@/shared/api/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileDialog({
  isOpen,
  onClose,
}: EditProfileDialogProps) {
  const { user, updateProfile, uploadAvatar, changePassword, createPassword } = useAuthStore();
  const hasPassword = user?.passwordHash !== null && user?.passwordHash !== undefined;
  const oauthAccounts = (user?.oauthAccounts as Array<{ provider: string; id: string; email?: string }>) || [];
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || "");
      setEmail(user.email || "");
      
      // Reset password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setFile(null); // Clear file selection on dialog open
      setError(null);
      setSuccess(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
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
      // Handle password change/creation
      if (newPassword || confirmPassword || currentPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error("New passwords do not match");
        }
        
        if (!newPassword || newPassword.length < 8) {
          throw new Error("Password must be at least 8 characters long");
        }

        if (hasPassword) {
          // Change existing password
          if (!currentPassword) {
            throw new Error("Current password is required");
          }
          if (changePassword) {
            await changePassword(currentPassword, newPassword);
          }
        } else {
          // Create new password for OAuth-only user
          if (createPassword) {
            await createPassword(newPassword);
          }
        }
      }

      // First, upload avatar if a file is selected
      if (file) {
        await uploadAvatar(file);
      }

      // Then, update other profile fields (name, email) if they have changed
      const updates: { name?: string; email?: string } = {};
      if (name !== user?.name) {
        updates.name = name;
      }
      if (email !== user?.email) {
        updates.email = email;
      }
      
      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
      } else if (!file && !newPassword) {
        // If no file uploaded, no password changes, and no other fields changed
        setSuccess(true);
        setTimeout(() => onClose(), 1500);
        return;
      }
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const currentAvatarPreview = file ? URL.createObjectURL(file) : user?.avatarUrl;

  return (
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
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <Separator />

          {/* Password Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">
                {hasPassword ? "Change Password" : "Create Password"}
              </h4>
              {!hasPassword && (
                <Badge variant="secondary" className="text-xs">
                  OAuth Account
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasPassword 
                ? "Enter your current password and a new password to change it." 
                : "Create a password to enable traditional login alongside OAuth."}
            </p>
            
            {hasPassword && (
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
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
                    {oauthAccounts.find(acc => acc.provider === 'google') && (
                      <p className="text-xs text-muted-foreground">
                        {oauthAccounts.find(acc => acc.provider === 'google')?.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {oauthAccounts.find(acc => acc.provider === 'google') ? (
                    <>
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        Linked
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled
                        title="Coming soon"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Not Linked
                      </Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        title="Coming soon"
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
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
                    {oauthAccounts.find(acc => acc.provider === 'github') && (
                      <p className="text-xs text-muted-foreground">
                        {oauthAccounts.find(acc => acc.provider === 'github')?.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {oauthAccounts.find(acc => acc.provider === 'github') ? (
                    <>
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        Linked
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled
                        title="Coming soon"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Not Linked
                      </Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        title="Coming soon"
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || success}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
