"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
    PlusCircle,
    Loader2,
    Calculator,
    ShieldCheck,
    ArrowLeft,
    ReceiptText,
    Server,
    KeyRound,
    AlertCircle,
} from "lucide-react";

import {
    type Asset,
    type NetworkAsset,
    type Purchase,
    type NetworkDeviceType,
    type AssetPurchase,
    NETWORK_DEVICE_TYPES,
} from "@/lib/types";
import { fetcher, mutationFetcher, ApiError } from "@/lib/api";
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

interface ProcurementFormProps {
    purchaseId: number;
}

export function ProcurementForm({ purchaseId }: ProcurementFormProps) {
    const { data: purchase, isLoading: loadingPurchase } = useSWR<Purchase>(
        `/api/purchases/${purchaseId}`,
        fetcher
    );

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
                        <Skeleton className="h-4 w-60" />
                    </CardHeader>
                    <CardContent className="space-y-4">
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

    return <ProcurementFormInner purchase={purchase} />;
}

function ProcurementFormInner({ purchase }: { purchase: Purchase }) {
    const router = useRouter();
    const formId = React.useId();

    // Category state
    const [category, setCategory] = React.useState<"jaringan" | "license">(
        "jaringan"
    );

    // Hardware fields
    const [brand, setBrand] = React.useState("");
    const [model, setModel] = React.useState("");
    const [deviceType, setDeviceType] =
        React.useState<NetworkDeviceType>("Access Point");
    const [snPrefix, setSnPrefix] = React.useState("");

    // Software fields
    const [licenseName, setLicenseName] = React.useState("");
    const [licenseNumber, setLicenseNumber] = React.useState("");

    // Quantitative & Pricing
    const [quantity, setQuantity] = React.useState<number>(1);
    const [totalPrice, setTotalPrice] = React.useState<number | "">("");

    // Warranty & Dates initialized pure based on purchase year
    const [startDate, setStartDate] = React.useState<string>(() => {
        const year = purchase.year || new Date().getFullYear();
        return `${year}-01-01`;
    });
    const [warrantyDuration, setWarrantyDuration] = React.useState<string>("1");
    const [endDate, setEndDate] = React.useState<string>(() => {
        const year = (purchase.year || new Date().getFullYear()) + 1;
        return `${year}-01-01`;
    });
    const [notes, setNotes] = React.useState("");

    // Submission & progress state
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [progress, setProgress] = React.useState<{
        current: number;
        total: number;
    } | null>(null);
    const [serverError, setServerError] = React.useState<string | null>(null);

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

    // Live calculated unit price
    const unitPrice = React.useMemo(() => {
        const total = typeof totalPrice === "number" ? totalPrice : 0;
        const qty = quantity > 0 ? quantity : 1;
        return Math.round(total / qty);
    }, [totalPrice, quantity]);

    // Suggested prefix for placeholder serial numbers
    const suggestedPrefix = React.useMemo(() => {
        if (snPrefix.trim()) {
            return snPrefix.trim().toUpperCase().replace(/-+$/, "") + "-";
        }
        if (brand.trim() || model.trim()) {
            const cleanBrand = brand.trim().toUpperCase().replace(/\s+/g, "");
            const cleanModel = model.trim().toUpperCase().replace(/\s+/g, "");
            return `${cleanBrand}${cleanBrand && cleanModel ? "-" : ""}${cleanModel}-`;
        }
        return "TEMP-";
    }, [snPrefix, brand, model]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError(null);

        // Validations
        if (quantity < 1) {
            setServerError("Jumlah unit minimal 1.");
            return;
        }

        if (category === "jaringan") {
            if (!brand.trim()) {
                setServerError("Merk perangkat wajib diisi.");
                return;
            }
            if (!model.trim()) {
                setServerError("Seri/Model perangkat wajib diisi.");
                return;
            }
        } else {
            if (!licenseName.trim()) {
                setServerError("Nama lisensi software wajib diisi.");
                return;
            }
            if (!licenseNumber.trim()) {
                setServerError("Nomor kontrak / kunci lisensi wajib diisi.");
                return;
            }
        }

        setIsSubmitting(true);
        const numericTotal = typeof totalPrice === "number" ? totalPrice : null;

        try {
            if (category === "license") {
                // 1. Create single asset_purchase record
                const purchaseRes = await mutationFetcher<AssetPurchase>(
                    "/api/asset-purchases",
                    "POST",
                    {
                        purchase_id: purchase.id,
                        name: licenseName.trim(),
                        price: numericTotal,
                        quantity: quantity,
                        start_date: startDate || null,
                        end_date: endDate || null,
                        notes: notes.trim() || null,
                    }
                );

                const createdPurchase =
                    (purchaseRes as { data?: AssetPurchase }).data ||
                    (purchaseRes as AssetPurchase);

                if (!createdPurchase?.id) {
                    throw new Error("Gagal mencatat data belanja pengadaan lisensi.");
                }

                // 2. Create single license asset linked to asset_purchase_id
                await mutationFetcher<Asset>(
                    "/api/assets",
                    "POST",
                    {
                        asset_purchase_id: createdPurchase.id,
                        category: "license",
                        name: licenseName.trim(),
                        number: licenseNumber.trim(),
                        unit_price: unitPrice || null,
                        end_date: endDate || null,
                        notes: notes.trim() || null,
                    }
                );
            } else {
                // Bulk create network assets with 1 shared asset_purchase record
                const totalUnits = quantity;
                const padLength = Math.max(3, String(totalUnits).length);
                setProgress({ current: 0, total: totalUnits });

                const prefix = suggestedPrefix;
                const baseName = `${brand.trim()} ${model.trim()}`;
                const deviceNotes = notes.trim() || null;

                // 1. Create single asset_purchase record for the batch
                const purchaseRes = await mutationFetcher<AssetPurchase>(
                    "/api/asset-purchases",
                    "POST",
                    {
                        purchase_id: purchase.id,
                        name: baseName,
                        price: numericTotal,
                        quantity: totalUnits,
                        start_date: startDate || null,
                        end_date: endDate || null,
                        notes: deviceNotes,
                    }
                );

                const createdPurchase =
                    (purchaseRes as { data?: AssetPurchase }).data ||
                    (purchaseRes as AssetPurchase);

                if (!createdPurchase?.id) {
                    throw new Error("Gagal membuat catatan belanja pengadaan.");
                }

                const assetPurchaseId = createdPurchase.id;

                // 2. Process physical units in concurrent chunks of 5
                const chunkSize = 5;
                for (let i = 1; i <= totalUnits; i += chunkSize) {
                    const chunkPromises: Promise<void>[] = [];

                    for (let j = i; j < i + chunkSize && j <= totalUnits; j++) {
                        const sn = `${prefix}${String(j).padStart(padLength, "0")}`;

                        const task = (async () => {
                            // 2a. Create parent asset linked to the batch asset_purchase_id
                            const assetRes = await mutationFetcher<Asset>(
                                "/api/assets",
                                "POST",
                                {
                                    asset_purchase_id: assetPurchaseId,
                                    category: "jaringan",
                                    name: baseName,
                                    number: sn,
                                    unit_price: unitPrice || null,
                                    end_date: endDate || null,
                                    notes: deviceNotes,
                                }
                            );

                            const createdAsset =
                                (assetRes as { data?: Asset }).data ||
                                (assetRes as Asset);

                            if (!createdAsset?.id) {
                                throw new Error(
                                    `Gagal membuat unit #${j} (${sn})`
                                );
                            }

                            // 2b. Create network asset specification
                            await mutationFetcher<NetworkAsset>(
                                "/api/network-assets",
                                "POST",
                                {
                                    asset_id: createdAsset.id,
                                    office_id: null,
                                    status: "belum_dipasang",
                                    brand: brand.trim(),
                                    model: model.trim(),
                                    type: deviceType.trim(),
                                    ip: null,
                                    hostname: null,
                                    features: [],
                                }
                            );
                        })();

                        chunkPromises.push(task);
                    }

                    await Promise.all(chunkPromises);
                    const completedSoFar = Math.min(
                        i + chunkSize - 1,
                        totalUnits
                    );
                    setProgress({ current: completedSoFar, total: totalUnits });
                }
            }

            // Redirect back to purchase detail
            router.push(`/purchases/${purchase.id}`);
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                setServerError(err.message || "Gagal mencatat pengadaan aset.");
            } else if (err instanceof Error) {
                setServerError(err.message);
            } else {
                setServerError("Terjadi kesalahan sistem saat memproses data.");
            }
        } finally {
            setIsSubmitting(false);
            setProgress(null);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={`/purchases/${purchase.id}`}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">
                                Kembali ke Detail Belanja
                            </span>
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">
                                Catat Pengadaan Aset
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Daftarkan aset baru yang dibiayai dari paket Belanja
                            Tahun {purchase.year}.
                        </p>
                    </div>
                </div>
            </div>

            {/* Context Summary Banner */}
            <Card className="border-dashed bg-muted/30">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ReceiptText className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">
                                    Paket Belanja Tahun {purchase.year}
                                </span>
                                <Badge
                                    variant={
                                        purchase.type === "modal"
                                            ? "default"
                                            : "secondary"
                                    }
                                    className="text-xs"
                                >
                                    {purchase.type === "modal"
                                        ? "53 - Belanja Modal"
                                        : "52 - Belanja Pemeliharaan"}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {purchase.description ||
                                    "Tanpa uraian keterangan"}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/purchases/${purchase.id}`}>
                            Lihat Detail Belanja &rarr;
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            {serverError && (
                <Alert variant="destructive">
                    <AlertCircle data-icon="inline-start" />
                    <AlertTitle>Gagal Menyimpan</AlertTitle>
                    <AlertDescription>{serverError}</AlertDescription>
                </Alert>
            )}

            {/* Main Form */}
            <form id={formId} onSubmit={handleSubmit} className="space-y-6">
                {/* Category Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Kategori Aset
                        </CardTitle>
                        <CardDescription>
                            Pilih jenis aset yang diadakan (perangkat fisik atau
                            lisensi perangkat lunak).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => setCategory("jaringan")}
                                disabled={isSubmitting}
                                className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                                    category === "jaringan"
                                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                        : "border-border hover:bg-muted/40"
                                }`}
                            >
                                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <Server className="size-4" />
                                </div>
                                <div>
                                    <div className="font-semibold text-foreground">
                                        Perangkat Jaringan (Hardware)
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Access point, switch, router, server,
                                        firewall fisik dengan nomor seri unik.
                                    </p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setCategory("license")}
                                disabled={isSubmitting}
                                className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                                    category === "license"
                                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                        : "border-border hover:bg-muted/40"
                                }`}
                            >
                                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <KeyRound className="size-4" />
                                </div>
                                <div>
                                    <div className="font-semibold text-foreground">
                                        Lisensi Perangkat Lunak (Software)
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Langganan cloud, OS, lisensi controller
                                        jaringan, sertifikat, atau pembaruan
                                        kunci.
                                    </p>
                                </div>
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Technical Specifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            {category === "jaringan"
                                ? "Spesifikasi Perangkat Jaringan"
                                : "Informasi Lisensi Perangkat Lunak"}
                        </CardTitle>
                        <CardDescription>
                            {category === "jaringan"
                                ? "Informasi merk, seri model, dan prefix nomor seri unit."
                                : "Detail produk perangkat lunak dan nomor kunci/kontrak."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {category === "jaringan" ? (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Field>
                                        <FieldLabel htmlFor="procurement-brand">
                                            Merk / Vendor{" "}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <Input
                                            id="procurement-brand"
                                            placeholder="Contoh: Aruba, Cisco, Fortinet"
                                            value={brand}
                                            onChange={(e) =>
                                                setBrand(e.target.value)
                                            }
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="procurement-model">
                                            Seri / Model{" "}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <Input
                                            id="procurement-model"
                                            placeholder="Contoh: AP-635, Catalyst 2960"
                                            value={model}
                                            onChange={(e) =>
                                                setModel(e.target.value)
                                            }
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Field>
                                        <FieldLabel htmlFor="procurement-type">
                                            Tipe Fungsi Perangkat
                                        </FieldLabel>
                                        <Select
                                            value={deviceType}
                                            onValueChange={(val) =>
                                                setDeviceType(
                                                    val as NetworkDeviceType
                                                )
                                            }
                                            disabled={isSubmitting}
                                        >
                                            <SelectTrigger
                                                id="procurement-type"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Pilih Tipe" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {NETWORK_DEVICE_TYPES.map(
                                                    (t) => (
                                                        <SelectItem
                                                            key={t}
                                                            value={t}
                                                        >
                                                            {t}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="procurement-sn-prefix">
                                            Prefix Nomor Seri Sementara{" "}
                                            <span className="text-xs font-normal text-muted-foreground">
                                                (Opsional)
                                            </span>
                                        </FieldLabel>
                                        <Input
                                            id="procurement-sn-prefix"
                                            placeholder={`Default: ${suggestedPrefix}`}
                                            value={snPrefix}
                                            onChange={(e) =>
                                                setSnPrefix(e.target.value)
                                            }
                                            disabled={isSubmitting}
                                        />
                                    </Field>
                                </div>

                                <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                                    Format nomor seri sementara:{" "}
                                    <span className="font-mono font-medium text-foreground">
                                        {suggestedPrefix}001
                                    </span>{" "}
                                    s.d{" "}
                                    <span className="font-mono font-medium text-foreground">
                                        {suggestedPrefix}
                                        {String(quantity).padStart(
                                            Math.max(
                                                3,
                                                String(quantity).length
                                            ),
                                            "0"
                                        )}
                                    </span>
                                    . Unit akan disimpan dengan status
                                    operasional awal:{" "}
                                    <strong className="text-foreground">
                                        Belum Dipasang
                                    </strong>
                                    . Teknisi dapat memperbarui nomor seri riil,
                                    lokasi, dan IP di kemudian hari saat
                                    pemasangan fisik.
                                </div>
                            </>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field>
                                    <FieldLabel htmlFor="procurement-lic-name">
                                        Nama Produk Lisensi{" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        id="procurement-lic-name"
                                        placeholder="Contoh: Aruba Central Cloud Subscription"
                                        value={licenseName}
                                        onChange={(e) =>
                                            setLicenseName(e.target.value)
                                        }
                                        disabled={isSubmitting}
                                        required
                                    />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="procurement-lic-num">
                                        Nomor Kontrak / Kunci Lisensi{" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        id="procurement-lic-num"
                                        placeholder="Contoh: LIC-2023-ARB-001"
                                        value={licenseNumber}
                                        onChange={(e) =>
                                            setLicenseNumber(e.target.value)
                                        }
                                        disabled={isSubmitting}
                                        required
                                    />
                                </Field>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quantity & Auto Pricing */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Jumlah Unit &amp; Nilai Belanja
                        </CardTitle>
                        <CardDescription>
                            Sistem otomatis menghitung harga satuan aset
                            berdasarkan total nilai belanja dan jumlah unit.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="procurement-qty">
                                    Jumlah Unit (Quantity){" "}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Input
                                    id="procurement-qty"
                                    type="number"
                                    min={1}
                                    value={quantity}
                                    onChange={(e) =>
                                        setQuantity(
                                            Math.max(
                                                1,
                                                parseInt(e.target.value, 10) ||
                                                    1
                                            )
                                        )
                                    }
                                    disabled={isSubmitting}
                                    required
                                />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="procurement-total-price">
                                    Total Nilai Belanja (Rp){" "}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        (Opsional)
                                    </span>
                                </FieldLabel>
                                <Input
                                    id="procurement-total-price"
                                    type="number"
                                    min={0}
                                    placeholder="Contoh: 100000000"
                                    value={totalPrice}
                                    onChange={(e) =>
                                        setTotalPrice(
                                            e.target.value === ""
                                                ? ""
                                                : Math.max(
                                                      0,
                                                      parseInt(
                                                          e.target.value,
                                                          10
                                                      ) || 0
                                                  )
                                        )
                                    }
                                    disabled={isSubmitting}
                                />
                            </Field>
                        </div>

                        {/* Live Calculation Preview */}
                        <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3.5 text-sm">
                            <span className="flex items-center gap-2 font-medium text-muted-foreground">
                                <Calculator className="size-4 text-primary" />
                                Estimasi Harga Satuan Aset:
                            </span>
                            <span className="font-mono text-base font-bold text-foreground">
                                {unitPrice > 0
                                    ? `Rp ${unitPrice.toLocaleString("id-ID")} / unit`
                                    : "Rp 0"}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Warranty Duration & Dates */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Periode &amp; Masa Garansi
                        </CardTitle>
                        <CardDescription>
                            Pilih durasi garansi untuk menghitung tanggal akhir
                            masa garansi secara otomatis.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Field>
                                <FieldLabel htmlFor="procurement-start-date">
                                    Tanggal Mulai
                                </FieldLabel>
                                <Input
                                    id="procurement-start-date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        handleStartDateChange(e.target.value)
                                    }
                                    disabled={isSubmitting}
                                />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="procurement-warranty-duration">
                                    Durasi Garansi
                                </FieldLabel>
                                <Select
                                    value={warrantyDuration}
                                    onValueChange={handleWarrantyDurationChange}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger
                                        id="procurement-warranty-duration"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Pilih Durasi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">
                                            1 Tahun
                                        </SelectItem>
                                        <SelectItem value="2">
                                            2 Tahun
                                        </SelectItem>
                                        <SelectItem value="3">
                                            3 Tahun
                                        </SelectItem>
                                        <SelectItem value="5">
                                            5 Tahun
                                        </SelectItem>
                                        <SelectItem value="custom">
                                            Kustom
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="procurement-end-date">
                                    Akhir Garansi
                                </FieldLabel>
                                <Input
                                    id="procurement-end-date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setWarrantyDuration("custom");
                                    }}
                                    disabled={isSubmitting}
                                />
                            </Field>
                        </div>

                        {endDate && (
                            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                                <ShieldCheck className="size-4 text-primary" />
                                <span>
                                    Masa garansi berakhir pada:{" "}
                                    <strong className="text-foreground">
                                        {formatDateIndo(endDate)}
                                    </strong>
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Catatan Tambahan
                        </CardTitle>
                        <CardDescription>
                            Keterangan opsional mengenai pengadaan aset ini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Field>
                            <FieldLabel htmlFor="procurement-notes">
                                Catatan Pengadaan{" "}
                                <span className="text-xs font-normal text-muted-foreground">
                                    (Opsional)
                                </span>
                            </FieldLabel>
                            <Input
                                id="procurement-notes"
                                placeholder="Contoh: Pengadaan 100 Unit AP Aruba Gedung Kanwil"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </Field>
                    </CardContent>
                </Card>

                {/* Progress bar during bulk generation */}
                {progress && (
                    <Card className="border-primary/40 bg-primary/5">
                        <CardContent className="space-y-2 p-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-foreground">
                                    Men-generate aset...
                                </span>
                                <span className="font-mono font-bold text-primary">
                                    {progress.current} / {progress.total} unit (
                                    {Math.round(
                                        (progress.current / progress.total) *
                                            100
                                    )}
                                    %)
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full bg-primary transition-all duration-200"
                                    style={{
                                        width: `${(progress.current / progress.total) * 100}%`,
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        asChild
                        disabled={isSubmitting}
                    >
                        <Link href={`/purchases/${purchase.id}`}>Batal</Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2
                                    data-icon="inline-start"
                                    className="size-4 animate-spin"
                                />
                                {progress
                                    ? `Memproses (${progress.current}/${progress.total})...`
                                    : "Menyimpan..."}
                            </>
                        ) : (
                            <>
                                <PlusCircle
                                    data-icon="inline-start"
                                    className="size-4"
                                />
                                Simpan Pengadaan Aset
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
