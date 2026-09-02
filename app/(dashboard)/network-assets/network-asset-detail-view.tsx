"use client";

import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import {
    Server,
    Building2,
    Tags,
    ArrowLeft,
    Pencil,
    ShieldCheck,
    Globe,
    Cpu,
    Truck,
} from "lucide-react";

import type { NetworkAsset } from "@/lib/types";
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
import { AssetRmaHistory } from "@/components/asset-rma-history";

interface NetworkAssetDetailViewProps {
    assetId: number;
}

export function NetworkAssetDetailView({
    assetId,
}: NetworkAssetDetailViewProps) {
    const {
        data: networkAsset,
        isLoading,
        mutate,
    } = useSWR<NetworkAsset>(`/api/network-assets/${assetId}`, fetcher);

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
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!networkAsset) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <Server className="size-12 text-muted-foreground/50" />
                <div>
                    <h2 className="text-lg font-bold">
                        Perangkat Tidak Ditemukan
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Data perangkat jaringan dengan ID #{assetId} tidak
                        tersedia.
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/network-assets">
                        <ArrowLeft className="mr-2 size-4" />
                        Kembali ke Inventaris
                    </Link>
                </Button>
            </div>
        );
    }

    const statusBadge = () => {
        switch (networkAsset.status) {
            case "aktif":
                return (
                    <Badge variant="default" className="font-medium">
                        Aktif Digunakan
                    </Badge>
                );
            case "belum_dipasang":
                return (
                    <Badge variant="secondary" className="font-medium">
                        Belum Dipasang / Cadangan
                    </Badge>
                );
            case "tidak_aktif":
                return (
                    <Badge variant="destructive" className="font-medium">
                        Tidak Aktif / Rusak
                    </Badge>
                );
            default:
                return <Badge variant="outline">{networkAsset.status}</Badge>;
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header with Navigation & Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/network-assets">
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Kembali</span>
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">
                                {networkAsset.brand} {networkAsset.model}
                            </h1>
                            {statusBadge()}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {networkAsset.type} &bull; SN:{" "}
                            <span className="font-mono font-medium text-foreground">
                                {networkAsset.asset?.number || "-"}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link
                            href={`/rmas/new?asset_id=${networkAsset.asset_id}`}
                        >
                            <Truck className="mr-2 size-4" />
                            Ajukan RMA / Servis
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/network-assets/${networkAsset.id}/edit`}>
                            <Pencil className="mr-2 size-4" />
                            Edit Perangkat
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="bg-card">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                            <Building2 className="size-4 text-primary" />
                            Lokasi Penempatan
                        </CardDescription>
                        <CardTitle className="text-base font-bold">
                            {networkAsset.office?.name || (
                                <span className="font-normal text-muted-foreground italic">
                                    Belum Ditentukan
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <span className="text-xs text-muted-foreground">
                            {networkAsset.office?.type === "pusat"
                                ? "Kantor Pusat"
                                : networkAsset.office?.type === "vertikal"
                                  ? "Kantor Wilayah / Vertikal"
                                  : "Status Penempatan"}
                        </span>
                    </CardContent>
                </Card>

                <Card className="bg-card">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                            <Globe className="size-4 text-primary" />
                            Alamat IP &amp; Hostname
                        </CardDescription>
                        <CardTitle className="font-mono text-base font-bold">
                            {networkAsset.ip || (
                                <span className="font-sans font-normal text-muted-foreground italic">
                                    Belum dikonfigurasi
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <span className="font-mono text-xs text-muted-foreground">
                            {networkAsset.hostname
                                ? `Hostname: ${networkAsset.hostname}`
                                : "Tanpa Hostname"}
                        </span>
                    </CardContent>
                </Card>

                <Card className="bg-card">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                            <ShieldCheck className="size-4 text-primary" />
                            Garansi / Support
                        </CardDescription>
                        <CardTitle className="text-base font-bold">
                            {networkAsset.asset?.end_date ? (
                                formatDateIndo(networkAsset.asset.end_date)
                            ) : (
                                <span className="font-normal text-muted-foreground italic">
                                    Tidak Dicatat
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <span className="text-xs text-muted-foreground">
                            {networkAsset.asset?.unit_price
                                ? `Nilai Aset: Rp ${networkAsset.asset.unit_price.toLocaleString("id-ID")}`
                                : "Tanpa Informasi Nilai"}
                        </span>
                    </CardContent>
                </Card>
            </div>

            {/* Specifications Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Cpu className="size-5 text-primary" />
                        <CardTitle className="text-lg">
                            Spesifikasi &amp; Identitas Teknis
                        </CardTitle>
                    </div>
                    <CardDescription>
                        Rincian spesifikasi perangkat keras dan nomor registrasi
                        aset.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1 rounded-lg border bg-muted/20 p-3">
                            <span className="text-xs text-muted-foreground">
                                Merk / Brand
                            </span>
                            <p className="text-sm font-semibold">
                                {networkAsset.brand}
                            </p>
                        </div>
                        <div className="space-y-1 rounded-lg border bg-muted/20 p-3">
                            <span className="text-xs text-muted-foreground">
                                Model / Seri
                            </span>
                            <p className="text-sm font-semibold">
                                {networkAsset.model}
                            </p>
                        </div>
                        <div className="space-y-1 rounded-lg border bg-muted/20 p-3">
                            <span className="text-xs text-muted-foreground">
                                Kategori Tipe
                            </span>
                            <p className="text-sm font-semibold">
                                {networkAsset.type}
                            </p>
                        </div>
                        <div className="space-y-1 rounded-lg border bg-muted/20 p-3">
                            <span className="text-xs text-muted-foreground">
                                Nomor Seri (SN)
                            </span>
                            <p className="font-mono text-sm font-semibold">
                                {networkAsset.asset?.number || "-"}
                            </p>
                        </div>
                    </div>

                    {/* Features Tags */}
                    <div className="space-y-2">
                        <h4 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            <Tags className="size-3.5" />
                            Tag Fitur Teknis
                        </h4>
                        <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/10 p-4">
                            {networkAsset.features &&
                            networkAsset.features.length > 0 ? (
                                networkAsset.features.map((feature) => (
                                    <Badge
                                        key={feature.id}
                                        variant="secondary"
                                        className="px-2.5 py-1 text-xs"
                                    >
                                        {feature.name}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-xs text-muted-foreground italic">
                                    Tidak ada tag fitur teknis yang disematkan
                                    pada perangkat ini.
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Asset Lifecycle & Maintenance Purchase History */}
            {networkAsset.asset_id && (
                <AssetLifecycleHistory
                    assetId={networkAsset.asset_id}
                    onHistoryChange={() => mutate()}
                />
            )}

            {/* Asset RMA & Repair History */}
            {networkAsset.asset_id && (
                <AssetRmaHistory assetId={networkAsset.asset_id} />
            )}
        </div>
    );
}
