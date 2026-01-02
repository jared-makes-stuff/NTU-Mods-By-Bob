import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllUsers, updateUserRole } from "@/shared/api/user";

export function useAllUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => getAllUsers(),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => 
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
