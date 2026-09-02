"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

const routeTitleMap: Record<string, string> = {
    "": "Dashboard",
    "network-assets": "Perangkat Jaringan",
    licenses: "Lisensi Software",
    purchases: "Belanja",
    offices: "Lokasi Kantor",
    features: "Master Fitur & Tags",
    rmas: "Tracking RMA & Servis",
    new: "Tambah Baru",
    edit: "Edit",
};

export function DashboardHeader() {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();

    const segments = React.useMemo(() => {
        return pathname.split("/").filter(Boolean);
    }, [pathname]);

    return (
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/">PPKLJ</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {segments.length === 0 ? (
                            <>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                                </BreadcrumbItem>
                            </>
                        ) : (
                            segments.map((segment, index) => {
                                const isLast = index === segments.length - 1;
                                const href = `/${segments.slice(0, index + 1).join("/")}`;
                                const isNumeric = /^\d+$/.test(segment);
                                const title =
                                    routeTitleMap[segment] ||
                                    (isNumeric
                                        ? `Detail (#${segment})`
                                        : segment.charAt(0).toUpperCase() +
                                          segment.slice(1));

                                return (
                                    <React.Fragment key={href}>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            {isLast ? (
                                                <BreadcrumbPage>
                                                    {title}
                                                </BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink asChild>
                                                    <Link href={href}>
                                                        {title}
                                                    </Link>
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                    </React.Fragment>
                                );
                            })
                        )}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Ganti Tema"
                    onClick={() =>
                        setTheme(theme === "dark" ? "light" : "dark")
                    }
                    className="size-8"
                >
                    <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                    <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                </Button>
            </div>
        </header>
    );
}
