"use client";

import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import {
    Truck,
    ArrowLeft,
    Pencil,
    PlusCircle,
    Server,
    User,
    Phone,
    Building,
    CheckCircle2,
    Calendar,
    FileText,
    Activity,
    AlertTriangle,
} from "lucide-react";

import type { AssetRma, RmaStatus } from "@/lib/types";
import { fetcher } from "@/lib/api";
import { formatDateIndo, formatDateTimeIndo } from "@/lib/utils";
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
import { RmaTrackDialog } from "@/components/rma-track-dialog";

interface RmaDetailViewProps {
    rmaId: number;
}

const statusLabels: Record<
    RmaStatus,
    {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
    }
> = {
    rusak_di_kantor: {
        label: "Rusak di Kantor",
        variant: "destructive",
    },
    pengiriman_ke_pusat: {
        label: "Pengiriman ke Pusat",
        variant: "secondary",
    },
    diterima_di_pusat: {
        label: "Diterima di Pusat",
        variant: "secondary",
    },
    pengiriman_ke_vendor: {
        label: "Pengiriman ke Vendor",
        variant: "secondary",
    },
    diproses_vendor: {
        label: "Sedang Diproses Vendor",
        variant: "outline",
    },
    diterima_dari_vendor: {
        label: "Diterima dari Vendor",
        variant: "secondary",
    },
    pengiriman_ke_kantor: {
        label: "Pengiriman ke Kantor Asal",
        variant: "secondary",
    },
    selesai_dipasang: {
        label: "Selesai & Dipasang",
        variant: "default",
    },
};

