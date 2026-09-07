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
    KeyRound,
    Eye,
    ArrowUpDown,
    Loader2,
    AlertCircle,
} from "lucide-react";

import type { Asset } from "@/lib/types";
import { fetcher, mutationFetcher, ApiError } from "@/lib/api";
import { formatDateIndo } from "@/lib/utils";
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

export function LicensesClient() {
    const {
        data: licenses,
        isLoading,
        mutate,
    } = useSWR<Asset[]>("/api/assets?category=license", fetcher);

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = React.useState("");

    // Delete Dialog state
    const [licenseToDelete, setLicenseToDelete] = React.useState<Asset | null>(
        null
    );
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    const tableData = React.useMemo(() => {
        if (!Array.isArray(licenses)) return [];
        return licenses;
    }, [licenses]);

    const columns = React.useMemo<ColumnDef<Asset>[]>(
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
                accessorKey: "name",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 text-xs font-medium"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Nama Lisensi / Software
                        <ArrowUpDown className="ml-2 size-3.5" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground">
                                {item.name}
                            </span>
                            {item.notes && (
                                <span className="line-clamp-1 text-xs text-muted-foreground">
                                    {item.notes}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: "number",
                header: "Kunci Lisensi / SN",
                cell: ({ row }) => (
                    <span className="font-mono text-xs font-medium text-foreground">
                        {row.getValue("number")}
                    </span>
                ),
            },
            {
                accessorKey: "end_date",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 text-xs font-medium"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Masa Berlaku
                        <ArrowUpDown className="ml-2 size-3.5" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const endDateStr = row.getValue("end_date") as
                        string | null;
                    if (!endDateStr) {
                        return (
                            <Badge
                                variant="outline"
                                className="text-xs font-normal"
                            >
                                Perpetual
                            </Badge>
                        );
                    }

                    const now = new Date();
                    const endDate = new Date(endDateStr);
                    const diffTime = endDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(
                        diffTime / (1000 * 60 * 60 * 24)
                    );

                    if (diffDays < 0) {
                        return (
                            <div className="flex items-center gap-1.5">
                                <Badge
                                    variant="destructive"
                                    className="text-xs font-normal"
                                >
                                    Kadaluarsa
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    ({formatDateIndo(endDateStr)})
                                </span>
                            </div>
                        );
                    }

                    if (diffDays <= 30) {
                        return (
                            <div className="flex items-center gap-1.5">
                                <Badge
                                    variant="secondary"
                                    className="text-xs font-normal"
                                >
                                    {diffDays} hari lagi
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    ({formatDateIndo(endDateStr)})
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div className="flex items-center gap-1.5">
                            <Badge
                                variant="default"
                                className="text-xs font-normal"
                            >
                                Aktif
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                ({formatDateIndo(endDateStr)})
                            </span>
                        </div>
                    );
                },
                filterFn: (row, id, value) => {
                    if (!value || value === "all") return true;
                    const endDateStr = row.getValue(id) as string | null;
                    if (value === "perpetual") return !endDateStr;
                    if (!endDateStr) return false;

                    const now = new Date();
                    const endDate = new Date(endDateStr);
                    const diffTime = endDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(
                        diffTime / (1000 * 60 * 60 * 24)
                    );

                    if (value === "expired") return diffDays < 0;
                    if (value === "expiring_soon")
                        return diffDays >= 0 && diffDays <= 30;
                    if (value === "active") return diffDays > 30;
                    return true;
                },
            },
            {
                accessorKey: "unit_price",
                header: "Biaya Pengadaan",
                cell: ({ row }) => {
                    const price = row.getValue("unit_price") as number | null;
                    return (
                        <span className="text-xs text-muted-foreground">
                            {price
                                ? `Rp ${price.toLocaleString("id-ID")}`
                                : "-"}
                        </span>
                    );
                },
            },
            {
                id: "actions",
                header: () => <span className="sr-only">Aksi</span>,
                cell: ({ row }) => {
                    const license = row.original;
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
                                            href={`/licenses/${license.id}`}
                                            className="flex cursor-pointer items-center"
                                        >
                                            <Eye className="mr-2 size-4" />
                                            Lihat Detail
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`/licenses/${license.id}/edit`}
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
                                            setLicenseToDelete(license);
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
        if (!licenseToDelete) return;
        setIsDeleting(true);
        setDeleteError(null);

        try {
            await mutationFetcher(
                `/api/assets/${licenseToDelete.id}`,
                "DELETE"
            );
            await mutate();
            setLicenseToDelete(null);
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                setDeleteError(
                    err.message || "Gagal menghapus data lisensi software."
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
                        Lisensi Software
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Kelola data lisensi firewall, sistem operasi, sertifikat
                        keamanan, dan masa berlaku kontrak.
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/licenses/new">
                        <Plus data-icon="inline-start" className="size-4" />
                        Tambah Lisensi
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
                        placeholder="Cari nama lisensi, serial number, catatan..."
                        value={globalFilter ?? ""}
                        onChange={(event) =>
                            setGlobalFilter(event.target.value)
                        }
                        className="h-9 pl-8 text-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Select
                        value={
                            (table
                                .getColumn("end_date")
                                ?.getFilterValue() as string) ?? "all"
                        }
                        onValueChange={(value) =>
                            table
                                .getColumn("end_date")
                                ?.setFilterValue(
                                    value === "all" ? undefined : value
                                )
                        }
                    >
                        <SelectTrigger className="h-9 w-[170px] text-sm">
                            <SelectValue placeholder="Status Masa Aktif" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="active">
                                Aktif (&gt; 30 hari)
                            </SelectItem>
                            <SelectItem value="expiring_soon">
                                Segera Berakhir (&le; 30 hari)
                            </SelectItem>
                            <SelectItem value="expired">Kadaluarsa</SelectItem>
                            <SelectItem value="perpetual">
                                Perpetual (Tanpa Batas)
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
                                            <Skeleton className="h-4 w-36" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
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
                                        <KeyRound className="mb-1 size-8 text-muted-foreground/40" />
                                        <p className="font-medium">
                                            Tidak ada data lisensi software
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Klik tombol &quot;Tambah
                                            Lisensi&quot; untuk mendaftarkan
                                            lisensi baru.
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
                    {tableData.length} data lisensi
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
                open={Boolean(licenseToDelete)}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setLicenseToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Hapus Lisensi Software?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan menghapus lisensi{" "}
                            <strong>&quot;{licenseToDelete?.name}&quot;</strong>{" "}
                            (Kunci: {licenseToDelete?.number || "-"}). Riwayat
                            belanja terkait lisensi ini juga akan dihapus.
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
