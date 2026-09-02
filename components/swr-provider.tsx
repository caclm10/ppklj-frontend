"use client";

import * as React from "react";
import { SWRConfig } from "swr";
import { useRouter, usePathname } from "next/navigation";
import { ApiError } from "@/lib/api";

export function SwrProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <SWRConfig
            value={{
                revalidateOnFocus: true,
                shouldRetryOnError: false,
                onError: (error, key) => {
                    if (error instanceof ApiError && error.status === 401) {
                        const isUserCheck =
                            typeof key === "string" &&
                            key.includes("/api/user");
                        if (!isUserCheck && !pathname.startsWith("/login")) {
                            router.push("/login");
                        }
                    }
                },
            }}
        >
            {children}
        </SWRConfig>
    );
}
