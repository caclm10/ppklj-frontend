"use client";

import * as React from "react";
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
    Tags,
    ArrowUpDown,
    Loader2,
    AlertCircle,
} from "lucide-react";

import type { Feature } from "@/lib/types";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FeatureFormDialog } from "./feature-form-dialog";

export function FeaturesClient() {
    const {
        data: features,
        isLoading,
        mutate,
    } = useSWR<Feature[]>("/api/features", fetcher);

    const [sorting, setSorting] = React.useState<SortingState>([
        { id: "name", desc: false },
    ]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = React.useState("");

    // Form Dialog state
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [featureToEdit, setFeatureToEdit] = React.useState<Feature | null>(
        null
    );

    // Delete Dialog state
    const [featureToDelete, setFeatureToDelete] =
        React.useState<Feature | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    const tableData = React.useMemo(() => {
        if (!Array.isArray(features)) return [];
        return features;
    }, [features]);

    const columns = React.useMemo<ColumnDef<Feature>[]>(
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
                        Nama Fitur / Tag
                        <ArrowUpDown className="ml-2 size-3.5" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-medium">
                            {row.getValue("name")}
                        </Badge>
                    </div>
                ),
            },
            {
                id: "actions",
                header: () => <span className="sr-only">Aksi</span>,
                cell: ({ row }) => {
                    const feature = row.original;
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
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setFeatureToEdit(feature);
                                            setIsFormOpen(true);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Pencil className="mr-2 size-4" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setDeleteError(null);
                                            setFeatureToDelete(feature);
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
        if (!featureToDelete) return;
        setIsDeleting(true);
        setDeleteError(null);

        try {
            await mutationFetcher(
                `/api/features/${featureToDelete.id}`,
                "DELETE"
            );
            await mutate();
            setFeatureToDelete(null);
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                setDeleteError(
                    err.message || "Gagal menghapus data master fitur."
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
                        Master Fitur &amp; Tags
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Katalog tag fitur teknis untuk spesifikasi perangkat
                        jaringan.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setFeatureToEdit(null);
                        setIsFormOpen(true);
                    }}
                    className="w-full sm:w-auto"
                >
                    <Plus data-icon="inline-start" className="size-4" />
                    Tambah Fitur
                </Button>
            </div>

            {deleteError && (
                <Alert variant="destructive">
                    <AlertCircle data-icon="inline-start" />
                    <AlertTitle>Gagal Menghapus</AlertTitle>
                    <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
            )}

            {/* Filter & Search Bar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari nama fitur / tag..."
                        value={globalFilter ?? ""}
                        onChange={(event) =>
                            setGlobalFilter(event.target.value)
                        }
                        className="h-9 pl-8 text-sm"
                    />
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
                                        <Skeleton className="h-5 w-28 rounded-md" />
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
                                        <Tags className="mb-1 size-8 text-muted-foreground/40" />
                                        <p className="font-medium">
                                            Tidak ada data fitur
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Klik tombol &quot;Tambah Fitur&quot;
                                            untuk mendaftarkan tag baru.
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
                    {tableData.length} data fitur
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

            {/* Form Dialog for Create / Edit */}
            <FeatureFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                featureToEdit={featureToEdit}
                onSuccess={() => mutate()}
            />

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog
                open={Boolean(featureToDelete)}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setFeatureToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Fitur / Tag?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan menghapus tag fitur{" "}
                            <strong>&quot;{featureToDelete?.name}&quot;</strong>
                            . Fitur ini akan dilepas dari seluruh perangkat
                            jaringan yang menautkannya.
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
