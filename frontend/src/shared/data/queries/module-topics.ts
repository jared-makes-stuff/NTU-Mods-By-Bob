import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';

export interface ModuleTopic {
  id: string;
  moduleCode: string;
  name: string;
  duration?: string;
  weekTaught?: number;
  suggestedEdit?: string;
  editReason?: string;
  level: number;
  parentId?: string;
  submittedBy: string;
  upvotes: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  children?: ModuleTopic[];
}

export interface TopicsResponse {
  topics: ModuleTopic[];
}

export interface CreateTopicData {
  name: string;
  duration?: string;
  weekTaught?: number;
  suggestedEdit?: string;
  editReason?: string;
  level?: number;
  parentId?: string;
  orderIndex?: number;
}

/**
 * Fetch all topics for a module
 */
export function useModuleTopics(moduleCode: string | null) {
  return useQuery<TopicsResponse>({
    queryKey: ['module-topics', moduleCode],
    queryFn: async () => {
      const response = await apiClient.get(`/modules/${moduleCode}/topics`);
      return response.data;
    },
    enabled: !!moduleCode,
  });
}

/**
 * Create a new topic
 */
export function useCreateTopic(moduleCode: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateTopicData) => {
      const response = await apiClient.post(`/modules/${moduleCode}/topics`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-topics', moduleCode] });
    },
  });
}

/**
 * Update an existing topic
 */
export function useUpdateTopic(moduleCode: string, topicId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<CreateTopicData>) => {
      const response = await apiClient.put(`/modules/${moduleCode}/topics/${topicId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-topics', moduleCode] });
    },
  });
}

/**
 * Delete a topic
 */
export function useDeleteTopic(moduleCode: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (topicId: string) => {
      const response = await apiClient.delete(`/modules/${moduleCode}/topics/${topicId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-topics', moduleCode] });
    },
  });
}

/**
 * Upvote a topic
 */
export function useVoteTopic(moduleCode: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (topicId: string) => {
      const response = await apiClient.post(`/modules/${moduleCode}/topics/${topicId}/vote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-topics', moduleCode] });
    },
  });
}
