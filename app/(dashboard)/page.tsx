"use client";

import Link from "next/link";
import {
    Server,
    KeyRound,
    ReceiptText,
    Building2,
    ArrowUpRight,
} from "lucide-react";
import useSWR from "swr";

import { useAuth } from "@/hooks/use-auth";
import { fetcher } from "@/lib/api";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
    const { user } = useAuth();

    const { data: networkAssetsData, isLoading: loadingNetwork } = useSWR<
        unknown[]
    >("/api/network-assets", fetcher);
    const { data: assetsData, isLoading: loadingAssets } = useSWR<unknown[]>(
        "/api/assets?category=license",
        fetcher
    );
    const { data: purchasesData, isLoading: loadingPurchases } = useSWR<
        unknown[]
    >("/api/purchases", fetcher);
    const { data: officesData, isLoading: loadingOffices } = useSWR<unknown[]>(
        "/api/offices",
        fetcher
    );

    const stats = [
        {
            title: "Perangkat Jaringan",
            value: loadingNetwork
                ? null
                : Array.isArray(networkAssetsData)
                  ? networkAssetsData.length
                  : 0,
            description: "Total Switch, Router, AP & Firewall",
            href: "/network-assets",
            icon: Server,
        },
        {
            title: "Lisensi Software",
            value: loadingAssets
                ? null
                : Array.isArray(assetsData)
                  ? assetsData.length
                  : 0,
            description: "Lisensi OS, Firewall & Support",
            href: "/licenses",
            icon: KeyRound,
        },
        {
            title: "Belanja",
            value: loadingPurchases
                ? null
                : Array.isArray(purchasesData)
                  ? purchasesData.length
                  : 0,
            description: "Belanja Modal (53) & Pemeliharaan (52)",
            href: "/purchases",
            icon: ReceiptText,
        },
        {
            title: "Lokasi Kantor",
            value: loadingOffices
                ? null
                : Array.isArray(officesData)
                  ? officesData.length
                  : 0,
            description: "Kantor Pusat & Kantor Wilayah",
            href: "/offices",
            icon: Building2,
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">
                    Selamat Datang, {user?.name || "Administrator"}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Sistem Pengelolaan Perangkat Jaringan &amp; Lisensi (PPKLJ)
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Link key={stat.title} href={stat.href} className="group">
                        <Card className="transition-all hover:border-primary/50 hover:shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                                    <stat.icon className="size-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold tracking-tight">
                                    {stat.value === null ? (
                                        <Skeleton className="h-8 w-16" />
                                    ) : (
                                        stat.value
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Alur Manajemen Aset &amp; Siklus Hidup
                        </CardTitle>
                        <CardDescription>
                            Ringkasan siklus pencatatan pengadaan hingga
                            pemeliharaan
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                1
                            </div>
                            <p>
                                <strong className="text-foreground">
                                    Input Kantor &amp; Belanja:
                                </strong>{" "}
                                Siapkan master data lokasi dan anggaran belanja
                                53 (Modal) / 52 (Pemeliharaan).
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                2
                            </div>
                            <p>
                                <strong className="text-foreground">
                                    Catat Aset &amp; Spesifikasi:
                                </strong>{" "}
                                Masukkan serial number, merk, tipe, IP Address,
                                dan fitur teknis perangkat.
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                3
                            </div>
                            <p>
                                <strong className="text-foreground">
                                    Riwayat Belanja &amp; Perpanjangan:
                                </strong>{" "}
                                Catat perpanjangan garansi/support tahunan tanpa
                                menghapus data pengadaan awal.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Akses Cepat Modul
                        </CardTitle>
                        <CardDescription>
                            Tautan langsung ke fitur-fitur operasional
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Link
                            href="/network-assets"
                            className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-muted/50"
                        >
                            <span>Daftar Perangkat Jaringan</span>
                            <ArrowUpRight className="size-4 text-muted-foreground" />
                        </Link>
                        <Link
                            href="/licenses"
                            className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-muted/50"
                        >
                            <span>Daftar Lisensi Software</span>
                            <ArrowUpRight className="size-4 text-muted-foreground" />
                        </Link>
                        <Link
                            href="/purchases"
                            className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-muted/50"
                        >
                            <span>Kelola Belanja</span>
                            <ArrowUpRight className="size-4 text-muted-foreground" />
                        </Link>
                        <Link
                            href="/offices"
                            className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-muted/50"
                        >
                            <span>Kelola Lokasi Kantor</span>
                            <ArrowUpRight className="size-4 text-muted-foreground" />
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
