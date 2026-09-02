"use client";

import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import {
    ReceiptText,
    Calendar,
    ArrowLeft,
    Layers,
    Server,
    KeyRound,
    ExternalLink,
    Search,
} from "lucide-react";

import type { Purchase, AssetPurchaseHistory } from "@/lib/types";
import { fetcher } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface PurchaseDetailViewProps {
    purchaseId: number;
}

export function PurchaseDetailView({ purchaseId }: PurchaseDetailViewProps) {
    const { data: purchase, isLoading: loadingPurchase } = useSWR<Purchase>(
        `/api/purchases/${purchaseId}`,
        fetcher
    );

    const { data: linkedAssets, isLoading: loadingAssets } = useSWR<
        AssetPurchaseHistory[]
    >(`/api/asset-purchases?purchase_id=${purchaseId}`, fetcher);

    const [searchQuery, setSearchQuery] = React.useState("");

    const totalExpenditure = React.useMemo(() => {
        if (!Array.isArray(linkedAssets)) return 0;
        return linkedAssets.reduce((sum, item) => sum + (item.price || 0), 0);
    }, [linkedAssets]);

    const filteredAssets = React.useMemo(() => {
        if (!Array.isArray(linkedAssets)) return [];
        if (!searchQuery.trim()) return linkedAssets;

        const q = searchQuery.toLowerCase();
        return linkedAssets.filter(
            (item) =>
                item.asset?.name?.toLowerCase().includes(q) ||
                item.asset?.number?.toLowerCase().includes(q) ||
                item.notes?.toLowerCase().includes(q)
        );
    }, [linkedAssets, searchQuery]);

    if (loadingPurchase) {
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

    if (!purchase) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <ReceiptText className="size-12 text-muted-foreground/50" />
                <div>
                    <h2 className="text-lg font-bold">
                        Belanja Tidak Ditemukan
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Data belanja dengan ID #{purchaseId} tidak tersedia.
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/purchases">
                        <ArrowLeft className="mr-2 size-4" />
                        Kembali ke Daftar Belanja
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/purchases">
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Kembali</span>
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">
                                Belanja Tahun {purchase.year}
                            </h1>
                            <Badge
                                variant={
                                    purchase.type === "modal"
                                        ? "default"
                                        : "secondary"
                                }
                                className="font-medium"
                            >
                                {purchase.type === "modal"
                                    ? "53 - Belanja Modal"
                                    : "52 - Belanja Pemeliharaan"}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {purchase.description || "Tanpa uraian keterangan"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                            <Calendar className="size-4 text-primary" />
                            Tahun Anggaran &amp; Akun
                        </CardDescription>
                        <CardTitle className="text-base font-bold">
                            Tahun {purchase.year}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <span className="text-xs text-muted-foreground">
                            {purchase.type === "modal"
                                ? "Akun 53 (Pengadaan Baru)"
                                : "Akun 52 (Pemeliharaan & Garansi)"}
                        </span>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                            <Layers className="size-4 text-primary" />
                            Total Aset Terkait
                        </CardDescription>
                        <CardTitle className="text-base font-bold">
                            {loadingAssets ? (
                                <Skeleton className="h-6 w-12" />
                            ) : (
                                `${linkedAssets?.length || 0} Aset / Item`
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <span className="text-xs text-muted-foreground">
                            Perangkat Jaringan &amp; Lisensi
                        </span>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                            <ReceiptText className="size-4 text-primary" />
                            Total Realisasi Nilai Belanja
                        </CardDescription>
                        <CardTitle className="text-base font-bold">
                            {loadingAssets ? (
                                <Skeleton className="h-6 w-28" />
                            ) : (
                                `Rp ${totalExpenditure.toLocaleString("id-ID")}`
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <span className="text-xs text-muted-foreground">
                            Akumulasi biaya transaksi tercatat
                        </span>
                    </CardContent>
                </Card>
            </div>

            {/* Linked Assets List Section */}
            <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Layers className="size-5 text-primary" />
                            <CardTitle className="text-lg">
                                Daftar Aset yang Dibiayai
                            </CardTitle>
                        </div>
                        <CardDescription>
                            Daftar perangkat jaringan dan lisensi software yang
                            terhubung dengan paket belanja ini.
                        </CardDescription>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari aset, nomor seri, catatan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 pl-8 text-sm"
                        />
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12 text-xs font-semibold">
                                        No
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold">
                                        Nama Aset / Perangkat
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold">
                                        Kategori
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold">
                                        Nomor Seri / Kunci Lisensi
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold">
                                        Nilai Alokasi (Rp)
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold">
                                        Periode Berlaku / Garansi
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold">
                                        Catatan
                                    </TableHead>
                                    <TableHead className="w-16 text-right">
                                        <span className="sr-only">Aksi</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingAssets ? (
                                    Array.from({ length: 4 }).map((_, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <Skeleton className="h-4 w-4" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-36" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-5 w-20 rounded-full" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-28" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-24" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-28" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-36" />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredAssets &&
                                  filteredAssets.length > 0 ? (
                                    filteredAssets.map((item, index) => {
                                        const asset = item.asset;
                                        const isNetwork =
                                            asset?.category === "jaringan";
                                        const detailHref = isNetwork
                                            ? `/network-assets/${asset?.network_asset?.id || item.asset_id}`
                                            : `/licenses/${item.asset_id}`;

                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-semibold text-foreground">
                                                        {asset?.name || "-"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {isNetwork ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="flex w-fit items-center gap-1 text-[11px] font-normal"
                                                        >
                                                            <Server className="size-3 text-primary" />
                                                            Perangkat Jaringan
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="flex w-fit items-center gap-1 text-[11px] font-normal"
                                                        >
                                                            <KeyRound className="size-3 text-primary" />
                                                            Lisensi Software
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-foreground">
                                                    {asset?.number || "-"}
                                                </TableCell>
                                                <TableCell className="text-xs font-medium">
                                                    {item.price
                                                        ? `Rp ${item.price.toLocaleString("id-ID")}`
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {item.start_date ||
                                                    item.end_date ? (
                                                        <span>
                                                            {item.start_date ||
                                                                "-"}
                                                            {" s.d "}
                                                            {item.end_date ||
                                                                "Seterusnya"}
                                                        </span>
                                                    ) : (
                                                        <span className="italic">
                                                            Tidak ditentukan
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                                                    {item.notes || "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="size-8"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={detailHref}
                                                            title="Buka Detail Aset"
                                                        >
                                                            <ExternalLink className="size-4" />
                                                            <span className="sr-only">
                                                                Buka Detail Aset
                                                            </span>
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="h-32 text-center text-sm text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <Layers className="mb-1 size-8 text-muted-foreground/40" />
                                                <p className="font-medium">
                                                    Belum ada aset yang dibiayai
                                                    oleh belanja ini
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Aset akan otomatis muncul di
                                                    sini ketika ditautkan saat
                                                    input perangkat/lisensi baru
                                                    atau saat pencatatan
                                                    pemeliharaan.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
