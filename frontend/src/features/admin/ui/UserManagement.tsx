"use client";

import { useMemo, useState } from "react";
import { useUserManagement } from "../hooks/useUserManagement";
import { useAuthStore } from "@/features/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Loader2, Shield } from "lucide-react";
import { normalizeRole, ROLE_LABELS, type UserRole } from "@/shared/lib/roles";

export default function UserManagement() {
  const { users, isLoading, handleRoleChange, isUpdating } = useUserManagement();
  const { user } = useAuthStore();
  const currentRole = normalizeRole(user?.role);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const normalizedQuery = query.trim().toLowerCase();
  const roleOptions: UserRole[] = ["user", "plus", "pro", "admin", "superadmin"];

  const isRoleOptionDisabled = (role: UserRole, targetUserRole: UserRole) => {
    if (currentRole === "admin") {
      // Admins cannot assign admin or superadmin roles
      return role === "admin" || role === "superadmin";
    }
    if (currentRole === "superadmin") {
      // Superadmins can assign any role except superadmin to non-superadmin users
      if (targetUserRole === "superadmin") {
        // Cannot change a superadmin's role at all
        return true;
      }
      // Cannot assign superadmin role to others
      return role === "superadmin";
    }
    return true;
  };

  const canEditTargetRole = (targetRole: UserRole) => {
    if (currentRole === "admin") {
      return targetRole !== "admin" && targetRole !== "superadmin";
    }
    if (currentRole === "superadmin") {
      return targetRole !== "superadmin";
    }
    return false;
  };

  const filteredUsers = useMemo(() => {
    if (!users.length) return [];

    return users.filter((user) => {
      const roleKey = normalizeRole(user.role);
      if (roleFilter !== "all" && roleKey !== roleFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const roleLabel = ROLE_LABELS[roleKey];
      const searchable = [user.id, user.email, user.name, roleKey, roleLabel]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return searchable.some((value) => value.includes(normalizedQuery));
    });
  }, [users, normalizedQuery, roleFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Users
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions across the platform.
          </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-4">
          <div className="w-full md:max-w-sm">
            <label className="text-sm font-medium text-muted-foreground">Search users</label>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by id, email, name, or role"
            />
          </div>
          <div className="w-full md:w-[220px]">
            <label className="text-sm font-medium text-muted-foreground">Filter role</label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="user">{ROLE_LABELS.user}</SelectItem>
                <SelectItem value="plus">{ROLE_LABELS.plus}</SelectItem>
                <SelectItem value="pro">{ROLE_LABELS.pro}</SelectItem>
                <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                <SelectItem value="superadmin">{ROLE_LABELS.superadmin}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground md:text-right">
            Showing {filteredUsers.length} of {users.length}
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">User ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[200px]">Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {users.length === 0 ? "No users found." : "No users match your filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs">{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={normalizeRole(user.role)}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                      disabled={!canEditTargetRole(normalizeRole(user.role)) || isUpdating}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem 
                            key={role} 
                            value={role} 
                            disabled={isRoleOptionDisabled(role, normalizeRole(user.role))}
                          >
                            {ROLE_LABELS[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
