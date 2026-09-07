"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import useSWR from "swr";
import { Loader2, AlertCircle, ArrowLeft, Save, KeyRound } from "lucide-react";

import type { Asset, LicensePayload, Purchase } from "@/lib/types";
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

interface LicenseFormProps {
    licenseId?: number;
}

export function LicenseForm({ licenseId }: LicenseFormProps) {
    const router = useRouter();
    const formId = React.useId();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [serverError, setServerError] = React.useState<string | null>(null);

    const isEdit = Boolean(licenseId);

    // Fetch license details if editing
    const { data: licenseToEdit, isLoading: loadingLicense } = useSWR<Asset>(
        licenseId ? `/api/assets/${licenseId}` : null,
        fetcher
    );

    const { data: purchases } = useSWR<Purchase[]>("/api/purchases", fetcher);

    const {
        register,
        handleSubmit,
        control,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<LicensePayload>({
        values: {
            name: licenseToEdit?.name ?? "",
            number: licenseToEdit?.number ?? "",
            unit_price: licenseToEdit?.unit_price ?? null,
            end_date: licenseToEdit?.end_date
                ? licenseToEdit.end_date.slice(0, 10)
                : "",
            notes: licenseToEdit?.notes ?? "",
            purchase_id: null,
        },
    });

    async function onSubmit(data: LicensePayload) {
        setServerError(null);
        clearErrors();
        setIsSubmitting(true);

        try {
            if (isEdit && licenseToEdit) {
                await mutationFetcher<Asset>(
                    `/api/assets/${licenseToEdit.id}`,
                    "PUT",
                    {
                        category: "license",
                        name: data.name.trim(),
                        number: data.number.trim(),
                        unit_price: data.unit_price
                            ? Number(data.unit_price)
                            : null,
                        end_date: data.end_date || null,
                        notes: data.notes?.trim() || null,
                    }
                );

                router.push(`/licenses/${licenseToEdit.id}`);
            } else {
                const assetRes = await mutationFetcher<Asset>(
                    "/api/assets",
                    "POST",
                    {
                        category: "license",
                        name: data.name.trim(),
                        number: data.number.trim(),
                        unit_price: data.unit_price
                            ? Number(data.unit_price)
                            : null,
                        end_date: data.end_date || null,
                        notes: data.notes?.trim() || null,
                    }
                );

                const createdAsset =
                    (assetRes as { data?: Asset }).data || (assetRes as Asset);

                if (createdAsset?.id && data.purchase_id) {
                    try {
                        await mutationFetcher("/api/asset-purchases", "POST", {
                            purchase_id: Number(data.purchase_id),
                            name: data.name.trim() || "Pengadaan Lisensi Software",
                            price: data.unit_price
                                ? Number(data.unit_price)
                                : null,
                            quantity: 1,
                            end_date: data.end_date || null,
                            notes: "Pengadaan lisensi software",
                            asset_ids: [createdAsset.id],
                        });
                    } catch {
                        // Non-blocking
                    }
                }

                router.push("/licenses");
            }
            router.refresh();
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                if (err.status === 422 && err.errors) {
                    if (err.errors.name?.[0]) {
                        setError("name", {
                            type: "server",
                            message: err.errors.name[0],
                        });
                    }
                    if (err.errors.number?.[0]) {
                        setError("number", {
                            type: "server",
                            message: err.errors.number[0],
                        });
                    }
                    if (err.errors.unit_price?.[0]) {
                        setError("unit_price", {
                            type: "server",
                            message: err.errors.unit_price[0],
                        });
                    }
                    if (err.errors.end_date?.[0]) {
                        setError("end_date", {
                            type: "server",
                            message: err.errors.end_date[0],
                        });
                    }
                    setServerError(
                        err.message || "Validasi data lisensi gagal."
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

    if (isEdit && loadingLicense) {
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
            {/* Page Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild>
                        <Link
                            href={
                                isEdit && licenseId
                                    ? `/licenses/${licenseId}`
                                    : "/licenses"
                            }
                        >
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Kembali</span>
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isEdit
                                ? "Edit Lisensi Software"
                                : "Tambah Lisensi Software"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isEdit
                                ? "Perbarui rincian lisensi, masa berlaku, dan belanja."
                                : "Daftarkan lisensi software atau kontrak layanan baru ke sistem."}
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
                        <KeyRound className="size-5 text-primary" />
                        <CardTitle className="text-lg">
                            Formulir Lisensi &amp; Masa Berlaku
                        </CardTitle>
                    </div>
                    <CardDescription>
                        Lengkapi informasi nama produk, serial/kunci lisensi,
                        biaya, dan belanja pengadaan.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form
                        id={formId}
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col gap-4"
                    >
                        <FieldGroup>
                            <Field data-invalid={Boolean(errors.name)}>
                                <FieldLabel htmlFor="license-name">
                                    Nama Lisensi / Produk
                                </FieldLabel>
                                <Input
                                    id="license-name"
                                    placeholder="Contoh: FortiGuard UTM Bundle Renewal 1 Year"
                                    disabled={isSubmitting}
                                    aria-invalid={Boolean(errors.name)}
                                    {...register("name", {
                                        required: "Nama lisensi wajib diisi",
                                    })}
                                />
                                {errors.name?.message && (
                                    <FieldError
                                        errors={[
                                            { message: errors.name.message },
                                        ]}
                                    />
                                )}
                            </Field>

                            <Field data-invalid={Boolean(errors.number)}>
                                <FieldLabel htmlFor="license-key">
                                    Kunci Lisensi / Nomor Seri
                                </FieldLabel>
                                <Input
                                    id="license-key"
                                    placeholder="Contoh: FG-LIC-2026-XXXX atau Serial Aset"
                                    disabled={isSubmitting}
                                    aria-invalid={Boolean(errors.number)}
                                    {...register("number", {
                                        required:
                                            "Kunci lisensi / SN wajib diisi",
                                    })}
                                />
                                {errors.number?.message && (
                                    <FieldError
                                        errors={[
                                            {
                                                message: errors.number.message,
                                            },
                                        ]}
                                    />
                                )}
                            </Field>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field data-invalid={Boolean(errors.end_date)}>
                                    <FieldLabel htmlFor="license-end-date">
                                        Berlaku Hingga{" "}
                                        <span className="text-xs font-normal text-muted-foreground">
                                            (Opsional)
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        id="license-end-date"
                                        type="date"
                                        disabled={isSubmitting}
                                        aria-invalid={Boolean(errors.end_date)}
                                        {...register("end_date")}
                                    />
                                </Field>

                                <Field
                                    data-invalid={Boolean(errors.unit_price)}
                                >
                                    <FieldLabel htmlFor="license-price">
                                        Biaya Lisensi (Rp){" "}
                                        <span className="text-xs font-normal text-muted-foreground">
                                            (Opsional)
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        id="license-price"
                                        type="number"
                                        min={0}
                                        placeholder="Contoh: 15000000"
                                        disabled={isSubmitting}
                                        {...register("unit_price", {
                                            valueAsNumber: true,
                                        })}
                                    />
                                </Field>
                            </div>

                            {!isEdit && (
                                <Field>
                                    <FieldLabel htmlFor="license-purchase">
                                        Belanja Pengadaan{" "}
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
                                                    id="license-purchase"
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
                                                            value={String(p.id)}
                                                        >
                                                            {p.year} (
                                                            {p.type === "modal"
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

                            <Field data-invalid={Boolean(errors.notes)}>
                                <FieldLabel htmlFor="license-notes">
                                    Catatan / Keterangan{" "}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        (Opsional)
                                    </span>
                                </FieldLabel>
                                <Input
                                    id="license-notes"
                                    placeholder="Contoh: Digunakan pada Firewall Kantor Pusat"
                                    disabled={isSubmitting}
                                    {...register("notes")}
                                />
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t pt-4">
                    <Button variant="outline" asChild disabled={isSubmitting}>
                        <Link
                            href={
                                isEdit && licenseId
                                    ? `/licenses/${licenseId}`
                                    : "/licenses"
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
                                {isEdit ? "Simpan Perubahan" : "Simpan Lisensi"}
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
