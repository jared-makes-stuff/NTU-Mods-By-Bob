import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';

export interface ModuleReview {
  id: string;
  moduleCode: string;
  userId: string;
  rating: number;
  content?: string;
  assessmentWeightage?: Record<string, number>;
  term?: string;
  helpfulCount: number;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface ReviewsResponse {
  reviews: ModuleReview[];
  averageRating: number;
  totalReviews: number;
  averageWeightage: Record<string, number>;
}

export interface CreateReviewData {
  rating: number;
  content?: string;
  assessmentWeightage?: Record<string, number>;
  term?: string;
}

/**
 * Fetch all reviews for a module
 */
export function useModuleReviews(moduleCode: string | null) {
  return useQuery<ReviewsResponse>({
    queryKey: ['module-reviews', moduleCode],
    queryFn: async () => {
      const response = await apiClient.get(`/modules/${moduleCode}/reviews`);
      return response.data;
    },
    enabled: !!moduleCode,
  });
}

/**
 * Create a new review
 */
export function useCreateReview(moduleCode: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateReviewData) => {
      const response = await apiClient.post(`/modules/${moduleCode}/reviews`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-reviews', moduleCode] });
    },
  });
}

/**
 * Update an existing review
 */
export function useUpdateReview(moduleCode: string, reviewId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<CreateReviewData>) => {
      const response = await apiClient.put(`/modules/${moduleCode}/reviews/${reviewId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-reviews', moduleCode] });
    },
  });
}

/**
 * Delete a review
 */
export function useDeleteReview(moduleCode: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await apiClient.delete(`/modules/${moduleCode}/reviews/${reviewId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-reviews', moduleCode] });
    },
  });
}

/**
 * Vote a review as helpful
 */
export function useVoteReview(moduleCode: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await apiClient.post(`/modules/${moduleCode}/reviews/${reviewId}/vote`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-reviews', moduleCode] });
    },
  });
}
