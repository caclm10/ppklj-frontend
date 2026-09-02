"use client";

import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import {
    KeyRound,
    Calendar,
    ReceiptText,
    FileText,
    ArrowLeft,
    Pencil,
    ShieldCheck,
} from "lucide-react";

import type { Asset } from "@/lib/types";
import { fetcher } from "@/lib/api";
import { formatDateIndo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetLifecycleHistory } from "@/components/asset-lifecycle-history";

interface LicenseDetailViewProps {
    licenseId: number;
}

export function LicenseDetailView({ licenseId }: LicenseDetailViewProps) {
    const {
        data: license,
        isLoading,
        mutate,
    } = useSWR<Asset>(`/api/assets/${licenseId}`, fetcher);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-lg" />
                    <div className="space-y-1">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-36" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!license) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <KeyRound className="size-12 text-muted-foreground/50" />
                <div>
                    <h2 className="text-lg font-bold">
                        Lisensi Tidak Ditemukan
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Data lisensi software dengan ID #{licenseId} tidak
                        tersedia.
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/licenses">
                        <ArrowLeft className="mr-2 size-4" />
                        Kembali ke Daftar Lisensi
                    </Link>
                </Button>
            </div>
        );
    }

    const getValidityStatus = () => {
        if (!license.end_date) {
            return {
                label: "Tanpa Batas (Perpetual)",
                variant: "outline" as const,
                daysRemaining: null,
            };
        }

        const now = new Date();
        const endDate = new Date(license.end_date);
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                label: "Kadaluarsa",
                variant: "destructive" as const,
                daysRemaining: diffDays,
            };
        }
        if (diffDays <= 30) {
            return {
                label: `Segera Berakhir (${diffDays} hari)`,
                variant: "secondary" as const,
                daysRemaining: diffDays,
            };
        }
        return {
            label: `Aktif (${diffDays} hari lagi)`,
            variant: "default" as const,
            daysRemaining: diffDays,
        };
    };

    const status = getValidityStatus();

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/licenses">
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Kembali</span>
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">
                                {license.name}
                            </h1>
                            <Badge variant={status.variant}>
                                {status.label}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Kunci / SN:{" "}
                            <span className="font-mono font-medium text-foreground">
                                {license.number}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button asChild>
                        <Link href={`/licenses/${license.id}/edit`}>
                            <Pencil className="mr-2 size-4" />
                            Edit Lisensi
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                            <Calendar className="size-4 text-primary" />
                            Masa Berlaku
                        </CardDescription>
                        <CardTitle className="text-base font-bold">
                            {license.end_date ? (
                                formatDateIndo(license.end_date)
                            ) : (
                                <span className="font-normal text-muted-foreground italic">
                                    Perpetual (Tanpa Batas)
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <span className="text-xs text-muted-foreground">
                            {status.daysRemaining !== null
                                ? status.daysRemaining < 0
                                    ? `Telah lewat ${Math.abs(status.daysRemaining)} hari`
                                    : `Tersisa ${status.daysRemaining} hari aktif`
                                : "Lisensi permanen"}
                        </span>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                            <ReceiptText className="size-4 text-primary" />
                            Nilai Pengadaan
                        </CardDescription>
                        <CardTitle className="text-base font-bold">
                            {license.unit_price
                                ? `Rp ${license.unit_price.toLocaleString("id-ID")}`
                                : "-"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <span className="text-xs text-muted-foreground">
                            {license.purchases && license.purchases.length > 0
                                ? `${license.purchases.length} paket belanja tercatat`
                                : "Belanja langsung"}
                        </span>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                            <ShieldCheck className="size-4 text-primary" />
                            Kategori Aset
                        </CardDescription>
                        <CardTitle className="text-base font-bold">
                            Lisensi Perangkat Lunak
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <span className="text-xs text-muted-foreground">
                            Sistem Operasi / Firewall / Security
                        </span>
                    </CardContent>
                </Card>
            </div>

            {/* License Information Details */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <KeyRound className="size-5 text-primary" />
                        <CardTitle className="text-lg">
                            Rincian &amp; Catatan Lisensi
                        </CardTitle>
                    </div>
                    <CardDescription>
                        Informasi lengkap nomor lisensi dan catatan operasional.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1 rounded-lg border bg-muted/20 p-4">
                        <span className="text-xs text-muted-foreground">
                            Kunci Lisensi / Nomor Seri
                        </span>
                        <p className="font-mono text-base font-bold break-all text-foreground">
                            {license.number}
                        </p>
                    </div>

                    {license.notes ? (
                        <div className="space-y-1 rounded-lg border bg-muted/10 p-4">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <FileText className="size-3.5" />
                                Catatan &amp; Keterangan Penempatan
                            </span>
                            <p className="text-sm whitespace-pre-wrap text-foreground">
                                {license.notes}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-lg border bg-muted/5 p-4 text-xs text-muted-foreground italic">
                            Tidak ada catatan tambahan untuk lisensi ini.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* License Lifecycle & Renewal History */}
            <AssetLifecycleHistory
                assetId={license.id}
                onHistoryChange={() => mutate()}
            />
        </div>
    );
}
