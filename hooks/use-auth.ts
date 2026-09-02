"use client";

import * as React from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { fetcher, loginFetcher, logoutFetcher } from "@/lib/api";
import type { LoginPayload, User } from "@/lib/types";

export function useAuth() {
    const router = useRouter();

    const {
        data: user,
        error,
        isLoading,
        mutate,
    } = useSWR<User>("/api/user", fetcher, {
        revalidateOnFocus: false,
        shouldRetryOnError: false,
    });

    const login = React.useCallback(
        async (payload: LoginPayload) => {
            const response = await loginFetcher("/api/login", { arg: payload });
            if (response.success && response.data?.user) {
                await mutate(response.data.user, false);
            }
            return response;
        },
        [mutate]
    );

    const logout = React.useCallback(async () => {
        try {
            await logoutFetcher("/api/logout");
        } finally {
            await mutate(undefined, false);
            router.push("/login");
            router.refresh();
        }
    }, [mutate, router]);

    return {
        user: error ? null : (user ?? null),
        isAuthenticated: Boolean(user && !error),
        isLoading,
        login,
        logout,
        mutate,
    };
}
