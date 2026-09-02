"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Loader2, AlertCircle } from "lucide-react";

import type { Feature, FeaturePayload } from "@/lib/types";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FeatureFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    featureToEdit: Feature | null;
    onSuccess: () => void;
}

export function FeatureFormDialog({
    open,
    onOpenChange,
    featureToEdit,
    onSuccess,
}: FeatureFormDialogProps) {
    const formId = React.useId();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [serverError, setServerError] = React.useState<string | null>(null);

    const isEdit = Boolean(featureToEdit);

    const {
        register,
        handleSubmit,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<FeaturePayload>({
        values: {
            name: featureToEdit?.name ?? "",
        },
    });

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setServerError(null);
            clearErrors();
        }
        onOpenChange(newOpen);
    };

    async function onSubmit(data: FeaturePayload) {
        setServerError(null);
        clearErrors();
        setIsSubmitting(true);

        const payload = {
            name: data.name.trim(),
        };

        try {
            if (isEdit && featureToEdit) {
                await mutationFetcher<Feature>(
                    `/api/features/${featureToEdit.id}`,
                    "PUT",
                    payload
                );
            } else {
                await mutationFetcher<Feature>(
                    "/api/features",
                    "POST",
                    payload
                );
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
                    if (!err.errors.name) {
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
                        {isEdit ? "Edit Fitur" : "Tambah Fitur"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Perbarui nama tag fitur perangkat jaringan."
                            : "Daftarkan nama tag fitur baru untuk perangkat jaringan."}
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
                        <Field data-invalid={Boolean(errors.name)}>
                            <FieldLabel htmlFor="feature-name">
                                Nama Fitur / Tag
                            </FieldLabel>
                            <Input
                                id="feature-name"
                                placeholder="Contoh: PoE+, VLAN, SFP+ 10G, BGP"
                                disabled={isSubmitting}
                                aria-invalid={Boolean(errors.name)}
                                {...register("name", {
                                    required: "Nama fitur wajib diisi",
                                    maxLength: {
                                        value: 255,
                                        message:
                                            "Nama fitur maksimal 255 karakter",
                                    },
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
                            "Tambah Fitur"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
