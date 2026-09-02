"use client";

import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import {
    Truck,
    PlusCircle,
    Eye,
    CheckCircle2,
    Calendar,
    Phone,
    Building,
} from "lucide-react";

import type { AssetRma, RmaStatus } from "@/lib/types";
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
import { Skeleton } from "@/components/ui/skeleton";

interface AssetRmaHistoryProps {
    assetId: number;
}

const statusLabels: Record<
    RmaStatus,
    {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
    }
> = {
    rusak_di_kantor: { label: "Rusak di Kantor", variant: "destructive" },
    pengiriman_ke_pusat: { label: "Pengiriman ke Pusat", variant: "secondary" },
    diterima_di_pusat: { label: "Diterima di Pusat", variant: "secondary" },
    pengiriman_ke_vendor: {
        label: "Pengiriman ke Vendor",
        variant: "secondary",
    },
    diproses_vendor: { label: "Sedang Diproses Vendor", variant: "outline" },
    diterima_dari_vendor: {
        label: "Diterima dari Vendor",
        variant: "secondary",
    },
    pengiriman_ke_kantor: {
        label: "Pengiriman ke Kantor Asal",
        variant: "secondary",
    },
    selesai_dipasang: { label: "Selesai & Dipasang", variant: "default" },
};

export function AssetRmaHistory({ assetId }: AssetRmaHistoryProps) {
    const { data: rmas, isLoading } = useSWR<AssetRma[]>(
        `/api/asset-rmas?asset_id=${assetId}`,
        fetcher
    );

    return (
        <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Truck className="size-5 text-primary" />
                        <CardTitle className="text-lg">
                            Riwayat RMA &amp; Klaim Servis
                        </CardTitle>
                    </div>
                    <CardDescription>
                        Catatan pelaporan kerusakan, tahapan logistik pengiriman
                        servis, dan rekam jejak penggantian nomor seri unit.
                    </CardDescription>
                </div>

                <Button size="sm" asChild>
                    <Link href={`/rmas/new?asset_id=${assetId}`}>
                        <PlusCircle
                            data-icon="inline-start"
                            className="size-4"
                        />
                        Ajukan RMA Baru
                    </Link>
                </Button>
            </CardHeader>

            <CardContent>
                <div className="rounded-lg border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-xs font-semibold">
                                    No
                                </TableHead>
                                <TableHead className="text-xs font-semibold">
                                    No. Tiket / Vendor
                                </TableHead>
                                <TableHead className="text-xs font-semibold">
                                    PIC Pelapor
                                </TableHead>
                                <TableHead className="text-xs font-semibold">
                                    Status Perjalanan
                                </TableHead>
                                <TableHead className="text-xs font-semibold">
                                    Hasil Servis
                                </TableHead>
                                <TableHead className="text-xs font-semibold">
                                    Tanggal
                                </TableHead>
                                <TableHead className="text-right text-xs font-semibold">
                                    Aksi
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
                                            <Skeleton className="h-4 w-28" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-24" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-24 rounded-full" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-20" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-20" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Skeleton className="ml-auto h-8 w-16" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : rmas && rmas.length > 0 ? (
                                rmas.map((rma, idx) => {
                                    const statusInfo = statusLabels[
                                        rma.current_status
                                    ] || {
                                        label: rma.current_status,
                                        variant: "outline" as const,
                                    };

                                    return (
                                        <TableRow key={rma.id}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {idx + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-mono text-xs font-semibold">
                                                        {rma.rma_number ||
                                                            `Tiket #${rma.id}`}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Building className="size-3" />
                                                        {rma.vendor_name ||
                                                            "Vendor Tidak Dicatat"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-medium">
                                                        {rma.pic_name}
                                                    </span>
                                                    {rma.pic_phone && (
                                                        <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                                                            <Phone className="size-2.5" />
                                                            {rma.pic_phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={statusInfo.variant}
                                                    className="text-xs font-normal"
                                                >
                                                    {statusInfo.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {rma.resolution ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <Badge
                                                            variant={
                                                                rma.resolution ===
                                                                "diganti_unit"
                                                                    ? "default"
                                                                    : "secondary"
                                                            }
                                                            className="w-fit text-xs font-normal"
                                                        >
                                                            {rma.resolution ===
                                                            "diganti_unit"
                                                                ? "Ganti Unit Baru"
                                                                : "Diperbaiki"}
                                                        </Badge>
                                                        {rma.new_serial_number && (
                                                            <span className="font-mono text-[11px] text-primary">
                                                                SN Baru:{" "}
                                                                {
                                                                    rma.new_serial_number
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        Dalam Proses
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="size-3" />
                                                        {new Date(
                                                            rma.created_at || ""
                                                        ).toLocaleDateString(
                                                            "id-ID"
                                                        )}
                                                    </span>
                                                    {rma.completed_at && (
                                                        <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                                                            <CheckCircle2 className="size-2.5" />
                                                            Selesai
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                    className="h-7 text-xs"
                                                >
                                                    <Link
                                                        href={`/rmas/${rma.id}`}
                                                    >
                                                        <Eye
                                                            data-icon="inline-start"
                                                            className="size-3"
                                                        />
                                                        Tracking
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-28 text-center text-sm text-muted-foreground"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-1">
                                            <Truck className="mb-1 size-7 text-muted-foreground/30" />
                                            <p className="font-medium">
                                                Belum Ada Riwayat RMA / Servis
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Perangkat ini beroperasi normal
                                                dan belum pernah diajukan klaim
                                                perbaikan.
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
    );
}
