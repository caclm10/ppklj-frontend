"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import useSWR from "swr";
import {
    Loader2,
    AlertCircle,
    X,
    Plus,
    ArrowLeft,
    Save,
    Server,
} from "lucide-react";

import {
    type NetworkAsset,
    type NetworkAssetPayload,
    type NetworkAssetStatus,
    type Office,
    type Purchase,
    type Feature,
    type Asset,
    type NetworkDeviceType,
    NETWORK_DEVICE_TYPES,
} from "@/lib/types";
import { fetcher, mutationFetcher, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    FieldGroup,
    Field,
    FieldLabel,
    FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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

interface NetworkAssetFormProps {
    assetId?: number;
}

export function NetworkAssetForm({ assetId }: NetworkAssetFormProps) {
    const router = useRouter();
    const formId = React.useId();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [serverError, setServerError] = React.useState<string | null>(null);

    const isEdit = Boolean(assetId);

    // Fetch asset details if editing
    const { data: networkAssetToEdit, isLoading: loadingAsset } =
        useSWR<NetworkAsset>(
            assetId ? `/api/network-assets/${assetId}` : null,
            fetcher
        );

    const { data: offices } = useSWR<Office[]>("/api/offices", fetcher);
    const { data: purchases } = useSWR<Purchase[]>("/api/purchases", fetcher);
    const { data: availableFeatures } = useSWR<Feature[]>(
        "/api/features",
        fetcher
    );

    const [tagInput, setTagInput] = React.useState("");

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<NetworkAssetPayload>({
        values: {
            serial_number: networkAssetToEdit?.asset?.number ?? "",
            device_name: networkAssetToEdit?.asset?.name ?? "",
            brand: networkAssetToEdit?.brand ?? "",
            model: networkAssetToEdit?.model ?? "",
            type: networkAssetToEdit?.type ?? "Access Point",
            status: networkAssetToEdit?.status ?? "aktif",
            office_id: networkAssetToEdit?.office_id ?? null,
            ip: networkAssetToEdit?.ip ?? "",
            hostname: networkAssetToEdit?.hostname ?? "",
            unit_price: networkAssetToEdit?.asset?.unit_price ?? null,
            end_date: networkAssetToEdit?.asset?.end_date
                ? networkAssetToEdit.asset.end_date.slice(0, 10)
                : "",
            purchase_id: null,
            features: networkAssetToEdit?.features?.map((f) => f.name) ?? [],
        },
    });

    const tags = watch("features") || [];

    const handleAddTag = (value: string) => {
        const trimmed = value.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setValue("features", [...tags, trimmed]);
        }
        setTagInput("");
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setValue(
            "features",
            tags.filter((t) => t !== tagToRemove)
        );
    };

    async function onSubmit(data: NetworkAssetPayload) {
        setServerError(null);
        clearErrors();
        setIsSubmitting(true);

        const currentTags = data.features || [];

        try {
            if (isEdit && networkAssetToEdit) {
                // 1. Update Network Asset
                await mutationFetcher<NetworkAsset>(
                    `/api/network-assets/${networkAssetToEdit.id}`,
                    "PUT",
                    {
                        office_id: data.office_id
                            ? Number(data.office_id)
                            : null,
                        status: data.status,
                        brand: data.brand.trim(),
                        model: data.model.trim(),
                        type: data.type.trim(),
                        ip: data.ip?.trim() || null,
                        hostname: data.hostname?.trim() || null,
                        features: currentTags,
                    }
                );

                // 2. Update Parent Asset
                if (networkAssetToEdit.asset_id) {
                    await mutationFetcher<Asset>(
                        `/api/assets/${networkAssetToEdit.asset_id}`,
                        "PUT",
                        {
                            category: "jaringan",
                            name:
                                data.device_name?.trim() ||
                                `${data.brand.trim()} ${data.model.trim()}`,
                            number: data.serial_number.trim(),
                            unit_price: data.unit_price
                                ? Number(data.unit_price)
                                : null,
                            end_date: data.end_date || null,
                        }
                    );
                }

                router.push(`/network-assets/${networkAssetToEdit.id}`);
            } else {
                // 1. Create Parent Asset
                const assetRes = await mutationFetcher<Asset>(
                    "/api/assets",
                    "POST",
                    {
                        category: "jaringan",
                        name:
                            data.device_name?.trim() ||
                            `${data.brand.trim()} ${data.model.trim()}`,
                        number: data.serial_number.trim(),
                        unit_price: data.unit_price
                            ? Number(data.unit_price)
                            : null,
                        end_date: data.end_date || null,
                    }
                );

                const createdAsset =
                    (assetRes as { data?: Asset }).data || (assetRes as Asset);

                if (!createdAsset?.id) {
                    throw new Error("Gagal mendaftarkan data aset induk.");
                }

                if (data.purchase_id) {
                    try {
                        await mutationFetcher("/api/asset-purchases", "POST", {
                            purchase_id: Number(data.purchase_id),
                            name: `${data.brand} ${data.model}`.trim() || "Pengadaan Perangkat Jaringan",
                            price: data.unit_price
                                ? Number(data.unit_price)
                                : null,
                            quantity: 1,
                            end_date: data.end_date || null,
                            notes: "Pengadaan awal perangkat jaringan",
                            asset_ids: [createdAsset.id],
                        });
                    } catch {
                        // Non-blocking
                    }
                }

                // 3. Create Network Asset details
                await mutationFetcher<NetworkAsset>(
                    "/api/network-assets",
                    "POST",
                    {
                        asset_id: createdAsset.id,
                        office_id: data.office_id
                            ? Number(data.office_id)
                            : null,
                        status: data.status,
                        brand: data.brand.trim(),
                        model: data.model.trim(),
                        type: data.type.trim(),
                        ip: data.ip?.trim() || null,
                        hostname: data.hostname?.trim() || null,
                        features: currentTags,
                    }
                );

                router.push("/network-assets");
            }
            router.refresh();
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                if (err.status === 422 && err.errors) {
                    if (
                        err.errors.serial_number?.[0] ||
                        err.errors.number?.[0]
                    ) {
                        setError("serial_number", {
                            type: "server",
                            message:
                                err.errors.serial_number?.[0] ||
                                err.errors.number?.[0],
                        });
                    }
                    if (err.errors.brand?.[0]) {
                        setError("brand", {
                            type: "server",
                            message: err.errors.brand[0],
                        });
                    }
                    if (err.errors.model?.[0]) {
                        setError("model", {
                            type: "server",
                            message: err.errors.model[0],
                        });
                    }
                    if (err.errors.type?.[0]) {
                        setError("type", {
                            type: "server",
                            message: err.errors.type[0],
                        });
                    }
                    if (err.errors.ip?.[0]) {
                        setError("ip", {
                            type: "server",
                            message: err.errors.ip[0],
                        });
                    }
                    setServerError(
                        err.message || "Validasi formulir perangkat gagal."
                    );
                } else {
                    setServerError(
                        err.message || "Terjadi kesalahan pada server."
                    );
                }
            } else if (err instanceof Error) {
                setServerError(err.message);
            } else {
                setServerError("Terjadi kesalahan sistem yang tidak terduga.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isEdit && loadingAsset) {
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

    return (
        <div className="flex flex-col gap-6">
            {/* Page Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild>
                        <Link
                            href={
                                isEdit && assetId
                                    ? `/network-assets/${assetId}`
                                    : "/network-assets"
                            }
                        >
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Kembali</span>
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isEdit
                                ? "Edit Perangkat Jaringan"
                                : "Tambah Perangkat Jaringan"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isEdit
                                ? "Perbarui informasi teknis, penempatan, dan fitur perangkat."
                                : "Daftarkan perangkat jaringan baru ke inventaris sistem."}
                        </p>
                    </div>
                </div>
            </div>

            {serverError && (
                <Alert variant="destructive">
                    <AlertCircle data-icon="inline-start" />
                    <AlertTitle>Kesalahan</AlertTitle>
                    <AlertDescription>{serverError}</AlertDescription>
                </Alert>
            )}

            {/* Form Card Container */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Server className="size-5 text-primary" />
                        <CardTitle className="text-lg">
                            Formulir Spesifikasi &amp; Penempatan
                        </CardTitle>
                    </div>
                    <CardDescription>
                        Lengkapi atribut fisik, konfigurasi IP, nomor seri, dan
                        fitur teknis perangkat.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form
                        id={formId}
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col gap-6"
                    >
                        <FieldGroup>
                            {/* Section 1: Identitas Fisik */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field
                                    data-invalid={Boolean(errors.serial_number)}
                                >
                                    <FieldLabel htmlFor="device-sn">
                                        Nomor Seri / SN
                                    </FieldLabel>
                                    <Input
                                        id="device-sn"
                                        placeholder="Contoh: WS-C2960X-48FPS-SN01"
                                        disabled={isSubmitting}
                                        aria-invalid={Boolean(
                                            errors.serial_number
                                        )}
                                        {...register("serial_number", {
                                            required: "Nomor seri wajib diisi",
                                        })}
                                    />
                                    {errors.serial_number?.message && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message:
                                                        errors.serial_number
                                                            .message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>

                                <Field data-invalid={Boolean(errors.brand)}>
                                    <FieldLabel htmlFor="device-brand">
                                        Merk / Brand
                                    </FieldLabel>
                                    <Input
                                        id="device-brand"
                                        placeholder="Contoh: Cisco, MikroTik, Fortinet"
                                        disabled={isSubmitting}
                                        aria-invalid={Boolean(errors.brand)}
                                        {...register("brand", {
                                            required: "Merk wajib diisi",
                                        })}
                                    />
                                    {errors.brand?.message && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message:
                                                        errors.brand.message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field data-invalid={Boolean(errors.model)}>
                                    <FieldLabel htmlFor="device-model">
                                        Model / Seri Perangkat
                                    </FieldLabel>
                                    <Input
                                        id="device-model"
                                        placeholder="Contoh: Catalyst 2960X-48FPS-L"
                                        disabled={isSubmitting}
                                        aria-invalid={Boolean(errors.model)}
                                        {...register("model", {
                                            required: "Model/seri wajib diisi",
                                        })}
                                    />
                                    {errors.model?.message && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message:
                                                        errors.model.message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>

                                <Field data-invalid={Boolean(errors.type)}>
                                    <FieldLabel htmlFor="device-type">
                                        Kategori / Tipe
                                    </FieldLabel>
                                    <Controller
                                        name="type"
                                        control={control}
                                        rules={{
                                            required:
                                                "Kategori tipe wajib dipilih",
                                        }}
                                        render={({ field }) => {
                                            const isCustom =
                                                field.value &&
                                                !NETWORK_DEVICE_TYPES.includes(
                                                    field.value as NetworkDeviceType
                                                );
                                            return (
                                                <Select
                                                    value={
                                                        field.value ||
                                                        "Access Point"
                                                    }
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    disabled={isSubmitting}
                                                >
                                                    <SelectTrigger
                                                        id="device-type"
                                                        className="w-full"
                                                    >
                                                        <SelectValue placeholder="Pilih Tipe Perangkat" />
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
                                                        {isCustom && (
                                                            <SelectItem
                                                                value={
                                                                    field.value
                                                                }
                                                            >
                                                                {field.value}
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            );
                                        }}
                                    />
                                    {errors.type?.message && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message:
                                                        errors.type.message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>
                            </div>

                            {/* Section 2: Penempatan & Status */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field data-invalid={Boolean(errors.status)}>
                                    <FieldLabel htmlFor="device-status">
                                        Status Operasional
                                    </FieldLabel>
                                    <Controller
                                        name="status"
                                        control={control}
                                        rules={{
                                            required: "Status wajib dipilih",
                                        }}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={(val) =>
                                                    field.onChange(
                                                        val as NetworkAssetStatus
                                                    )
                                                }
                                                disabled={isSubmitting}
                                            >
                                                <SelectTrigger
                                                    id="device-status"
                                                    className="w-full"
                                                >
                                                    <SelectValue placeholder="Pilih status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="aktif">
                                                        Aktif Digunakan
                                                    </SelectItem>
                                                    <SelectItem value="belum_dipasang">
                                                        Belum Dipasang /
                                                        Cadangan
                                                    </SelectItem>
                                                    <SelectItem value="tidak_aktif">
                                                        Tidak Aktif / Rusak
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </Field>

                                <Field data-invalid={Boolean(errors.office_id)}>
                                    <FieldLabel htmlFor="device-office">
                                        Lokasi Kantor
                                    </FieldLabel>
                                    <Controller
                                        name="office_id"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                value={
                                                    field.value
                                                        ? String(field.value)
                                                        : "none"
                                                }
                                                onValueChange={(val) =>
                                                    field.onChange(
                                                        val === "none"
                                                            ? null
                                                            : Number(val)
                                                    )
                                                }
                                                disabled={isSubmitting}
                                            >
                                                <SelectTrigger
                                                    id="device-office"
                                                    className="w-full"
                                                >
                                                    <SelectValue placeholder="Pilih lokasi kantor" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">
                                                        Belum Ditentukan
                                                    </SelectItem>
                                                    {offices?.map((office) => (
                                                        <SelectItem
                                                            key={office.id}
                                                            value={String(
                                                                office.id
                                                            )}
                                                        >
                                                            {office.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </Field>
                            </div>

                            {/* Section 3: Konfigurasi Jaringan */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field data-invalid={Boolean(errors.ip)}>
                                    <FieldLabel htmlFor="device-ip">
                                        IP Address{" "}
                                        <span className="text-xs font-normal text-muted-foreground">
                                            (Opsional)
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        id="device-ip"
                                        placeholder="Contoh: 192.168.10.15"
                                        disabled={isSubmitting}
                                        aria-invalid={Boolean(errors.ip)}
                                        {...register("ip")}
                                    />
                                    {errors.ip?.message && (
                                        <FieldError
                                            errors={[
                                                { message: errors.ip.message },
                                            ]}
                                        />
                                    )}
                                </Field>

                                <Field data-invalid={Boolean(errors.hostname)}>
                                    <FieldLabel htmlFor="device-hostname">
                                        Hostname{" "}
                                        <span className="text-xs font-normal text-muted-foreground">
                                            (Opsional)
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        id="device-hostname"
                                        placeholder="Contoh: SW-ACC-LT2"
                                        disabled={isSubmitting}
                                        aria-invalid={Boolean(errors.hostname)}
                                        {...register("hostname")}
                                    />
                                </Field>
                            </div>

                            {/* Section 4: Belanja & Garansi */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {!isEdit && (
                                    <Field>
                                        <FieldLabel htmlFor="device-purchase">
                                            Belanja{" "}
                                            <span className="text-xs font-normal text-muted-foreground">
                                                (Opsional)
                                            </span>
                                        </FieldLabel>
                                        <Controller
                                            name="purchase_id"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={
                                                        field.value
                                                            ? String(
                                                                  field.value
                                                              )
                                                            : "none"
                                                    }
                                                    onValueChange={(val) =>
                                                        field.onChange(
                                                            val === "none"
                                                                ? null
                                                                : Number(val)
                                                        )
                                                    }
                                                    disabled={isSubmitting}
                                                >
                                                    <SelectTrigger
                                                        id="device-purchase"
                                                        className="w-full"
                                                    >
                                                        <SelectValue placeholder="Pilih belanja" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            Tanpa Belanja
                                                        </SelectItem>
                                                        {purchases?.map((p) => (
                                                            <SelectItem
                                                                key={p.id}
                                                                value={String(
                                                                    p.id
                                                                )}
                                                            >
                                                                {p.year} (
                                                                {p.type ===
                                                                "modal"
                                                                    ? "53"
                                                                    : "52"}
                                                                )
                                                                {p.description
                                                                    ? ` - ${p.description}`
                                                                    : ""}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </Field>
                                )}

                                <Field>
                                    <FieldLabel htmlFor="device-price">
                                        Harga Satuan (Rp){" "}
                                        <span className="text-xs font-normal text-muted-foreground">
                                            (Opsional)
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        id="device-price"
                                        type="number"
                                        min={0}
                                        placeholder="Contoh: 28500000"
                                        disabled={isSubmitting}
                                        {...register("unit_price", {
                                            valueAsNumber: true,
                                        })}
                                    />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="device-end-date">
                                        Garansi / Berlaku Hingga{" "}
                                        <span className="text-xs font-normal text-muted-foreground">
                                            (Opsional)
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        id="device-end-date"
                                        type="date"
                                        disabled={isSubmitting}
                                        {...register("end_date")}
                                    />
                                </Field>
                            </div>

                            {/* Section 5: Creatable Features / Tags */}
                            <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-4">
                                <FieldLabel>
                                    Tag Fitur Teknis{" "}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        (Ketik lalu tekan Enter atau pilih dari
                                        katalog master)
                                    </span>
                                </FieldLabel>

                                {/* Active Tags */}
                                <div className="flex min-h-[36px] flex-wrap items-center gap-1.5">
                                    {tags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="flex items-center gap-1 px-2.5 py-1 text-xs"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRemoveTag(tag)
                                                }
                                                className="ml-0.5 transition-colors hover:text-destructive"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    <div className="flex min-w-[200px] flex-1 items-center gap-1">
                                        <Input
                                            value={tagInput}
                                            onChange={(e) =>
                                                setTagInput(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === "Enter" ||
                                                    e.key === ","
                                                ) {
                                                    e.preventDefault();
                                                    handleAddTag(tagInput);
                                                }
                                            }}
                                            placeholder="Ketik tag baru lalu Enter..."
                                            className="h-8 bg-background text-xs"
                                            disabled={isSubmitting}
                                        />
                                        {tagInput.trim() && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="h-8 px-2 text-xs"
                                                onClick={() =>
                                                    handleAddTag(tagInput)
                                                }
                                            >
                                                <Plus className="size-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Suggested Tags from Backend Master */}
                                {availableFeatures &&
                                    availableFeatures.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-2">
                                            <span className="text-xs text-muted-foreground">
                                                Pilih dari katalog:
                                            </span>
                                            {availableFeatures
                                                .filter(
                                                    (f) =>
                                                        !tags.includes(f.name)
                                                )
                                                .slice(0, 10)
                                                .map((feature) => (
                                                    <button
                                                        key={feature.id}
                                                        type="button"
                                                        onClick={() =>
                                                            handleAddTag(
                                                                feature.name
                                                            )
                                                        }
                                                        className="rounded-md border border-dashed bg-background px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                                    >
                                                        + {feature.name}
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                            </div>
                        </FieldGroup>
                    </form>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t pt-4">
                    <Button variant="outline" asChild disabled={isSubmitting}>
                        <Link
                            href={
                                isEdit && assetId
                                    ? `/network-assets/${assetId}`
                                    : "/network-assets"
                            }
                        >
                            Batal
                        </Link>
                    </Button>
                    <Button form={formId} type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2
                                    data-icon="inline-start"
                                    className="animate-spin"
                                />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save
                                    data-icon="inline-start"
                                    className="size-4"
                                />
                                {isEdit
                                    ? "Simpan Perubahan"
                                    : "Simpan Perangkat"}
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
