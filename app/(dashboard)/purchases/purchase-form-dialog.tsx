"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { Loader2, AlertCircle } from "lucide-react";

import type { Purchase, PurchasePayload, PurchaseType } from "@/lib/types";
import { mutationFetcher, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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

interface PurchaseFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    purchaseToEdit: Purchase | null;
    onSuccess: () => void;
}

export function PurchaseFormDialog({
    open,
    onOpenChange,
    purchaseToEdit,
    onSuccess,
}: PurchaseFormDialogProps) {
    const formId = React.useId();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [serverError, setServerError] = React.useState<string | null>(null);

    const isEdit = Boolean(purchaseToEdit);
    const currentYear = new Date().getFullYear();

    const {
        register,
        handleSubmit,
        control,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<PurchasePayload>({
        values: {
            type: purchaseToEdit?.type ?? "modal",
            year: purchaseToEdit?.year ?? currentYear,
            description: purchaseToEdit?.description ?? "",
        },
    });

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setServerError(null);
            clearErrors();
        }
        onOpenChange(newOpen);
    };

    async function onSubmit(data: PurchasePayload) {
        setServerError(null);
        clearErrors();
        setIsSubmitting(true);

        const payload = {
            type: data.type,
            year: Number(data.year),
            description: data.description?.trim() || null,
        };

        try {
            if (isEdit && purchaseToEdit) {
                await mutationFetcher<Purchase>(
                    `/api/purchases/${purchaseToEdit.id}`,
                    "PUT",
                    payload
                );
            } else {
                await mutationFetcher<Purchase>(
                    "/api/purchases",
                    "POST",
                    payload
                );
            }

            onSuccess();
            handleOpenChange(false);
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                if (err.status === 422 && err.errors) {
                    if (err.errors.type?.[0]) {
                        setError("type", {
                            type: "server",
                            message: err.errors.type[0],
                        });
                    }
                    if (err.errors.year?.[0]) {
                        setError("year", {
                            type: "server",
                            message: err.errors.year[0],
                        });
                    }
                    if (err.errors.description?.[0]) {
                        setError("description", {
                            type: "server",
                            message: err.errors.description[0],
                        });
                    }
                    if (
                        !err.errors.type &&
                        !err.errors.year &&
                        !err.errors.description
                    ) {
                        setServerError(
                            err.message || "Validasi formulir gagal."
                        );
                    }
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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Edit Belanja" : "Tambah Belanja"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Perbarui informasi anggaran belanja modal atau pemeliharaan."
                            : "Daftarkan anggaran belanja baru untuk modal atau pemeliharaan."}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id={formId}
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-4 py-2"
                >
                    {serverError && (
                        <Alert variant="destructive">
                            <AlertCircle data-icon="inline-start" />
                            <AlertTitle>Kesalahan</AlertTitle>
                            <AlertDescription>{serverError}</AlertDescription>
                        </Alert>
                    )}

                    <FieldGroup>
                        <Field data-invalid={Boolean(errors.type)}>
                            <FieldLabel htmlFor="purchase-type">
                                Jenis Akun Belanja
                            </FieldLabel>
                            <Controller
                                name="type"
                                control={control}
                                rules={{
                                    required: "Jenis belanja wajib dipilih",
                                }}
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={(val) =>
                                            field.onChange(val as PurchaseType)
                                        }
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger
                                            id="purchase-type"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Pilih jenis belanja" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="modal">
                                                Belanja Modal (53)
                                            </SelectItem>
                                            <SelectItem value="pemeliharaan">
                                                Belanja Pemeliharaan (52)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.type?.message && (
                                <FieldError
                                    errors={[{ message: errors.type.message }]}
                                />
                            )}
                        </Field>

                        <Field data-invalid={Boolean(errors.year)}>
                            <FieldLabel htmlFor="purchase-year">
                                Tahun Anggaran
                            </FieldLabel>
                            <Input
                                id="purchase-year"
                                type="number"
                                min={2000}
                                max={2100}
                                placeholder="Contoh: 2026"
                                disabled={isSubmitting}
                                aria-invalid={Boolean(errors.year)}
                                {...register("year", {
                                    required: "Tahun anggaran wajib diisi",
                                    valueAsNumber: true,
                                    min: {
                                        value: 2000,
                                        message: "Tahun minimal 2000",
                                    },
                                })}
                            />
                            {errors.year?.message && (
                                <FieldError
                                    errors={[{ message: errors.year.message }]}
                                />
                            )}
                        </Field>

                        <Field data-invalid={Boolean(errors.description)}>
                            <FieldLabel htmlFor="purchase-desc">
                                Uraian / Keterangan Belanja{" "}
                                <span className="text-xs font-normal text-muted-foreground">
                                    (Opsional)
                                </span>
                            </FieldLabel>
                            <Input
                                id="purchase-desc"
                                placeholder="Contoh: Pengadaan Switch Core & Perangkat Jaringan"
                                disabled={isSubmitting}
                                aria-invalid={Boolean(errors.description)}
                                {...register("description")}
                            />
                            {errors.description?.message && (
                                <FieldError
                                    errors={[
                                        { message: errors.description.message },
                                    ]}
                                />
                            )}
                        </Field>
                    </FieldGroup>
                </form>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Batal
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
                        ) : isEdit ? (
                            "Simpan Perubahan"
                        ) : (
                            "Tambah Belanja"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
