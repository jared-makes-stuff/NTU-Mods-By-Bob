"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth";
import { hasRequiredRole, ROLE_LABELS, type UserRole } from "@/shared/lib/roles";
import { useToast } from "@/shared/hooks/use-toast";

type RoleGateProps = {
  minRole: UserRole;
  children: React.ReactNode;
  redirectTo?: string;
  showToast?: boolean;
  message?: string;
};

export function RoleGate({
  minRole,
  children,
  redirectTo = "/",
  showToast = true,
  message,
}: RoleGateProps) {
  const router = useRouter();
  const { toast } = useToast();
  const notifiedRef = useRef(false);
  const { isAuthenticated, isLoading, user, hasHydrated } = useAuthStore();

  const hasAccess = useMemo(
    () => hasRequiredRole(user?.role, minRole),
    [user?.role, minRole]
  );

  useEffect(() => {
    if (isLoading || !hasHydrated) return;
    if (!isAuthenticated || !hasAccess) {
      if (showToast && !notifiedRef.current) {
        notifiedRef.current = true;
        toast({
          title: "Access Restricted",
          description:
            message || `This page requires ${ROLE_LABELS[minRole]} access.`,
          variant: "destructive",
        });
      }
      router.push(redirectTo);
    }
  }, [isLoading, hasHydrated, isAuthenticated, hasAccess, redirectTo, router, showToast, toast, minRole, message]);

  if (isLoading || !hasHydrated || !isAuthenticated || !hasAccess) {
    return null;
  }

  return <>{children}</>;
}
