"use client";

import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Truck,
    Eye,
    ArrowUpDown,
    Loader2,
    AlertCircle,
    Server,
} from "lucide-react";

import type { AssetRma, RmaStatus } from "@/lib/types";
import { fetcher, mutationFetcher, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
        label: "Kirim ke Pusat",
        variant: "secondary",
    },
    diterima_di_pusat: {
        label: "Diterima di Pusat",
        variant: "secondary",
    },
    pengiriman_ke_vendor: {
        label: "Kirim ke Vendor",
        variant: "secondary",
    },
    diproses_vendor: {
        label: "Diproses Vendor",
        variant: "outline",
    },
    diterima_dari_vendor: {
        label: "Diterima dr Vendor",
        variant: "secondary",
    },
    pengiriman_ke_kantor: {
        label: "Kirim ke Kantor",
        variant: "secondary",
    },
    selesai_dipasang: {
        label: "Selesai & Dipasang",
        variant: "default",
    },
};

export function RmasClient() {
    const {
        data: rmas,
        isLoading,
        mutate,
    } = useSWR<AssetRma[]>("/api/asset-rmas", fetcher);

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = React.useState("");

    // Delete dialog state
    const [rmaToDelete, setRmaToDelete] = React.useState<AssetRma | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    const tableData = React.useMemo(() => {
        if (!Array.isArray(rmas)) return [];
        return rmas;
    }, [rmas]);

    const columns = React.useMemo<ColumnDef<AssetRma>[]>(
        () => [
            {
                id: "index",
                header: "No",
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-muted-foreground">
                        {row.index + 1}
                    </span>
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: "asset_name",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 text-xs font-medium"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Perangkat yang Rusak
                        <ArrowUpDown className="ml-2 size-3.5" />
                    </Button>
                ),
                accessorFn: (row) => row.asset?.name ?? "",
                cell: ({ row }) => {
                    const rma = row.original;
                    return (
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                <Server className="size-3.5 text-primary" />
                                {rma.asset?.name || "Perangkat"}
                            </div>
                            <div className="font-mono text-xs text-muted-foreground">
                                SN:{" "}
                                {rma.old_serial_number ||
                                    rma.asset?.number ||
                                    "-"}
                                {rma.new_serial_number && (
                                    <span className="ml-1 font-bold text-primary">
                                        &rarr; {rma.new_serial_number}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "rma_number",
                header: "No. RMA / Vendor",
                cell: ({ row }) => {
                    const rma = row.original;
                    return (
                        <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-xs font-semibold text-foreground">
                                {rma.rma_number || "-"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {rma.vendor_name || "Vendor tidak dicatat"}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "pic_name",
                header: "PIC / Pelapor",
                cell: ({ row }) => {
                    const rma = row.original;
                    return (
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium text-foreground">
                                {rma.pic_name}
                            </span>
                            {rma.pic_phone && (
                                <span className="font-mono text-[11px] text-muted-foreground">
                                    {rma.pic_phone}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: "current_status",
                header: "Status Perjalanan",
                cell: ({ row }) => {
                    const status = row.getValue("current_status") as RmaStatus;
                    const info = statusLabels[status] || {
                        label: status,
                        variant: "outline" as const,
                    };
                    return (
                        <Badge
                            variant={info.variant}
                            className="text-xs font-normal"
                        >
                            {info.label}
                        </Badge>
                    );
                },
                filterFn: (row, id, value) => {
                    if (!value || value === "all") return true;
                    return row.getValue(id) === value;
                },
            },
            {
                accessorKey: "resolution",
                header: "Hasil Servis",
                cell: ({ row }) => {
                    const res = row.getValue("resolution") as string | null;
                    if (!res) {
                        return (
                            <span className="text-xs text-muted-foreground italic">
                                Dalam Proses
                            </span>
                        );
                    }
                    return res === "diganti_unit" ? (
                        <Badge
                            variant="default"
                            className="text-xs font-normal"
                        >
                            Ganti Unit Baru
                        </Badge>
                    ) : (
                        <Badge
                            variant="secondary"
                            className="text-xs font-normal"
                        >
                            Diperbaiki
                        </Badge>
                    );
                },
                filterFn: (row, id, value) => {
                    if (!value || value === "all") return true;
                    if (value === "in_progress")
                        return !row.getValue("resolution");
                    return row.getValue(id) === value;
                },
            },
            {
                id: "actions",
                header: () => <span className="sr-only">Aksi</span>,
                cell: ({ row }) => {
                    const rma = row.original;
                    return (
                        <div className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="size-8"
                                    >
                                        <MoreHorizontal className="size-4" />
                                        <span className="sr-only">
                                            Buka menu
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`/rmas/${rma.id}`}
                                            className="flex cursor-pointer items-center"
                                        >
                                            <Eye className="mr-2 size-4" />
                                            Lihat Tracking
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`/rmas/${rma.id}/edit`}
                                            className="flex cursor-pointer items-center"
                                        >
                                            <Pencil className="mr-2 size-4" />
                                            Edit
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setDeleteError(null);
                                            setRmaToDelete(rma);
                                        }}
                                        className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 size-4" />
                                        Hapus
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
            },
        ],
        []
    );

    const table = useReactTable({
        data: tableData,
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    async function handleDeleteConfirm() {
        if (!rmaToDelete) return;
        setIsDeleting(true);
        setDeleteError(null);

        try {
            await mutationFetcher(
                `/api/asset-rmas/${rmaToDelete.id}`,
                "DELETE"
            );
            await mutate();
            setRmaToDelete(null);
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                setDeleteError(err.message || "Gagal menghapus tiket RMA.");
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
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Tracking RMA &amp; Servis Aset
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Pelacakan alur pengiriman perbaikan perangkat, klaim
                        garansi vendor, hingga instalasi kembali.
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/rmas/new">
                        <Plus data-icon="inline-start" className="size-4" />
                        Buka Tiket RMA Baru
                    </Link>
                </Button>
            </div>

            {deleteError && (
                <Alert variant="destructive">
                    <AlertCircle data-icon="inline-start" />
                    <AlertTitle>Gagal Menghapus</AlertTitle>
                    <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
            )}

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari RMA, perangkat, PIC, vendor..."
                        value={globalFilter ?? ""}
                        onChange={(event) =>
                            setGlobalFilter(event.target.value)
                        }
                        className="h-9 pl-8 text-sm"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Status Filter */}
                    <Select
                        value={
                            (table
                                .getColumn("current_status")
                                ?.getFilterValue() as string) ?? "all"
                        }
                        onValueChange={(value) =>
                            table
                                .getColumn("current_status")
                                ?.setFilterValue(
                                    value === "all" ? undefined : value
                                )
                        }
                    >
                        <SelectTrigger className="h-9 w-[170px] text-sm">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="rusak_di_kantor">
                                Rusak di Kantor
                            </SelectItem>
                            <SelectItem value="pengiriman_ke_pusat">
                                Kirim ke Pusat
                            </SelectItem>
                            <SelectItem value="diterima_di_pusat">
                                Diterima di Pusat
                            </SelectItem>
                            <SelectItem value="pengiriman_ke_vendor">
                                Kirim ke Vendor
                            </SelectItem>
                            <SelectItem value="diproses_vendor">
                                Diproses Vendor
                            </SelectItem>
                            <SelectItem value="diterima_dari_vendor">
                                Diterima dr Vendor
                            </SelectItem>
                            <SelectItem value="pengiriman_ke_kantor">
                                Kirim ke Kantor
                            </SelectItem>
                            <SelectItem value="selesai_dipasang">
                                Selesai &amp; Dipasang
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Resolution Filter */}
                    <Select
                        value={
                            (table
                                .getColumn("resolution")
                                ?.getFilterValue() as string) ?? "all"
                        }
                        onValueChange={(value) =>
                            table
                                .getColumn("resolution")
                                ?.setFilterValue(
                                    value === "all" ? undefined : value
                                )
                        }
                    >
                        <SelectTrigger className="h-9 w-[150px] text-sm">
                            <SelectValue placeholder="Semua Hasil" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Hasil</SelectItem>
                            <SelectItem value="in_progress">
                                Dalam Proses
                            </SelectItem>
                            <SelectItem value="diperbaiki">
                                Diperbaiki
                            </SelectItem>
                            <SelectItem value="diganti_unit">
                                Ganti Unit Baru
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="h-10 text-xs font-semibold"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>
                                        <Skeleton className="h-4 w-4" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-28" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-24 rounded-full" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-20" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className="py-3 text-sm"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-32 text-center text-sm text-muted-foreground"
                                >
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <Truck className="mb-1 size-8 text-muted-foreground/40" />
                                        <p className="font-medium">
                                            Tidak ada tiket servis RMA
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Klik &quot;Buka Tiket RMA Baru&quot;
                                            untuk mencatat pelaporan servis.
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div>
                    Menampilkan {table.getRowModel().rows.length} dari{" "}
                    {tableData.length} data tiket RMA
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="h-8 px-3 text-xs"
                    >
                        Sebelumnya
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="h-8 px-3 text-xs"
                    >
                        Selanjutnya
                    </Button>
                </div>
            </div>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog
                open={Boolean(rmaToDelete)}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setRmaToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Tiket RMA?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan menghapus tiket RMA #
                            {rmaToDelete?.id} (Perangkat:{" "}
                            {rmaToDelete?.asset?.name}) beserta seluruh histori
                            milestone tracking perjalanannya.
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
        </div>
    );
}
