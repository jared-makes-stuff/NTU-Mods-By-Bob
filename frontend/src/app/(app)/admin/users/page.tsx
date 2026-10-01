import { UserManagement } from "@/features/admin";
import { RoleGate } from "@/shared/components/RoleGate";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management - Admin",
  description: "Manage system users and roles",
};

export default function AdminUsersPage() {
  return (
    <RoleGate minRole="admin" message="Admin access is required to manage users.">
      <div className="container mx-auto py-10">
        <UserManagement />
      </div>
    </RoleGate>
  );
}
