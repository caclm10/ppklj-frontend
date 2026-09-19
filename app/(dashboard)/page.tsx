"use client";

import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import {
    Server,
    KeyRound,
    ReceiptText,
    Building2,
    ArrowUpRight,
    ShieldAlert,
    ShieldCheck,
    Calendar,
    Wifi,
    Layers,
    Clock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Plus,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { fetcher } from "@/lib/api";
import { cn, formatDateIndo } from "@/lib/utils";
import type { NetworkAsset, Asset, Office } from "@/lib/types";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

function getDaysRemaining(endDateStr: string | null | undefined): number | null {
    if (!endDateStr) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    if (isNaN(end.getTime())) return null;
    end.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = React.useState<"network" | "license">(
        "network"
    );

    // Fetch data
    const { data: networkAssets = [], isLoading: loadingNetwork } = useSWR<
        NetworkAsset[]
    >("/api/network-assets", fetcher);

    const { data: licenseAssets = [], isLoading: loadingLicenses } = useSWR<
        Asset[]
    >("/api/assets?category=license", fetcher);

    const { data: offices = [], isLoading: loadingOffices } = useSWR<Office[]>(
        "/api/offices",
        fetcher
    );

    return (
        <div className="flex flex-col gap-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Selamat Datang, {user?.name || "Administrator"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Sistem Pengelolaan Perangkat Jaringan &amp; Lisensi (PPKLJ)
                    </p>
                </div>

                {/* Dashboard Split Switcher */}
                <div className="flex items-center rounded-lg border bg-muted/60 p-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab("network")}
                        className={cn(
                            "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all sm:text-sm",
                            activeTab === "network"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Server className="size-4" />
                        <span>Perangkat Jaringan</span>
                        <Badge
                            variant={activeTab === "network" ? "default" : "secondary"}
                            className="text-[11px] px-1.5 py-0"
                        >
                            {loadingNetwork ? "..." : networkAssets.length}
                        </Badge>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("license")}
                        className={cn(
                            "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all sm:text-sm",
                            activeTab === "license"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <KeyRound className="size-4" />
                        <span>Lisensi Software</span>
                        <Badge
                            variant={activeTab === "license" ? "default" : "secondary"}
                            className="text-[11px] px-1.5 py-0"
                        >
                            {loadingLicenses ? "..." : licenseAssets.length}
                        </Badge>
                    </button>
                </div>
            </div>

            {/* Render Selected View */}
            {activeTab === "network" ? (
                <NetworkDashboardView
                    networkAssets={networkAssets}
                    offices={offices}
                    loading={loadingNetwork || loadingOffices}
                />
            ) : (
                <LicenseDashboardView
                    licenses={licenseAssets}
                    loading={loadingLicenses}
                />
            )}
        </div>
    );
}

// ----------------------------------------------------------------------
// SUB-DASHBOARD: PERANGKAT JARINGAN
// ----------------------------------------------------------------------
interface NetworkDashboardProps {
    networkAssets: NetworkAsset[];
    offices: Office[];
    loading: boolean;
}

function NetworkDashboardView({
    networkAssets,
    offices,
    loading,
}: NetworkDashboardProps) {
    // Computations
    const totalAssets = networkAssets.length;

    const statusCounts = React.useMemo(() => {
        let aktif = 0;
        let belumDipasang = 0;
        let tidakAktif = 0;

        for (const item of networkAssets) {
            if (item.status === "aktif") aktif++;
            else if (item.status === "belum_dipasang") belumDipasang++;
            else if (item.status === "tidak_aktif") tidakAktif++;
        }
        return { aktif, belumDipasang, tidakAktif };
    }, [networkAssets]);

    const typeCounts = React.useMemo(() => {
        const counts: Record<string, number> = {
            "Access Point": 0,
            Switch: 0,
            Controller: 0,
        };
        for (const item of networkAssets) {
            if (item.type && counts[item.type] !== undefined) {
                counts[item.type]++;
            }
        }
        return counts;
    }, [networkAssets]);

    const warrantyStats = React.useMemo(() => {
        let active = 0;
        let expiringSoon = 0;
        let expired = 0;
        let unrecorded = 0;

        for (const item of networkAssets) {
            const endDate = item.asset?.end_date;
            const diff = getDaysRemaining(endDate);
            if (diff === null) {
                unrecorded++;
            } else if (diff < 0) {
                expired++;
            } else if (diff <= 60) {
                expiringSoon++;
            } else {
                active++;
            }
        }
        return { active, expiringSoon, expired, unrecorded };
    }, [networkAssets]);

    // Top units with warranty expiring or expired
    const criticalWarrantyUnits = React.useMemo(() => {
        return networkAssets
            .filter((item) => {
                const diff = getDaysRemaining(item.asset?.end_date);
                return diff !== null && diff <= 60;
            })
            .sort((a, b) => {
                const diffA = getDaysRemaining(a.asset?.end_date) ?? 99999;
                const diffB = getDaysRemaining(b.asset?.end_date) ?? 99999;
                return diffA - diffB;
            })
            .slice(0, 5);
    }, [networkAssets]);

    // Office distribution
    const officeDistribution = React.useMemo(() => {
        const map = new Map<string, number>();
        let unassigned = 0;

        for (const item of networkAssets) {
            if (item.office?.name) {
                map.set(item.office.name, (map.get(item.office.name) || 0) + 1);
            } else {
                unassigned++;
            }
        }

        const list = Array.from(map.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        if (unassigned > 0) {
            list.push({ name: "Belum Ditempatkan", count: unassigned });
        }
        return list;
    }, [networkAssets]);

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-28" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Perangkat Jaringan
                        </CardTitle>
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Server className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">
                            {totalAssets} <span className="text-sm font-normal text-muted-foreground">Unit</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Tercatat di seluruh kantor &amp; gudang
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Status Operasional Aktif
                        </CardTitle>
                        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                            {statusCounts.aktif}{" "}
                            <span className="text-sm font-normal text-muted-foreground">
                                ({totalAssets > 0 ? Math.round((statusCounts.aktif / totalAssets) * 100) : 0}%)
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Terpasang &amp; beroperasi normal
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Belum Terpasang (Inventory)
                        </CardTitle>
                        <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Layers className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                            {statusCounts.belumDipasang}{" "}
                            <span className="text-sm font-normal text-muted-foreground">Unit</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Siap dikonfigurasi / cadangan
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Garansi Kritis / Habis
                        </CardTitle>
                        <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                            <AlertTriangle className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-destructive">
                            {warrantyStats.expiringSoon + warrantyStats.expired}{" "}
                            <span className="text-sm font-normal text-muted-foreground">Unit</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {warrantyStats.expired} habis, {warrantyStats.expiringSoon} segera berakhir (&le;60 hr)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Breakdown Sections */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Device Type Composition */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Wifi className="size-5 text-primary" />
                            <CardTitle className="text-base font-semibold">
                                Komposisi Tipe Perangkat
                            </CardTitle>
                        </div>
                        <CardDescription>
                            Distribusi unit berdasarkan kategori fungsi perangkat keras
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {(["Access Point", "Switch", "Controller"] as const).map((t) => {
                            const count = typeCounts[t] || 0;
                            const pct = totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0;
                            return (
                                <div key={t} className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-foreground">{t}</span>
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {count} Unit ({pct}%)
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all",
                                                t === "Access Point"
                                                    ? "bg-primary"
                                                    : t === "Switch"
                                                      ? "bg-sky-500"
                                                      : "bg-indigo-500"
                                            )}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Office Distribution */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Building2 className="size-5 text-primary" />
                                <CardTitle className="text-base font-semibold">
                                    Distribusi Penempatan Kantor
                                </CardTitle>
                            </div>
                            <CardDescription>
                                Sebaran alokasi fisik unit perangkat di lokasi kerja
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/offices">
                                Kelola Kantor
                                <ArrowUpRight className="ml-1 size-3.5" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        {officeDistribution.length === 0 ? (
                            <p className="py-6 text-center text-xs text-muted-foreground">
                                Belum ada unit perangkat yang teralokasi.
                            </p>
                        ) : (
                            officeDistribution.slice(0, 5).map((loc) => (
                                <div
                                    key={loc.name}
                                    className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0"
                                >
                                    <span className="text-sm font-medium text-foreground">
                                        {loc.name}
                                    </span>
                                    <Badge variant="secondary" className="font-mono text-xs">
                                        {loc.count} Unit
                                    </Badge>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Critical Warranty Table */}
            <Card>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="size-5 text-destructive" />
                            <CardTitle className="text-base font-semibold">
                                Perangkat Membutuhkan Perpanjangan Garansi
                            </CardTitle>
                        </div>
                        <CardDescription>
                            Unit perangkat jaringan dengan sisa masa garansi &le; 60 hari atau sudah kedaluwarsa.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/network-assets">
                                Lihat Semua Perangkat
                                <ArrowUpRight className="ml-1 size-3.5" />
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="overflow-hidden rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Nama Perangkat</TableHead>
                                    <TableHead className="text-xs">Tipe &amp; Merk</TableHead>
                                    <TableHead className="text-xs">Nomor Seri</TableHead>
                                    <TableHead className="text-xs">Lokasi Kantor</TableHead>
                                    <TableHead className="text-xs">Batas Garansi</TableHead>
                                    <TableHead className="text-xs">Status Garansi</TableHead>
                                    <TableHead className="text-right text-xs">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {criticalWarrantyUnits.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-24 text-center text-xs text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <CheckCircle2 className="size-5 text-emerald-500" />
                                                <span>Tidak ada perangkat dengan garansi kritis. Semua unit aman!</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    criticalWarrantyUnits.map((item) => {
                                        const diff = getDaysRemaining(item.asset?.end_date);
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="text-xs font-semibold">
                                                    {item.asset?.name || "Perangkat Jaringan"}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {item.type} ({item.brand})
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {item.asset?.number || "-"}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {item.office?.name || (
                                                        <span className="text-muted-foreground italic">
                                                            Belum Ditempatkan
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {item.asset?.end_date
                                                        ? formatDateIndo(item.asset.end_date)
                                                        : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {diff !== null && diff < 0 ? (
                                                        <Badge variant="destructive" className="text-[10px]">
                                                            Habis ({Math.abs(diff)} hr lalu)
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            {diff} hari lagi
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                                        <Link href={`/network-assets/${item.id}`}>
                                                            Detail
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ----------------------------------------------------------------------
// SUB-DASHBOARD: LISENSI SOFTWARE
// ----------------------------------------------------------------------
interface LicenseDashboardProps {
    licenses: Asset[];
    loading: boolean;
}

function LicenseDashboardView({ licenses, loading }: LicenseDashboardProps) {
    const totalLicenses = licenses.length;

    const licenseStats = React.useMemo(() => {
        let active = 0;
        let expiringSoon = 0;
        let expired = 0;
        let perpetual = 0;
        let totalCost = 0;

        for (const item of licenses) {
            if (typeof item.unit_price === "number") {
                totalCost += item.unit_price;
            }

            const diff = getDaysRemaining(item.end_date);
            if (diff === null) {
                perpetual++;
            } else if (diff < 0) {
                expired++;
            } else if (diff <= 30) {
                expiringSoon++;
            } else {
                active++;
            }
        }

        return { active, expiringSoon, expired, perpetual, totalCost };
    }, [licenses]);

    // Sorted licenses by validity
    const upcomingRenewals = React.useMemo(() => {
        return licenses
            .filter((item) => item.end_date)
            .sort((a, b) => {
                const diffA = getDaysRemaining(a.end_date) ?? 99999;
                const diffB = getDaysRemaining(b.end_date) ?? 99999;
                return diffA - diffB;
            })
            .slice(0, 5);
    }, [licenses]);

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-28" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Skeleton className="h-64 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Lisensi Terdaftar
                        </CardTitle>
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <KeyRound className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">
                            {totalLicenses} <span className="text-sm font-normal text-muted-foreground">Lisensi</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            OS, Firewall, Antivirus, &amp; Dukungan Cloud
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Lisensi Aktif
                        </CardTitle>
                        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                            {licenseStats.active + licenseStats.perpetual}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {licenseStats.active} berjangka aktif, {licenseStats.perpetual} perpetual
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Segera Kedaluwarsa (&le;30 Hari)
                        </CardTitle>
                        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Clock className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                            {licenseStats.expiringSoon}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Perlu perpanjangan melalui MAK 52
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Kedaluwarsa / Expired
                        </CardTitle>
                        <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                            <XCircle className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-destructive">
                            {licenseStats.expired}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Layanan ATS terhenti
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* License Breakdown & Value Summary */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ReceiptText className="size-5 text-primary" />
                            <CardTitle className="text-base font-semibold">
                                Nilai Investasi &amp; Anggaran Lisensi
                            </CardTitle>
                        </div>
                        <CardDescription>
                            Total nilai perolehan lisensi software yang tercatat
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="flex items-baseline justify-between border-b pb-3">
                            <span className="text-sm text-muted-foreground">Total Nilai Lisensi Tercatat:</span>
                            <span className="text-xl font-bold font-mono text-foreground">
                                Rp {licenseStats.totalCost.toLocaleString("id-ID")}
                            </span>
                        </div>
                        <div className="flex items-baseline justify-between border-b pb-3">
                            <span className="text-sm text-muted-foreground">Rata-rata Nilai per Lisensi:</span>
                            <span className="text-sm font-semibold font-mono text-muted-foreground">
                                Rp{" "}
                                {totalLicenses > 0
                                    ? Math.round(licenseStats.totalCost / totalLicenses).toLocaleString("id-ID")
                                    : "0"}
                            </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                            <span className="text-sm text-muted-foreground">Lisensi Permanen (Perpetual):</span>
                            <Badge variant="outline" className="text-xs">
                                {licenseStats.perpetual} Lisensi
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Fast Access Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Tindakan Cepat Lisensi
                        </CardTitle>
                        <CardDescription>
                            Akses langsung modul perpanjangan dan pendaftaran lisensi
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Button variant="outline" className="h-auto flex-col items-start gap-1 p-3 text-left" asChild>
                            <Link href="/licenses/new">
                                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                    <Plus className="size-4 text-primary" />
                                    <span>Tambah Lisensi Baru</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    Daftarkan kontrak kunci lisensi baru
                                </span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto flex-col items-start gap-1 p-3 text-left" asChild>
                            <Link href="/purchases">
                                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                    <ReceiptText className="size-4 text-primary" />
                                    <span>Perpanjangan (MAK 52)</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    Buka pos belanja pemeliharaan
                                </span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto flex-col items-start gap-1 p-3 text-left sm:col-span-2" asChild>
                            <Link href="/licenses">
                                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                    <KeyRound className="size-4 text-primary" />
                                    <span>Buka Seluruh Inventaris Lisensi</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    Lihat daftar lengkap, filter status, dan riwayat siklus hidup
                                </span>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Renewals Schedule Table */}
            <Card>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Calendar className="size-5 text-primary" />
                            <CardTitle className="text-base font-semibold">
                                Agenda Perpanjangan &amp; Masa Berlaku Terdekat
                            </CardTitle>
                        </div>
                        <CardDescription>
                            Daftar lisensi berjangka yang mendekati atau telah melewati batas akhir masa aktif.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/licenses">
                            Lihat Semua Lisensi
                            <ArrowUpRight className="ml-1 size-3.5" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="overflow-hidden rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Nama Lisensi / Software</TableHead>
                                    <TableHead className="text-xs">Kunci / Kontrak</TableHead>
                                    <TableHead className="text-xs">Masa Berlaku</TableHead>
                                    <TableHead className="text-xs">Status Masa Aktif</TableHead>
                                    <TableHead className="text-xs">Biaya Pengadaan</TableHead>
                                    <TableHead className="text-right text-xs">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {upcomingRenewals.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="h-24 text-center text-xs text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <CheckCircle2 className="size-5 text-emerald-500" />
                                                <span>Tidak ada lisensi dengan masa aktif terbatas.</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    upcomingRenewals.map((item) => {
                                        const diff = getDaysRemaining(item.end_date);
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="text-xs font-semibold">
                                                    {item.name}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {item.number}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {item.end_date
                                                        ? formatDateIndo(item.end_date)
                                                        : "Perpetual"}
                                                </TableCell>
                                                <TableCell>
                                                    {diff !== null && diff < 0 ? (
                                                        <Badge variant="destructive" className="text-[10px]">
                                                            Kadaluarsa ({Math.abs(diff)} hr lalu)
                                                        </Badge>
                                                    ) : diff !== null && diff <= 30 ? (
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            {diff} hari lagi
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="default" className="text-[10px]">
                                                            Aktif ({diff} hari lagi)
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {item.unit_price
                                                        ? `Rp ${item.unit_price.toLocaleString("id-ID")}`
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                                        <Link href={`/licenses/${item.id}`}>
                                                            Detail
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
