"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { Loader2, AlertCircle } from "lucide-react";

import type { Office, OfficePayload, OfficeType } from "@/lib/types";
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

interface OfficeFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    officeToEdit: Office | null;
    onSuccess: () => void;
}

export function OfficeFormDialog({
    open,
    onOpenChange,
    officeToEdit,
    onSuccess,
}: OfficeFormDialogProps) {
    const formId = React.useId();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [serverError, setServerError] = React.useState<string | null>(null);

    const isEdit = Boolean(officeToEdit);

    const {
        register,
        handleSubmit,
        control,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<OfficePayload>({
        values: {
            type: officeToEdit?.type ?? "vertikal",
            name: officeToEdit?.name ?? "",
        },
    });

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setServerError(null);
            clearErrors();
        }
        onOpenChange(newOpen);
    };

    async function onSubmit(data: OfficePayload) {
        setServerError(null);
        clearErrors();
        setIsSubmitting(true);

        try {
            if (isEdit && officeToEdit) {
                await mutationFetcher<Office>(
                    `/api/offices/${officeToEdit.id}`,
                    "PUT",
                    {
                        type: data.type,
                        name: data.name.trim(),
                    }
                );
            } else {
                await mutationFetcher<Office>("/api/offices", "POST", {
                    type: data.type,
                    name: data.name.trim(),
                });
            }

            onSuccess();
            handleOpenChange(false);
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                if (err.status === 422 && err.errors) {
                    if (err.errors.name?.[0]) {
                        setError("name", {
                            type: "server",
                            message: err.errors.name[0],
                        });
                    }
                    if (err.errors.type?.[0]) {
                        setError("type", {
                            type: "server",
                            message: err.errors.type[0],
                        });
                    }
                    if (!err.errors.name && !err.errors.type) {
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
                        {isEdit ? "Edit Lokasi Kantor" : "Tambah Lokasi Kantor"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Perbarui informasi kantor dan tipe penempatan."
                            : "Daftarkan nama kantor dan tipe penempatan baru."}
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
                            <FieldLabel htmlFor="type">Tipe Kantor</FieldLabel>
                            <Controller
                                name="type"
                                control={control}
                                rules={{
                                    required: "Tipe kantor wajib dipilih",
                                }}
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={(val) =>
                                            field.onChange(val as OfficeType)
                                        }
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger
                                            id="type"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Pilih tipe kantor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pusat">
                                                Kantor Pusat
                                            </SelectItem>
                                            <SelectItem value="vertikal">
                                                Kantor Vertikal / Wilayah
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

                        <Field data-invalid={Boolean(errors.name)}>
                            <FieldLabel htmlFor="office-name">
                                Nama Kantor
                            </FieldLabel>
                            <Input
                                id="office-name"
                                placeholder="Contoh: Kantor Wilayah Jawa Barat"
                                disabled={isSubmitting}
                                aria-invalid={Boolean(errors.name)}
                                {...register("name", {
                                    required: "Nama kantor wajib diisi",
                                })}
                            />
                            {errors.name?.message && (
                                <FieldError
                                    errors={[{ message: errors.name.message }]}
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
                            "Tambah Kantor"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
