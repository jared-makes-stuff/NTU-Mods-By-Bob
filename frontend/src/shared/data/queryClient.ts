import { QueryClient } from "@tanstack/react-query";

/**
 * Create a QueryClient instance with app defaults.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 60_000,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
