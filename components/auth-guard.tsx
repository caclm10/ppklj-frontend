"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-svh w-full flex-col gap-4 bg-background p-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Skeleton className="h-28 w-full rounded-xl" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                </div>
                <Skeleton className="mt-4 h-80 w-full rounded-xl" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
