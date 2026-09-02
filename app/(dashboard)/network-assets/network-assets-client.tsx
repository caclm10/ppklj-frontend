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
    Server,
    Eye,
    ArrowUpDown,
    Loader2,
    AlertCircle,
    Building2,
} from "lucide-react";

import type { NetworkAsset, Office } from "@/lib/types";
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

export function NetworkAssetsClient() {
    const {
        data: networkAssets,
        isLoading,
        mutate,
    } = useSWR<NetworkAsset[]>("/api/network-assets", fetcher);
    const { data: offices } = useSWR<Office[]>("/api/offices", fetcher);

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = React.useState("");

    // Delete Dialog state
    const [assetToDelete, setAssetToDelete] =
        React.useState<NetworkAsset | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    const tableData = React.useMemo(() => {
        if (!Array.isArray(networkAssets)) return [];
        return networkAssets;
    }, [networkAssets]);

    const columns = React.useMemo<ColumnDef<NetworkAsset>[]>(
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
                accessorKey: "brand",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 text-xs font-medium"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Perangkat
                        <ArrowUpDown className="ml-2 size-3.5" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground">
                                {item.brand} {item.model}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {item.type}
                                {item.hostname ? ` (${item.hostname})` : ""}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: "serial_number",
                header: "Nomor Seri (SN)",
                accessorFn: (row) => row.asset?.number ?? "",
                cell: ({ row }) => (
                    <span className="font-mono text-xs font-medium text-foreground">
                        {row.original.asset?.number || "-"}
                    </span>
                ),
            },
            {
                accessorKey: "ip",
                header: "IP Address",
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-muted-foreground">
                        {row.getValue("ip") || "-"}
                    </span>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => {
                    const status = row.getValue("status") as string;
                    switch (status) {
                        case "aktif":
                            return (
                                <Badge
                                    variant="default"
                                    className="font-normal"
                                >
                                    Aktif
                                </Badge>
                            );
                        case "belum_dipasang":
                            return (
                                <Badge
                                    variant="secondary"
                                    className="font-normal"
                                >
                                    Cadangan
                                </Badge>
                            );
                        case "tidak_aktif":
                            return (
                                <Badge
                                    variant="destructive"
                                    className="font-normal"
                                >
                                    Tidak Aktif
                                </Badge>
                            );
                        default:
                            return <Badge variant="outline">{status}</Badge>;
                    }
                },
                filterFn: (row, id, value) => {
                    if (!value || value === "all") return true;
                    return row.getValue(id) === value;
                },
            },
            {
                id: "office",
                header: "Lokasi Kantor",
                accessorFn: (row) => row.office?.name ?? "",
                cell: ({ row }) => {
                    const office = row.original.office;
                    return office ? (
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                            <Building2 className="size-3.5 text-muted-foreground" />
                            <span>{office.name}</span>
                        </div>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">
                            Belum Ditentukan
                        </span>
                    );
                },
                filterFn: (row, id, value) => {
                    if (!value || value === "all") return true;
                    return String(row.original.office_id) === value;
                },
            },
            {
                id: "features",
                header: "Fitur / Tags",
                cell: ({ row }) => {
                    const features = row.original.features || [];
                    if (features.length === 0) {
                        return (
                            <span className="text-xs text-muted-foreground">
                                -
                            </span>
                        );
                    }
                    return (
                        <div className="flex flex-wrap gap-1">
                            {features.slice(0, 2).map((feat) => (
                                <Badge
                                    key={feat.id}
                                    variant="outline"
                                    className="px-1.5 py-0 text-[10px]"
                                >
                                    {feat.name}
                                </Badge>
                            ))}
                            {features.length > 2 && (
                                <Badge
                                    variant="secondary"
                                    className="px-1 py-0 text-[10px]"
                                >
                                    +{features.length - 2}
                                </Badge>
                            )}
                        </div>
                    );
                },
            },
            {
                id: "actions",
                header: () => <span className="sr-only">Aksi</span>,
                cell: ({ row }) => {
                    const asset = row.original;
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
                                            href={`/network-assets/${asset.id}`}
                                            className="flex cursor-pointer items-center"
                                        >
                                            <Eye className="mr-2 size-4" />
                                            Lihat Detail
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`/network-assets/${asset.id}/edit`}
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
                                            setAssetToDelete(asset);
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
        if (!assetToDelete) return;
        setIsDeleting(true);
        setDeleteError(null);

        try {
            if (assetToDelete.asset_id) {
                await mutationFetcher(
                    `/api/assets/${assetToDelete.asset_id}`,
                    "DELETE"
                );
            } else {
                await mutationFetcher(
                    `/api/network-assets/${assetToDelete.id}`,
                    "DELETE"
                );
            }
            await mutate();
            setAssetToDelete(null);
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                setDeleteError(
                    err.message || "Gagal menghapus data perangkat jaringan."
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
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Perangkat Jaringan
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Kelola inventaris Switch, Router, Access Point, dan
                        Firewall di seluruh kantor.
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/network-assets/new">
                        <Plus data-icon="inline-start" className="size-4" />
                        Tambah Perangkat
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
                        placeholder="Cari SN, merk, tipe, IP, hostname..."
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
                                .getColumn("status")
                                ?.getFilterValue() as string) ?? "all"
                        }
                        onValueChange={(value) =>
                            table
                                .getColumn("status")
                                ?.setFilterValue(
                                    value === "all" ? undefined : value
                                )
                        }
                    >
                        <SelectTrigger className="h-9 w-[140px] text-sm">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="aktif">Aktif</SelectItem>
                            <SelectItem value="belum_dipasang">
                                Cadangan
                            </SelectItem>
                            <SelectItem value="tidak_aktif">
                                Tidak Aktif
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Office Filter */}
                    <Select
                        value={
                            (table
                                .getColumn("office")
                                ?.getFilterValue() as string) ?? "all"
                        }
                        onValueChange={(value) =>
                            table
                                .getColumn("office")
                                ?.setFilterValue(
                                    value === "all" ? undefined : value
                                )
                        }
                    >
                        <SelectTrigger className="h-9 w-[170px] text-sm">
                            <SelectValue placeholder="Semua Lokasi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Lokasi</SelectItem>
                            {offices?.map((office) => (
                                <SelectItem
                                    key={office.id}
                                    value={String(office.id)}
                                >
                                    {office.name}
                                </SelectItem>
                            ))}
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
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-28" />
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
                                        <Server className="mb-1 size-8 text-muted-foreground/40" />
                                        <p className="font-medium">
                                            Tidak ada data perangkat jaringan
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Klik tombol &quot;Tambah
                                            Perangkat&quot; untuk mendaftarkan
                                            perangkat baru.
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div>
                    Menampilkan {table.getRowModel().rows.length} dari{" "}
                    {tableData.length} data perangkat
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
                open={Boolean(assetToDelete)}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setAssetToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Hapus Perangkat Jaringan?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan menghapus perangkat{" "}
                            <strong>
                                &quot;{assetToDelete?.brand}{" "}
                                {assetToDelete?.model}&quot;
                            </strong>{" "}
                            (SN: {assetToDelete?.asset?.number || "-"}). Seluruh
                            riwayat belanja dan relasi fitur perangkat ini akan
                            ikut terhapus.
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
