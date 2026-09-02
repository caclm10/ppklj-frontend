"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import useSWR from "swr";
import { Loader2, AlertCircle, ArrowLeft, Save, Truck } from "lucide-react";

import type {
    AssetRma,
    CreateAssetRmaPayload,
    NetworkAsset,
    RmaStatus,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface RmaFormProps {
    rmaId?: number;
    defaultAssetId?: number;
}

const statusOptions: { value: RmaStatus; label: string }[] = [
    { value: "rusak_di_kantor", label: "Rusak di Kantor" },
    { value: "pengiriman_ke_pusat", label: "Pengiriman ke Pusat" },
    { value: "diterima_di_pusat", label: "Diterima di Pusat" },
    { value: "pengiriman_ke_vendor", label: "Pengiriman ke Vendor / TAC" },
    { value: "diproses_vendor", label: "Sedang Diproses Vendor" },
    { value: "diterima_dari_vendor", label: "Diterima dari Vendor" },
    { value: "pengiriman_ke_kantor", label: "Pengiriman ke Kantor Asal" },
    { value: "selesai_dipasang", label: "Selesai & Dipasang Kembali" },
];

export function RmaForm({ rmaId, defaultAssetId }: RmaFormProps) {
    const router = useRouter();
    const formId = React.useId();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [serverError, setServerError] = React.useState<string | null>(null);

    const isEdit = Boolean(rmaId);

    const { data: rmaToEdit, isLoading: loadingRma } = useSWR<AssetRma>(
        rmaId ? `/api/asset-rmas/${rmaId}` : null,
        fetcher
    );

    const { data: networkAssets } = useSWR<NetworkAsset[]>(
        "/api/network-assets",
        fetcher
    );

    const {
        register,
        handleSubmit,
        control,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<CreateAssetRmaPayload>({
        values: {
            asset_id: rmaToEdit?.asset_id ?? defaultAssetId ?? 0,
            pic_name: rmaToEdit?.pic_name ?? "",
            pic_phone: rmaToEdit?.pic_phone ?? "",
            rma_number: rmaToEdit?.rma_number ?? "",
            vendor_name: rmaToEdit?.vendor_name ?? "",
            current_status: rmaToEdit?.current_status ?? "rusak_di_kantor",
            problem_description: rmaToEdit?.problem_description ?? "",
            notes: "",
        },
    });

    async function onSubmit(data: CreateAssetRmaPayload) {
        setServerError(null);
        clearErrors();

        if (!isEdit && (!data.asset_id || data.asset_id === 0)) {
            setError("asset_id", {
                type: "manual",
                message: "Perangkat yang rusak wajib dipilih",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEdit && rmaToEdit) {
                await mutationFetcher(
                    `/api/asset-rmas/${rmaToEdit.id}`,
                    "PUT",
                    {
                        pic_name: data.pic_name.trim(),
                        pic_phone: data.pic_phone?.trim() || null,
                        rma_number: data.rma_number?.trim() || null,
                        vendor_name: data.vendor_name?.trim() || null,
                        problem_description:
                            data.problem_description?.trim() || null,
                    }
                );
                router.push(`/rmas/${rmaToEdit.id}`);
            } else {
                const res = await mutationFetcher<AssetRma>(
                    "/api/asset-rmas",
                    "POST",
                    {
                        asset_id: Number(data.asset_id),
                        pic_name: data.pic_name.trim(),
                        pic_phone: data.pic_phone?.trim() || null,
                        rma_number: data.rma_number?.trim() || null,
                        vendor_name: data.vendor_name?.trim() || null,
                        current_status: data.current_status,
                        problem_description:
                            data.problem_description?.trim() || null,
                        notes: data.notes?.trim() || null,
                    }
                );

                const createdRma =
                    (res as { data?: AssetRma }).data || (res as AssetRma);

                if (createdRma?.id) {
                    router.push(`/rmas/${createdRma.id}`);
                } else {
                    router.push("/rmas");
                }
            }
            router.refresh();
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                if (err.status === 422 && err.errors) {
                    if (err.errors.asset_id?.[0]) {
                        setError("asset_id", {
                            type: "server",
                            message: err.errors.asset_id[0],
                        });
                    }
                    if (err.errors.pic_name?.[0]) {
                        setError("pic_name", {
                            type: "server",
                            message: err.errors.pic_name[0],
                        });
                    }
                    if (err.errors.pic_phone?.[0]) {
                        setError("pic_phone", {
                            type: "server",
                            message: err.errors.pic_phone[0],
                        });
                    }
                    if (err.errors.rma_number?.[0]) {
                        setError("rma_number", {
                            type: "server",
                            message: err.errors.rma_number[0],
                        });
                    }
                    if (err.errors.vendor_name?.[0]) {
                        setError("vendor_name", {
                            type: "server",
                            message: err.errors.vendor_name[0],
                        });
                    }
                    setServerError(
                        err.message || "Validasi data tiket RMA gagal."
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

    if (isEdit && loadingRma) {
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
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild>
                        <Link
                            href={isEdit && rmaId ? `/rmas/${rmaId}` : "/rmas"}
                        >
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Kembali</span>
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isEdit ? "Edit Tiket RMA" : "Buka Tiket RMA Baru"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isEdit
                                ? "Perbarui informasi kontak PIC atau nomor tiket RMA vendor."
                                : "Catat pelaporan kerusakan perangkat untuk pelacakan servis dan klaim garansi."}
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

            {/* Form Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Truck className="size-5 text-primary" />
                        <CardTitle className="text-lg">
                            Formulir Pelaporan Kerusakan &amp; Servis
                        </CardTitle>
                    </div>
                    <CardDescription>
                        Lengkapi identitas perangkat yang mengalami kendala, PIC
                        penanggung jawab, dan catatan gejala kerusakan.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form
                        id={formId}
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col gap-4"
                    >
                        <FieldGroup>
                            {/* Device selection (Only on create) */}
                            {!isEdit ? (
                                <Field data-invalid={Boolean(errors.asset_id)}>
                                    <FieldLabel htmlFor="rma-asset">
                                        Pilih Perangkat yang Rusak
                                    </FieldLabel>
                                    <Controller
                                        name="asset_id"
                                        control={control}
                                        rules={{
                                            required:
                                                "Perangkat yang rusak wajib dipilih",
                                        }}
                                        render={({ field }) => (
                                            <Select
                                                value={
                                                    field.value &&
                                                    field.value !== 0
                                                        ? String(field.value)
                                                        : ""
                                                }
                                                onValueChange={(val) =>
                                                    field.onChange(Number(val))
                                                }
                                                disabled={isSubmitting}
                                            >
                                                <SelectTrigger
                                                    id="rma-asset"
                                                    className="w-full"
                                                >
                                                    <SelectValue placeholder="Pilih perangkat jaringan..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {networkAssets?.map(
                                                        (item) => (
                                                            <SelectItem
                                                                key={
                                                                    item.asset_id
                                                                }
                                                                value={String(
                                                                    item.asset_id
                                                                )}
                                                            >
                                                                {item.brand}{" "}
                                                                {item.model} —
                                                                SN:{" "}
                                                                {item.asset
                                                                    ?.number ||
                                                                    "-"}{" "}
                                                                (
                                                                {item.office
                                                                    ?.name ||
                                                                    "Tanpa Lokasi"}
                                                                )
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Perangkat yang dipilih akan otomatis
                                        diset statusnya menjadi &quot;Tidak
                                        Aktif&quot;.
                                    </p>
                                    {errors.asset_id?.message && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message:
                                                        errors.asset_id.message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>
                            ) : (
                                <div className="space-y-1 rounded-lg border bg-muted/20 p-3">
                                    <span className="text-xs text-muted-foreground">
                                        Perangkat Terkait
                                    </span>
                                    <p className="text-sm font-semibold">
                                        {rmaToEdit?.asset?.name} (SN:{" "}
                                        {rmaToEdit?.asset?.number})
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field data-invalid={Boolean(errors.pic_name)}>
                                    <FieldLabel htmlFor="rma-pic-name">
                                        Nama PIC / Pelapor
                                    </FieldLabel>
                                    <Input
                                        id="rma-pic-name"
                                        placeholder="Contoh: Budi Santoso (Admin IT Kanwil)"
                                        disabled={isSubmitting}
                                        aria-invalid={Boolean(errors.pic_name)}
                                        {...register("pic_name", {
                                            required:
                                                "Nama PIC pelapor wajib diisi",
                                        })}
                                    />
                                    {errors.pic_name?.message && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message:
                                                        errors.pic_name.message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>

                                <Field data-invalid={Boolean(errors.pic_phone)}>
                                    <FieldLabel htmlFor="rma-pic-phone">
                                        No. Kontak / WhatsApp PIC{" "}
                                        <span className="text-xs font-normal text-muted-foreground">
                                            (Opsional)
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        id="rma-pic-phone"
                                        placeholder="Contoh: 08123456789"
                                        disabled={isSubmitting}
                                        {...register("pic_phone")}
                                    />
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field
                                    data-invalid={Boolean(errors.vendor_name)}
                                >
                                    <FieldLabel htmlFor="rma-vendor">
                                        Nama Vendor / Service Center{" "}
                                        <span className="text-xs font-normal text-muted-foreground">
                                            (Opsional)
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        id="rma-vendor"
                                        placeholder="Contoh: Cisco TAC / Distributor Resmi"
                                        disabled={isSubmitting}
                                        {...register("vendor_name")}
                                    />
                                </Field>

                                <Field
                                    data-invalid={Boolean(errors.rma_number)}
                                >
                                    <FieldLabel htmlFor="rma-number">
                                        Nomor Tiket RMA / Servis Vendor{" "}
                                        <span className="text-xs font-normal text-muted-foreground">
                                            (Opsional)
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        id="rma-number"
                                        placeholder="Contoh: RMA-TAC-998811"
                                        disabled={isSubmitting}
                                        className="font-mono"
                                        {...register("rma_number")}
                                    />
                                </Field>
                            </div>

                            {!isEdit && (
                                <Field
                                    data-invalid={Boolean(
                                        errors.current_status
                                    )}
                                >
                                    <FieldLabel htmlFor="rma-status">
                                        Status Awal
                                    </FieldLabel>
                                    <Controller
                                        name="current_status"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={isSubmitting}
                                            >
                                                <SelectTrigger
                                                    id="rma-status"
                                                    className="w-full"
                                                >
                                                    <SelectValue placeholder="Pilih status awal" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {statusOptions.map(
                                                        (opt) => (
                                                            <SelectItem
                                                                key={opt.value}
                                                                value={
                                                                    opt.value
                                                                }
                                                            >
                                                                {opt.label}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </Field>
                            )}

                            <Field
                                data-invalid={Boolean(
                                    errors.problem_description
                                )}
                            >
                                <FieldLabel htmlFor="rma-problem">
                                    Deskripsi Gejala Kerusakan{" "}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        (Opsional)
                                    </span>
                                </FieldLabel>
                                <Input
                                    id="rma-problem"
                                    placeholder="Contoh: Port Switch 1-12 mati total setelah terkena lonjakan arus petir."
                                    disabled={isSubmitting}
                                    {...register("problem_description")}
                                />
                            </Field>

                            {!isEdit && (
                                <Field data-invalid={Boolean(errors.notes)}>
                                    <FieldLabel htmlFor="rma-notes">
                                        Catatan Milestone Awal{" "}
                                        <span className="text-xs font-normal text-muted-foreground">
                                            (Opsional)
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        id="rma-notes"
                                        placeholder="Contoh: Perangkat telah dicopot dari rak dan disimpan di ruang IT."
                                        disabled={isSubmitting}
                                        {...register("notes")}
                                    />
                                </Field>
                            )}
                        </FieldGroup>
                    </form>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t pt-4">
                    <Button variant="outline" asChild disabled={isSubmitting}>
                        <Link
                            href={isEdit && rmaId ? `/rmas/${rmaId}` : "/rmas"}
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
                                {isEdit ? "Simpan Perubahan" : "Buka Tiket RMA"}
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
