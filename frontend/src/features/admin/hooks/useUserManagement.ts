import { useAllUsers, useUpdateUserRole } from "@/shared/data/queries/admin";
import { useToast } from "@/shared/hooks/use-toast";
import { AxiosError } from "axios";

export function useUserManagement() {
  const { data: users, isLoading, error } = useAllUsers();
  const updateRoleMutation = useUpdateUserRole();
  const { toast } = useToast();

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });
    } catch (error: unknown) {
      let errorMessage = "Could not update user role. Please try again.";
      
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.error?.message || 
                      error.response?.data?.message ||
                      error.message ||
                      errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return {
    users: users ?? [],
    isLoading,
    isUpdating: updateRoleMutation.isPending,
    error,
    handleRoleChange,
  };
}