export function RmaDetailView({ rmaId }: RmaDetailViewProps) {
    const {
        data: rma,
        isLoading,
        mutate,
    } = useSWR<AssetRma>(`/api/asset-rmas/${rmaId}`, fetcher);

    const [isTrackDialogOpen, setIsTrackDialogOpen] = React.useState(false);

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

    if (!rma) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <Truck className="size-12 text-muted-foreground/50" />
                <div>
                    <h2 className="text-lg font-bold">
                        Tiket RMA Tidak Ditemukan
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Data tiket servis RMA dengan ID #{rmaId} tidak tersedia.
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/rmas">
                        <ArrowLeft className="mr-2 size-4" />
                        Kembali ke Daftar RMA
                    </Link>
                </Button>
            </div>
        );
    }

    const currentStatusInfo = statusLabels[rma.current_status] || {
        label: rma.current_status,
        variant: "outline" as const,
    };

    const isCompleted = Boolean(rma.completed_at);

    return (
        <div className="flex flex-col gap-6">
            {/* Header with Navigation & Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/rmas">
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Kembali</span>
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">
                                Tiket RMA #{rma.id}
                            </h1>
                            <Badge variant={currentStatusInfo.variant}>
                                {currentStatusInfo.label}
                            </Badge>
                            {rma.resolution && (
                                <Badge
                                    variant={
                                        rma.resolution === "diganti_unit"
                                            ? "default"
                                            : "secondary"
                                    }
                                >
                                    {rma.resolution === "diganti_unit"
                                        ? "Ganti Unit Baru"
                                        : "Diperbaiki"}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {rma.rma_number
                                ? `No. RMA: ${rma.rma_number} • `
                                : ""}
                            Perangkat:{" "}
                            <span className="font-semibold text-foreground">
                                {rma.asset?.name || "-"}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsTrackDialogOpen(true)}
                    >
                        <PlusCircle className="mr-2 size-4" />
                        Perbarui Status
                    </Button>
                    <Button asChild>
                        <Link href={`/rmas/${rma.id}/edit`}>
                            <Pencil className="mr-2 size-4" />
                            Edit Tiket
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Quick Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                            <Server className="size-4 text-primary" />
                            Informasi Perangkat
                        </CardDescription>
                        <CardTitle className="text-base font-bold">
                            {rma.asset?.name || "-"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 pt-0">
                        <p className="font-mono text-xs text-muted-foreground">
                            SN Awal:{" "}
                            {rma.old_serial_number || rma.asset?.number || "-"}
                        </p>
                        {rma.new_serial_number && (
                            <p className="font-mono text-xs font-semibold text-primary">
                                SN Baru: {rma.new_serial_number}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                            <User className="size-4 text-primary" />
                            PIC &amp; Vendor
                        </CardDescription>
                        <CardTitle className="text-base font-bold">
                            {rma.pic_name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 pt-0">
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="size-3" />
                            {rma.pic_phone || "Tanpa No. Kontak"}
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Building className="size-3" />
                            {rma.vendor_name || "Vendor Tidak Dicatat"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                            <Activity className="size-4 text-primary" />
                            Penyelesaian Tiket
                        </CardDescription>
                        <CardTitle className="text-base font-bold">
                            {isCompleted ? (
                                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="size-4" />
                                    Selesai Ditangani
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                    <AlertTriangle className="size-4" />
                                    Dalam Proses
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <span className="text-xs text-muted-foreground">
                            {rma.completed_at
                                ? `Tuntas pada: ${formatDateIndo(rma.completed_at)}`
                                : `Dibuat: ${formatDateIndo(rma.created_at)}`}
                        </span>
                    </CardContent>
                </Card>
            </div>

            {/* Problem Description Card */}
            {rma.problem_description && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                            <FileText className="size-4 text-primary" />
                            Uraian Gejala Kerusakan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-wrap text-foreground">
                            {rma.problem_description}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Timeline Stepper Section */}
            <Card>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Truck className="size-5 text-primary" />
                            <CardTitle className="text-lg">
                                Riwayat Perjalanan &amp; Milestone Tracking
                            </CardTitle>
                        </div>
                        <CardDescription>
                            Kronologi tahapan pengiriman, penanganan teknisi,
                            dan penyelesaian servis unit.
                        </CardDescription>
                    </div>

                    <Button
                        size="sm"
                        onClick={() => setIsTrackDialogOpen(true)}
                    >
                        <PlusCircle
                            data-icon="inline-start"
                            className="size-4"
                        />
                        Tambah Catatan Perjalanan
                    </Button>
                </CardHeader>

                <CardContent className="pt-4">
                    {rma.tracks && rma.tracks.length > 0 ? (
                        <div className="relative ml-3 space-y-8 border-l-2 border-primary/30 py-2 pl-6">
                            {rma.tracks.map((track, idx) => {
                                const info = statusLabels[track.status] || {
                                    label: track.status,
                                    variant: "outline" as const,
                                };
                                const isLatest = idx === 0;

                                return (
                                    <div
                                        key={track.id}
                                        className="group relative"
                                    >
                                        {/* Dot on the timeline line */}
                                        <div
                                            className={`absolute top-0 -left-[31px] flex size-5 items-center justify-center rounded-full border-2 bg-background ${
                                                isLatest
                                                    ? "border-primary text-primary"
                                                    : "border-muted-foreground/40 text-muted-foreground"
                                            }`}
                                        >
                                            <div
                                                className={`size-2 rounded-full ${
                                                    isLatest
                                                        ? "animate-pulse bg-primary"
                                                        : "bg-muted-foreground/60"
                                                }`}
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1 rounded-lg border bg-muted/10 p-4 transition-colors group-hover:bg-muted/20">
                                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold">
                                                        {info.label}
                                                    </span>
                                                    <Badge
                                                        variant={info.variant}
                                                        className="px-1.5 py-0 text-[10px]"
                                                    >
                                                        {track.status}
                                                    </Badge>
                                                </div>
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="size-3" />
                                                    {formatDateTimeIndo(
                                                        track.tracked_at
                                                    )}
                                                </span>
                                            </div>

                                            {track.notes ? (
                                                <p className="mt-2 text-sm whitespace-pre-wrap text-foreground">
                                                    {track.notes}
                                                </p>
                                            ) : (
                                                <p className="mt-1 text-xs text-muted-foreground italic">
                                                    Tanpa catatan tambahan
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
                            <Truck className="size-8 text-muted-foreground/30" />
                            <p>Belum ada milestone perjalanan yang dicatat.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog update track */}
            <RmaTrackDialog
                open={isTrackDialogOpen}
                onOpenChange={setIsTrackDialogOpen}
                rmaId={rma.id}
                currentStatus={rma.current_status}
                onSuccess={() => mutate()}
            />
        </div>
    );
}
