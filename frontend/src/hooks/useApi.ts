import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useApiQuery<T>(
  path: string,
  queryKey: unknown[],
  options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">,
) {
  return useQuery<T, Error>({
    queryKey,
    queryFn: () => api.get<T>(path),
    ...options,
  });
}

type ApiPath<TVariables> = string | ((variables: TVariables) => string);

export function useApiMutation<TData = unknown, TVariables = unknown>(
  path: ApiPath<TVariables>,
  method: "post" | "patch" = "post",
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn">,
) {
  const queryClient = useQueryClient();
  return useMutation<TData, Error, TVariables>({
    mutationFn: (variables) => {
      const resolvedPath =
        typeof path === "function" ? path(variables) : path;
      return (method === "patch"
        ? api.patch<TData>(resolvedPath, variables as unknown)
        : api.post<TData>(resolvedPath, variables as unknown)) as Promise<TData>;
    },
    onSuccess: (...args) => {
      options?.onSuccess?.(...args);
      queryClient.invalidateQueries();
    },
    ...options,
  });
}
