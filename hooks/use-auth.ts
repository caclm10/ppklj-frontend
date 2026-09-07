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
                await mutate(response.data.user, { revalidate: false });
            }
            return response;
        },
        [mutate]
    );

    const logout = React.useCallback(async () => {
        try {
            await logoutFetcher("/api/logout");
        } finally {
            await mutate(undefined, { revalidate: false });
            window.location.href = "/login";
        }
    }, [mutate]);

    const currentUser = user && typeof user === "object" && "id" in user ? user : null;

    return {
        user: currentUser,
        isAuthenticated: Boolean(currentUser),
        isLoading,
        login,
        logout,
        mutate,
    };
}
