"use client";

import * as React from "react";
import useSWR from "swr";
import {
    History,
    Plus,
    Trash2,
    Calendar,
    ReceiptText,
    Loader2,
    AlertCircle,
} from "lucide-react";

import type { AssetPurchaseHistory } from "@/lib/types";
import { fetcher, mutationFetcher, ApiError } from "@/lib/api";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AssetPurchaseFormDialog } from "./asset-purchase-form-dialog";

interface AssetLifecycleHistoryProps {
    assetId: number;
    onHistoryChange?: () => void;
}

export function AssetLifecycleHistory({
    assetId,
    onHistoryChange,
}: AssetLifecycleHistoryProps) {
    const {
        data: history,
        isLoading,
        mutate,
    } = useSWR<AssetPurchaseHistory[]>(
        assetId ? `/api/asset-purchases?asset_id=${assetId}` : null,
        fetcher
    );

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [itemToDelete, setItemToDelete] =
        React.useState<AssetPurchaseHistory | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    const handleSuccess = async () => {
        await mutate();
        onHistoryChange?.();
    };

    async function handleDeleteConfirm() {
        if (!itemToDelete) return;
        setIsDeleting(true);
        setDeleteError(null);

        try {
            await mutationFetcher(
                `/api/asset-purchases/${itemToDelete.id}`,
                "DELETE"
            );
            await mutate();
            onHistoryChange?.();
            setItemToDelete(null);
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                setDeleteError(
                    err.message || "Gagal menghapus riwayat belanja."
                );
            } else if (err instanceof Error) {
                setDeleteError(err.message);
            } else {
                setDeleteError("Terjadi kesalahan sistem saat menghapus data.");
            }
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <History className="size-5 text-primary" />
                        <CardTitle className="text-lg">
                            Riwayat Siklus Hidup &amp; Belanja
                        </CardTitle>
                    </div>
                    <CardDescription>
                        Histori paket pengadaan awal, perpanjangan garansi, dan
                        belanja pemeliharaan berkala.
                    </CardDescription>
                </div>
                <Button
                    size="sm"
                    onClick={() => setIsFormOpen(true)}
                    className="w-full sm:w-auto"
                >
                    <Plus data-icon="inline-start" className="size-4" />
                    Catat Belanja / Pemeliharaan
                </Button>
            </CardHeader>

            <CardContent className="space-y-4">
                {deleteError && (
                    <Alert variant="destructive">
                        <AlertCircle data-icon="inline-start" />
                        <AlertTitle>Gagal Menghapus</AlertTitle>
                        <AlertDescription>{deleteError}</AlertDescription>
                    </Alert>
                )}

                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-xs font-semibold">
                                    No
                                </TableHead>
                                <TableHead className="text-xs font-semibold">
                                    Paket Belanja
                                </TableHead>
                                <TableHead className="text-xs font-semibold">
                                    Periode Garansi / Kontrak
                                </TableHead>
                                <TableHead className="text-xs font-semibold">
                                    Nilai (Rp)
                                </TableHead>
                                <TableHead className="text-xs font-semibold">
                                    Catatan / Uraian
                                </TableHead>
                                <TableHead className="w-16 text-right">
                                    <span className="sr-only">Aksi</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <Skeleton className="h-4 w-4" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-36" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-28" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-24" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-40" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : history && history.length > 0 ? (
                                history.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-semibold">
                                                        Tahun{" "}
                                                        {item.purchase?.year ||
                                                            "-"}
                                                    </span>
                                                    <Badge
                                                        variant={
                                                            item.purchase
                                                                ?.type ===
                                                            "modal"
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                        className="px-1.5 py-0 text-[10px]"
                                                    >
                                                        {item.purchase?.type ===
                                                        "modal"
                                                            ? "53 Modal"
                                                            : "52 Pemeliharaan"}
                                                    </Badge>
                                                </div>
                                                {item.purchase?.description && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {
                                                            item.purchase
                                                                .description
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.start_date ||
                                            item.end_date ? (
                                                <div className="flex items-center gap-1 text-xs text-foreground">
                                                    <Calendar className="size-3.5 text-muted-foreground" />
                                                    <span>
                                                        {item.start_date || "-"}
                                                        {" s.d "}
                                                        {item.end_date ||
                                                            "Seterusnya"}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">
                                                    Tidak ditentukan
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">
                                            {item.price
                                                ? `Rp ${item.price.toLocaleString("id-ID")}`
                                                : "-"}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {item.notes || "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => {
                                                    setDeleteError(null);
                                                    setItemToDelete(item);
                                                }}
                                            >
                                                <Trash2 className="size-4" />
                                                <span className="sr-only">
                                                    Hapus riwayat
                                                </span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-28 text-center text-sm text-muted-foreground"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-1">
                                            <ReceiptText className="mb-1 size-6 text-muted-foreground/40" />
                                            <p className="text-xs font-medium">
                                                Belum ada riwayat belanja
                                                tercatat
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                Klik &quot;Catat Belanja /
                                                Pemeliharaan&quot; untuk
                                                menautkan paket belanja.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {/* Create History Dialog */}
            <AssetPurchaseFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                assetId={assetId}
                onSuccess={handleSuccess}
            />

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog
                open={Boolean(itemToDelete)}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setItemToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Hapus Riwayat Belanja?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan menghapus catatan riwayat belanja
                            tahun {itemToDelete?.purchase?.year} (
                            {itemToDelete?.notes || "Tanpa catatan"}).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteConfirm();
                            }}
                            disabled={isDeleting}
                            className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2
                                        data-icon="inline-start"
                                        className="animate-spin"
                                    />
                                    Menghapus...
                                </>
                            ) : (
                                "Ya, Hapus"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
