import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useApiMutation, useApiQuery } from "@/hooks/useApi";
import { LOGIN_PATH } from "@/const";
import type { User } from "@/lib/types";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};

  const navigate = useNavigate();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useApiQuery<User>("/api/auth/me", ["auth", "me"], {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = useApiMutation<{ success: boolean }, undefined>(
    "/api/auth/logout",
    "post",
    {
      onSuccess: async () => {
        window.location.assign(redirectPath);
      },
    },
  );

  const logout = useCallback(() => logoutMutation.mutate(undefined), [logoutMutation]);

  useEffect(() => {
    if (redirectOnUnauthenticated && !isLoading && !user) {
      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) {
        navigate(redirectPath);
      }
    }
  }, [redirectOnUnauthenticated, isLoading, user, navigate, redirectPath]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading: isLoading || logoutMutation.isPending,
      error,
      logout,
      refresh: refetch,
    }),
    [user, isLoading, logoutMutation.isPending, error, logout, refetch],
  );
}
