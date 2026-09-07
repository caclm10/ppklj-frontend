"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
    Loader2,
    ShieldCheck,
    ArrowLeft,
    ReceiptText,
    Layers,
    Search,
    Wrench,
    CheckCircle2,
    Calendar,
    AlertCircle,
} from "lucide-react";

import {
    type Asset,
    type Purchase,
    type AssetPurchase,
} from "@/lib/types";
import { fetcher, mutationFetcher } from "@/lib/api";
import { formatDateIndo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface MaintenanceFormProps {
    purchaseId: number;
}

export function MaintenanceForm({ purchaseId }: MaintenanceFormProps) {
    const { data: purchase, isLoading: loadingPurchase } = useSWR<Purchase>(
        `/api/purchases/${purchaseId}`,
        fetcher
    );

    if (loadingPurchase) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-lg" />
                    <div className="flex flex-col gap-1">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-36" />
                        <Skeleton className="h-4 w-60" />
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
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

    return <MaintenanceFormInner purchase={purchase} />;
}

function MaintenanceFormInner({ purchase }: { purchase: Purchase }) {
    const router = useRouter();

    // Fetch previous asset-purchases packages
    const { data: allPackages = [], isLoading: loadingPackages } = useSWR<
        AssetPurchase[]
    >("/api/asset-purchases", fetcher);

    // Fetch all assets for optional manual mode
    const { data: allAssets = [], isLoading: loadingAssets } = useSWR<Asset[]>(
        "/api/assets",
        fetcher
    );

    // Selection mode: "package" (bulk) or "manual"
    const [mode, setMode] = React.useState<"package" | "manual">("package");
    const [selectedPackageId, setSelectedPackageId] = React.useState<string>("");

    // Selected assets (set of IDs)
    const [selectedAssetIds, setSelectedAssetIds] = React.useState<number[]>([]);
    const [unitSearch, setUnitSearch] = React.useState("");

    // Form inputs
    const [maintenanceName, setMaintenanceName] = React.useState("");
    const [totalPrice, setTotalPrice] = React.useState<number | "">("");
    const [warrantyDuration, setWarrantyDuration] = React.useState<string>("1");
    const [startDate, setStartDate] = React.useState<string>(() => {
        const year = purchase.year || new Date().getFullYear();
        return `${year}-01-01`;
    });
    const [endDate, setEndDate] = React.useState<string>(() => {
        const year = (purchase.year || new Date().getFullYear()) + 1;
        return `${year}-01-01`;
    });
    const [notes, setNotes] = React.useState("");

    // Submit state
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [serverError, setServerError] = React.useState<string | null>(null);

    // Filter packages from other purchases or past procurements
    const availablePackages = React.useMemo(() => {
        if (!Array.isArray(allPackages)) return [];
        return allPackages.filter((pkg) => {
            const hasUnits =
                (pkg.assets && pkg.assets.length > 0) ||
                (pkg.assets_count && pkg.assets_count > 0);
            return pkg.purchase_id !== purchase.id && hasUnits;
        });
    }, [allPackages, purchase.id]);

    // Active package object
    const selectedPackage = React.useMemo(() => {
        if (!selectedPackageId) return null;
        return (
            availablePackages.find(
                (pkg) => String(pkg.id) === selectedPackageId
            ) || null
        );
    }, [availablePackages, selectedPackageId]);

    // Handle selecting a package
    const handlePackageChange = (packageIdStr: string) => {
        setSelectedPackageId(packageIdStr);
        const pkg = availablePackages.find(
            (p) => String(p.id) === packageIdStr
        );
        if (pkg) {
            const cleanPkgName = (pkg.name || "Aset").replace(
                /\s*\(\d+\s*Unit\)/i,
                ""
            );
            setMaintenanceName(`Perpanjangan Garansi ${cleanPkgName}`);

            const assetIds = (pkg.assets || []).map((a) => a.id);
            setSelectedAssetIds(assetIds);

            // Set start date from package end_date if available
            if (pkg.end_date) {
                setStartDate(pkg.end_date);
                const d = new Date(pkg.end_date);
                if (!isNaN(d.getTime())) {
                    const dur = parseInt(warrantyDuration, 10) || 1;
                    d.setFullYear(d.getFullYear() + dur);
                    setEndDate(d.toISOString().slice(0, 10));
                }
            }
        }
    };

    // Calculate dates when start date or duration changes
    const handleStartDateChange = (val: string) => {
        setStartDate(val);
        if (warrantyDuration !== "custom" && val) {
            const years = parseInt(warrantyDuration, 10);
            if (!isNaN(years) && years > 0) {
                const d = new Date(val);
                if (!isNaN(d.getTime())) {
                    d.setFullYear(d.getFullYear() + years);
                    setEndDate(d.toISOString().slice(0, 10));
                }
            }
        }
    };

    const handleWarrantyDurationChange = (val: string) => {
        setWarrantyDuration(val);
        if (val !== "custom" && startDate) {
            const years = parseInt(val, 10);
            if (!isNaN(years) && years > 0) {
                const d = new Date(startDate);
                if (!isNaN(d.getTime())) {
                    d.setFullYear(d.getFullYear() + years);
                    setEndDate(d.toISOString().slice(0, 10));
                }
            }
        }
    };

    // Candidate assets to display in table
    const candidateAssets: Asset[] = React.useMemo(() => {
        if (mode === "package") {
            return selectedPackage?.assets || [];
        }
        return Array.isArray(allAssets) ? allAssets : [];
    }, [mode, selectedPackage, allAssets]);

    // Filtered candidate assets
    const filteredCandidateAssets = React.useMemo(() => {
        if (!unitSearch.trim()) return candidateAssets;
        const q = unitSearch.toLowerCase();
        return candidateAssets.filter(
            (a) =>
                a.name?.toLowerCase().includes(q) ||
                a.number?.toLowerCase().includes(q) ||
                a.notes?.toLowerCase().includes(q)
        );
    }, [candidateAssets, unitSearch]);

    // Toggle single asset
    const toggleAsset = (assetId: number) => {
        setSelectedAssetIds((prev) =>
            prev.includes(assetId)
                ? prev.filter((id) => id !== assetId)
                : [...prev, assetId]
        );
    };

    // Select all filtered assets
    const selectAllFiltered = () => {
        const idsToAdd = filteredCandidateAssets.map((a) => a.id);
        setSelectedAssetIds((prev) =>
            Array.from(new Set([...prev, ...idsToAdd]))
        );
    };

    // Deselect all filtered assets
    const deselectAllFiltered = () => {
        const idsToRemove = new Set(filteredCandidateAssets.map((a) => a.id));
        setSelectedAssetIds((prev) =>
            prev.filter((id) => !idsToRemove.has(id))
        );
    };

    // Unit price calculation
    const unitPrice = React.useMemo(() => {
        const total = typeof totalPrice === "number" ? totalPrice : 0;
        const qty = selectedAssetIds.length > 0 ? selectedAssetIds.length : 1;
        return Math.round(total / qty);
    }, [totalPrice, selectedAssetIds.length]);

    // Submit handler
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError(null);

        if (!maintenanceName.trim()) {
            setServerError("Nama pemeliharaan / perpanjangan garansi wajib diisi.");
            return;
        }

        if (selectedAssetIds.length === 0) {
            setServerError(
                "Pilih minimal 1 unit aset yang akan diberikan pemeliharaan / perpanjangan garansi."
            );
            return;
        }

        setIsSubmitting(true);
        const numericTotal = typeof totalPrice === "number" ? totalPrice : null;

        try {
            await mutationFetcher<AssetPurchase>(
                "/api/asset-purchases",
                "POST",
                {
                    purchase_id: purchase.id,
                    name: maintenanceName.trim(),
                    price: numericTotal,
                    quantity: selectedAssetIds.length,
                    start_date: startDate || null,
                    end_date: endDate || null,
                    notes: notes.trim() || null,
                    asset_ids: selectedAssetIds,
                }
            );

            router.push(`/purchases/${purchase.id}`);
        } catch (err: unknown) {
            console.error("Gagal menyimpan pemeliharaan aset:", err);
            const msg =
                err instanceof Error
                    ? err.message
                    : "Gagal menyimpan pemeliharaan aset. Periksa kembali isian form.";
            setServerError(msg);
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild type="button">
                        <Link href={`/purchases/${purchase.id}`}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Kembali</span>
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">
                                Catat Pemeliharaan Aset
                            </h1>
                            <Badge variant="secondary" className="font-medium">
                                Akun 52 - Pemeliharaan
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Pos Belanja Tahun {purchase.year} — Perpanjangan masa
                            garansi atau pemeliharaan unit aset yang sudah ada.
                        </p>
                    </div>
                </div>
            </div>

            {serverError ? (
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertTitle>Gagal Menyimpan</AlertTitle>
                    <AlertDescription>{serverError}</AlertDescription>
                </Alert>
            ) : null}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left 2 Columns: Forms */}
                <div className="flex flex-col gap-6 lg:col-span-2">
                    {/* Section 1: Selection Mode & Target Assets */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Layers className="size-5 text-primary" />
                                <CardTitle className="text-base">
                                    1. Pilih Aset yang Diberikan Pemeliharaan
                                </CardTitle>
                            </div>
                            <CardDescription>
                                Pilih seluruh unit dari paket pengadaan
                                sebelumnya, atau tentukan per unit secara
                                manual.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex flex-col gap-5">
                            {/* Mode Switcher */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode("package");
                                        setUnitSearch("");
                                    }}
                                    className={`flex flex-col gap-1 rounded-lg border p-3.5 text-left transition-colors ${
                                        mode === "package"
                                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                                            : "hover:bg-muted/50"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold">
                                            Dari Paket Pengadaan
                                        </span>
                                        {mode === "package" ? (
                                            <Badge
                                                variant="default"
                                                className="text-[10px]"
                                            >
                                                Dipilih
                                            </Badge>
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Satu klik untuk memilih seluruh unit
                                        (misal 100 unit AP Aruba dari Belanja
                                        Modal sebelumnya).
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode("manual");
                                        setUnitSearch("");
                                    }}
                                    className={`flex flex-col gap-1 rounded-lg border p-3.5 text-left transition-colors ${
                                        mode === "manual"
                                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                                            : "hover:bg-muted/50"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold">
                                            Pilih Unit Manual
                                        </span>
                                        {mode === "manual" ? (
                                            <Badge
                                                variant="default"
                                                className="text-[10px]"
                                            >
                                                Dipilih
                                            </Badge>
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Pilih unit tertentu dari seluruh basis
                                        data aset yang ada.
                                    </p>
                                </button>
                            </div>

                            {/* Mode: Package Selection */}
                            {mode === "package" ? (
                                <Field>
                                    <FieldLabel htmlFor="source-package">
                                        Pilih Paket Pengadaan Sumber{" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </FieldLabel>
                                    {loadingPackages ? (
                                        <Skeleton className="h-10 w-full" />
                                    ) : availablePackages.length === 0 ? (
                                        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                                            Tidak ada paket pengadaan sebelumnya
                                            yang dapat dipilih. Silakan gunakan mode{" "}
                                            <strong>Pilih Unit Manual</strong>.
                                        </div>
                                    ) : (
                                        <Select
                                            value={selectedPackageId}
                                            onValueChange={handlePackageChange}
                                        >
                                            <SelectTrigger id="source-package">
                                                <SelectValue placeholder="Pilih paket pengadaan (contoh: Aruba AP-635)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availablePackages.map(
                                                    (pkg) => {
                                                        const cleanName = (
                                                            pkg.name || "Paket"
                                                        ).replace(
                                                            /\s*\(\d+\s*Unit\)/i,
                                                            ""
                                                        );
                                                        const count =
                                                            pkg.assets?.length ||
                                                            pkg.quantity ||
                                                            pkg.assets_count ||
                                                            0;
                                                        const yr =
                                                            pkg.purchase?.year
                                                                ? `Belanja ${pkg.purchase.year}`
                                                                : "";
                                                        return (
                                                            <SelectItem
                                                                key={pkg.id}
                                                                value={String(
                                                                    pkg.id
                                                                )}
                                                            >
                                                                {cleanName} —{" "}
                                                                {count} Unit{" "}
                                                                {yr
                                                                    ? `(${yr})`
                                                                    : ""}
                                                            </SelectItem>
                                                        );
                                                    }
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </Field>
                            ) : null}

                            {/* Units Checklist Table */}
                            {(mode === "package" && selectedPackage) ||
                            mode === "manual" ? (
                                <div className="flex flex-col gap-3 rounded-lg border p-3">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Daftar Unit Terpilih:
                                            </span>
                                            <Badge variant="outline">
                                                {selectedAssetIds.length} dari{" "}
                                                {candidateAssets.length} Unit
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={selectAllFiltered}
                                            >
                                                Pilih Semua
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs text-muted-foreground"
                                                onClick={deselectAllFiltered}
                                            >
                                                Batal Pilih
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Filter input */}
                                    <div className="relative">
                                        <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Filter nomor seri atau nama unit..."
                                            value={unitSearch}
                                            onChange={(e) =>
                                                setUnitSearch(e.target.value)
                                            }
                                            className="h-8 pl-8 text-xs"
                                        />
                                    </div>

                                    {/* Scrollable unit table */}
                                    <div className="max-h-64 overflow-y-auto rounded border">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
                                                <TableRow>
                                                    <TableHead className="w-10">
                                                        <span className="sr-only">
                                                            Pilih
                                                        </span>
                                                    </TableHead>
                                                    <TableHead className="text-xs">
                                                        Nama / Perangkat
                                                    </TableHead>
                                                    <TableHead className="text-xs">
                                                        Nomor Seri / Tag
                                                    </TableHead>
                                                    <TableHead className="text-xs">
                                                        Garansi Saat Ini
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {loadingAssets &&
                                                mode === "manual" ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={4}
                                                            className="h-24 text-center text-xs text-muted-foreground"
                                                        >
                                                            Memuat data unit
                                                            aset...
                                                        </TableCell>
                                                    </TableRow>
                                                ) : filteredCandidateAssets.length ===
                                                  0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={4}
                                                            className="h-20 text-center text-xs text-muted-foreground"
                                                        >
                                                            Tidak ada unit aset
                                                            yang sesuai.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredCandidateAssets.map(
                                                        (asset) => {
                                                            const isChecked =
                                                                selectedAssetIds.includes(
                                                                    asset.id
                                                                );
                                                            return (
                                                                <TableRow
                                                                    key={
                                                                        asset.id
                                                                    }
                                                                    className="cursor-pointer hover:bg-muted/40"
                                                                    onClick={() =>
                                                                        toggleAsset(
                                                                            asset.id
                                                                        )
                                                                    }
                                                                >
                                                                    <TableCell className="w-10">
                                                                        <Checkbox
                                                                            checked={
                                                                                isChecked
                                                                            }
                                                                            onCheckedChange={() =>
                                                                                toggleAsset(
                                                                                    asset.id
                                                                                )
                                                                            }
                                                                            onClick={(
                                                                                e
                                                                            ) =>
                                                                                e.stopPropagation()
                                                                            }
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell className="text-xs font-medium">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span>{asset.name}</span>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="text-[10px] font-normal"
                                                                            >
                                                                                {asset.category === "license"
                                                                                    ? "Lisensi"
                                                                                    : "Perangkat"}
                                                                            </Badge>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="font-mono text-xs">
                                                                        {
                                                                            asset.number
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell className="text-xs text-muted-foreground">
                                                                        {asset.end_date
                                                                            ? formatDateIndo(
                                                                                  asset.end_date
                                                                              )
                                                                            : "-"}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        }
                                                    )
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    {/* Section 2: Maintenance Details */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Wrench className="size-5 text-primary" />
                                <CardTitle className="text-base">
                                    2. Rincian Pemeliharaan &amp; Garansi Baru
                                </CardTitle>
                            </div>
                            <CardDescription>
                                Masukkan nama pekerjaan, total anggaran belanja,
                                dan perpanjangan masa garansi baru.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex flex-col gap-5">
                            {/* Nama Pekerjaan / Pemeliharaan */}
                            <Field>
                                <FieldLabel htmlFor="maint-name">
                                    Nama Pemeliharaan / Pekerjaan{" "}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Input
                                    id="maint-name"
                                    placeholder="Contoh: Perpanjangan Garansi Aruba AP-635"
                                    value={maintenanceName}
                                    onChange={(e) =>
                                        setMaintenanceName(e.target.value)
                                    }
                                    required
                                />
                            </Field>

                            {/* Total Biaya Pemeliharaan */}
                            <Field>
                                <FieldLabel htmlFor="total-price">
                                    Total Biaya Pemeliharaan (Rp)
                                </FieldLabel>
                                <div className="relative">
                                    <span className="absolute top-2.5 left-3 text-sm font-medium text-muted-foreground">
                                        Rp
                                    </span>
                                    <Input
                                        id="total-price"
                                        type="number"
                                        min={0}
                                        placeholder="0"
                                        className="pl-10"
                                        value={totalPrice}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setTotalPrice(
                                                val === "" ? "" : Number(val)
                                            );
                                        }}
                                    />
                                </div>
                                {typeof totalPrice === "number" &&
                                selectedAssetIds.length > 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        Estimasi biaya:{" "}
                                        <strong className="text-foreground">
                                            Rp{" "}
                                            {unitPrice.toLocaleString("id-ID")}
                                        </strong>{" "}
                                        per unit ({selectedAssetIds.length}{" "}
                                        unit terpilih).
                                    </p>
                                ) : null}
                            </Field>

                            {/* Periode Garansi Baru */}
                            <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="size-4 text-primary" />
                                    <span className="text-sm font-semibold">
                                        Periode Garansi / Kontrak Pemeliharaan Baru
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Field>
                                        <FieldLabel htmlFor="start-date">
                                            Tanggal Mulai
                                        </FieldLabel>
                                        <Input
                                            id="start-date"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) =>
                                                handleStartDateChange(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="warranty-dur">
                                            Durasi Perpanjangan
                                        </FieldLabel>
                                        <Select
                                            value={warrantyDuration}
                                            onValueChange={
                                                handleWarrantyDurationChange
                                            }
                                        >
                                            <SelectTrigger id="warranty-dur">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">
                                                    +1 Tahun (12 Bulan)
                                                </SelectItem>
                                                <SelectItem value="2">
                                                    +2 Tahun (24 Bulan)
                                                </SelectItem>
                                                <SelectItem value="3">
                                                    +3 Tahun (36 Bulan)
                                                </SelectItem>
                                                <SelectItem value="custom">
                                                    Kustom / Manual
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                </div>

                                <Field>
                                    <FieldLabel htmlFor="end-date">
                                        Tanggal Akhir Garansi Baru
                                    </FieldLabel>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={endDate}
                                        disabled={warrantyDuration !== "custom"}
                                        onChange={(e) =>
                                            setEndDate(e.target.value)
                                        }
                                    />
                                    {startDate && endDate ? (
                                        <p className="text-xs text-muted-foreground">
                                            Masa garansi seluruh unit terpilih
                                            akan diperbarui menjadi:{" "}
                                            <strong className="text-foreground">
                                                {formatDateIndo(startDate)} s.d.{" "}
                                                {formatDateIndo(endDate)}
                                            </strong>
                                            .
                                        </p>
                                    ) : null}
                                </Field>
                            </div>

                            {/* Catatan Tambahan */}
                            <Field>
                                <FieldLabel htmlFor="notes">
                                    Catatan Pemeliharaan (Opsional)
                                </FieldLabel>
                                <Input
                                    id="notes"
                                    placeholder="Contoh: Termasuk penggantian suku cadang & dukungan teknis 24/7"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </Field>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Sticky Summary & Action Card */}
                <div className="flex flex-col gap-4">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle className="text-base font-bold">
                                Ringkasan Pemeliharaan
                            </CardTitle>
                            <CardDescription>
                                Periksa ringkasan sebelum menyimpan catatan.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">
                                        Pos Belanja:
                                    </span>
                                    <span className="font-semibold">
                                        Tahun {purchase.year} (MAK 52)
                                    </span>
                                </div>

                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">
                                        Unit Dibiayai:
                                    </span>
                                    <Badge
                                        variant={
                                            selectedAssetIds.length > 0
                                                ? "default"
                                                : "secondary"
                                        }
                                        className="font-mono text-xs"
                                    >
                                        {selectedAssetIds.length} Unit
                                    </Badge>
                                </div>

                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">
                                        Total Anggaran:
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {typeof totalPrice === "number"
                                            ? `Rp ${totalPrice.toLocaleString("id-ID")}`
                                            : "-"}
                                    </span>
                                </div>

                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">
                                        Biaya per Unit:
                                    </span>
                                    <span className="font-medium text-muted-foreground">
                                        {typeof totalPrice === "number" &&
                                        selectedAssetIds.length > 0
                                            ? `Rp ${unitPrice.toLocaleString("id-ID")}`
                                            : "-"}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1 border-b pb-2">
                                    <span className="text-xs text-muted-foreground">
                                        Periode Garansi Baru:
                                    </span>
                                    <span className="text-xs font-semibold">
                                        {startDate && endDate
                                            ? `${formatDateIndo(startDate)} s.d. ${formatDateIndo(endDate)}`
                                            : "-"}
                                    </span>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full"
                                disabled={
                                    isSubmitting ||
                                    selectedAssetIds.length === 0 ||
                                    !maintenanceName.trim()
                                }
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 size-4" />
                                        Simpan Pemeliharaan
                                    </>
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                asChild
                            >
                                <Link href={`/purchases/${purchase.id}`}>
                                    Batal
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
