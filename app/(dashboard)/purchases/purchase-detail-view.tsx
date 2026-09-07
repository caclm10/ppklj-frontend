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
    PlusCircle,
    Trash2,
} from "lucide-react";

import type { Purchase, AssetPurchase } from "@/lib/types";
import { fetcher, mutationFetcher } from "@/lib/api";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

    const {
        data: linkedAssets,
        isLoading: loadingAssets,
        mutate: mutateLinkedAssets,
    } = useSWR<AssetPurchase[]>(
        `/api/asset-purchases?purchase_id=${purchaseId}`,
        fetcher
    );

    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedBatch, setSelectedBatch] = React.useState<AssetPurchase | null>(null);
    const [batchSearch, setBatchSearch] = React.useState("");
    const [batchToDelete, setBatchToDelete] = React.useState<AssetPurchase | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const totalExpenditure = React.useMemo(() => {
        if (!Array.isArray(linkedAssets)) return 0;
        return linkedAssets.reduce((sum, item) => sum + (item.price || 0), 0);
    }, [linkedAssets]);

    const totalUnitsCount = React.useMemo(() => {
        if (!Array.isArray(linkedAssets)) return 0;
        return linkedAssets.reduce(
            (sum, item) =>
                sum +
                (item.quantity ||
                    item.assets_count ||
                    item.assets?.length ||
                    1),
            0
        );
    }, [linkedAssets]);

    const filteredAssets = React.useMemo(() => {
        if (!Array.isArray(linkedAssets)) return [];
        if (!searchQuery.trim()) return linkedAssets;

        const q = searchQuery.toLowerCase();
        return linkedAssets.filter(
            (item) =>
                item.name?.toLowerCase().includes(q) ||
                item.notes?.toLowerCase().includes(q) ||
                item.asset?.name?.toLowerCase().includes(q) ||
                item.asset?.number?.toLowerCase().includes(q) ||
                item.assets?.some(
                    (a) =>
                        a.name?.toLowerCase().includes(q) ||
                        a.number?.toLowerCase().includes(q)
                )
        );
    }, [linkedAssets, searchQuery]);

    const filteredBatchUnits = React.useMemo(() => {
        const units = selectedBatch?.assets || (selectedBatch?.asset ? [selectedBatch.asset] : []);
        if (!batchSearch.trim()) return units;
        const q = batchSearch.toLowerCase();
        return units.filter(
            (a) =>
                a.name?.toLowerCase().includes(q) ||
                a.number?.toLowerCase().includes(q)
        );
    }, [selectedBatch, batchSearch]);

    async function handleConfirmDelete() {
        if (!batchToDelete) return;
        setIsDeleting(true);
        try {
            await mutationFetcher(
                `/api/asset-purchases/${batchToDelete.id}`,
                "DELETE"
            );
            await mutateLinkedAssets();
            setBatchToDelete(null);
        } catch (err: unknown) {
            console.error("Gagal menghapus paket belanja:", err);
        } finally {
            setIsDeleting(false);
        }
    }

    if (loadingPurchase) {
        return (
            <div className="flex min-w-0 flex-col gap-6">
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
        <div className="flex min-w-0 flex-col gap-6">
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

                <div className="flex items-center gap-2">
                    <Button asChild>
                        <Link
                            href={
                                purchase.type === "pemeliharaan"
                                    ? `/purchases/${purchaseId}/maintenance`
                                    : `/purchases/${purchaseId}/procurement`
                            }
                        >
                            <PlusCircle className="mr-2 size-4" />
                            {purchase.type === "pemeliharaan"
                                ? "Catat Pemeliharaan Aset"
                                : "Catat Pengadaan Aset"}
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
                        <CardDescription className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                            <Layers className="size-4 text-primary" />
                            Total Unit Aset Dibiayai
                        </CardDescription>
                        <CardTitle className="text-base font-bold">
                            {loadingAssets ? (
                                <Skeleton className="h-6 w-12" />
                            ) : (
                                `${totalUnitsCount} Unit`
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <span className="text-xs text-muted-foreground">
                            {loadingAssets
                                ? "Memuat data..."
                                : `Tersebar dalam ${linkedAssets?.length || 0} paket pengadaan`}
                        </span>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
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
            <Card className="min-w-0">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Layers className="size-5 text-primary" />
                            <CardTitle className="text-lg">
                                Daftar Aset yang Dibiayai
                            </CardTitle>
                        </div>
                        <CardDescription>
                            Daftar paket pengadaan dan alokasi pemeliharaan aset
                            yang dibebankan pada pos belanja ini.
                        </CardDescription>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari paket belanja, catatan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 pl-8 text-sm"
                        />
                    </div>
                </CardHeader>

                <CardContent className="min-w-0 space-y-4">
                    <div className="overflow-hidden rounded-lg border">
                        <Table className="min-w-[800px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12 text-xs font-semibold">
                                        No
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold">
                                        Paket Belanja / Item
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold">
                                        Kuantitas
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold">
                                        Total Nilai (Rp)
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold">
                                        Harga Satuan
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold">
                                        Periode Garansi
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold">
                                        Catatan
                                    </TableHead>
                                    <TableHead className="w-28 text-right">
                                        <span className="sr-only">Aksi</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingAssets ? (
                                    Array.from({ length: 3 }).map((_, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <Skeleton className="h-4 w-4" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-40" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-5 w-16 rounded-full" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-24" />
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
                                                <Skeleton className="ml-auto h-8 w-20 rounded-md" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredAssets && filteredAssets.length > 0 ? (
                                    filteredAssets.map((item, index) => {
                                        const qty =
                                            item.quantity ||
                                            item.assets_count ||
                                            item.assets?.length ||
                                            1;
                                        const unitPrice =
                                            item.price && qty > 0
                                                ? Math.round(item.price / qty)
                                                : null;
                                        const rawName =
                                            item.name ||
                                            item.asset?.name ||
                                            "Paket Belanja";
                                        const name = rawName.replace(
                                            /\s*\(\d+\s*Unit\)/i,
                                            ""
                                        );
                                        const unitsAvailable =
                                            (item.assets && item.assets.length > 0) ||
                                            Boolean(item.asset);

                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-semibold text-foreground">
                                                        {name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className="font-mono text-xs"
                                                    >
                                                        {qty} Unit
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs font-medium">
                                                    {item.price
                                                        ? `Rp ${item.price.toLocaleString("id-ID")}`
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="text-xs font-medium text-muted-foreground">
                                                    {unitPrice
                                                        ? `Rp ${unitPrice.toLocaleString("id-ID")}`
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {item.start_date || item.end_date ? (
                                                        <span>
                                                            {item.start_date
                                                                ? formatDateIndo(item.start_date)
                                                                : "-"}
                                                            {" s.d. "}
                                                            {item.end_date
                                                                ? formatDateIndo(item.end_date)
                                                                : "Seterusnya"}
                                                        </span>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                                                    {item.notes || "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {unitsAvailable ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 gap-1 px-2 text-xs"
                                                                onClick={() => {
                                                                    setSelectedBatch(item);
                                                                    setBatchSearch("");
                                                                }}
                                                            >
                                                                <Layers className="size-3.5" />
                                                                <span>Lihat Unit</span>
                                                            </Button>
                                                        ) : null}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            title="Hapus Paket Belanja"
                                                            onClick={() => setBatchToDelete(item)}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            <span className="sr-only">
                                                                Hapus
                                                            </span>
                                                        </Button>
                                                    </div>
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
                                                    Belum ada aset yang dibiayai oleh belanja ini
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Paket pengadaan akan otomatis muncul di sini setelah dicatat.
                                                </p>
                                                <Button
                                                    size="sm"
                                                    className="mt-2"
                                                    asChild
                                                >
                                                    <Link
                                                        href={
                                                            purchase.type === "pemeliharaan"
                                                                ? `/purchases/${purchaseId}/maintenance`
                                                                : `/purchases/${purchaseId}/procurement`
                                                        }
                                                    >
                                                        <PlusCircle className="mr-2 size-4" />
                                                        {purchase.type === "pemeliharaan"
                                                            ? "Catat Pemeliharaan Aset"
                                                            : "Catat Pengadaan Aset"}
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Modal Rincian Unit Aset */}
            <Dialog
                open={Boolean(selectedBatch)}
                onOpenChange={(open) => !open && setSelectedBatch(null)}
            >
                <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Layers className="size-5 text-primary" />
                            {selectedBatch?.name || "Rincian Unit Aset"}
                        </DialogTitle>
                        <DialogDescription>
                            Daftar unit fisik yang dinaungi paket belanja ini (Total{" "}
                            {selectedBatch?.quantity ||
                                selectedBatch?.assets?.length ||
                                0}{" "}
                            unit).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative my-2">
                        <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari serial number atau nama perangkat..."
                            value={batchSearch}
                            onChange={(e) => setBatchSearch(e.target.value)}
                            className="h-9 pl-8 text-sm"
                        />
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12 text-xs font-semibold">
                                        No
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold">
                                        Serial Number
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold">
                                        Nama Perangkat
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold">
                                        Akhir Garansi
                                    </TableHead>
                                    <TableHead className="w-16 text-right">
                                        <span className="sr-only">Aksi</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBatchUnits.length > 0 ? (
                                    filteredBatchUnits.map((asset, idx) => {
                                        const isNetwork =
                                            asset.category === "jaringan";
                                        const detailHref = isNetwork
                                            ? `/network-assets/${asset.network_asset?.id || asset.id}`
                                            : `/licenses/${asset.id}`;

                                        return (
                                            <TableRow key={asset.id}>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs font-medium text-foreground">
                                                    {asset.number}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {asset.name}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatDateIndo(
                                                        asset.end_date ||
                                                            selectedBatch?.end_date
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="size-7"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={detailHref}
                                                            title="Buka detail aset"
                                                        >
                                                            <ExternalLink className="size-3.5" />
                                                            <span className="sr-only">
                                                                Buka Detail
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
                                            colSpan={5}
                                            className="py-8 text-center text-xs text-muted-foreground"
                                        >
                                            Tidak ada data unit fisik yang sesuai.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <DialogFooter className="mt-2">
                        <Button
                            variant="outline"
                            onClick={() => setSelectedBatch(null)}
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Alert Dialog Konfirmasi Hapus */}
            <AlertDialog
                open={Boolean(batchToDelete)}
                onOpenChange={(open) => !open && setBatchToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Paket Belanja?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus catatan paket belanja ini?
                            Aset fisik tidak akan terhapus, tetapi relasi paket belanja pada unit tersebut akan dilepas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Menghapus..." : "Hapus Paket"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
