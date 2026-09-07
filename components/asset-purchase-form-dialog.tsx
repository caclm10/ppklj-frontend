"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import useSWR from "swr";
import { Loader2, AlertCircle, PlusCircle } from "lucide-react";

import type { AssetPurchasePayload, Purchase } from "@/lib/types";
import { fetcher, mutationFetcher, ApiError } from "@/lib/api";
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

interface AssetPurchaseFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assetId: number;
    onSuccess: () => void;
}

export function AssetPurchaseFormDialog({
    open,
    onOpenChange,
    assetId,
    onSuccess,
}: AssetPurchaseFormDialogProps) {
    const formId = React.useId();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [serverError, setServerError] = React.useState<string | null>(null);

    const { data: purchases } = useSWR<Purchase[]>("/api/purchases", fetcher);

    const {
        register,
        handleSubmit,
        control,
        reset,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<AssetPurchasePayload>({
        values: {
            name: "",
            asset_id: assetId,
            purchase_id: 0,
            price: null,
            quantity: 1,
            start_date: "",
            end_date: "",
            notes: "",
        },
    });

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setServerError(null);
            clearErrors();
            reset();
        }
        onOpenChange(newOpen);
    };

    async function onSubmit(data: AssetPurchasePayload) {
        setServerError(null);
        clearErrors();

        if (!data.purchase_id || data.purchase_id === 0) {
            setError("purchase_id", {
                type: "manual",
                message: "Belanja wajib dipilih",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await mutationFetcher("/api/asset-purchases", "POST", {
                name: data.name?.trim() || "Alokasi Belanja Aset",
                purchase_id: Number(data.purchase_id),
                price: data.price ? Number(data.price) : null,
                quantity: 1,
                start_date: data.start_date || null,
                end_date: data.end_date || null,
                notes: data.notes?.trim() || null,
                asset_ids: [assetId],
            });

            onSuccess();
            handleOpenChange(false);
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                if (err.status === 422 && err.errors) {
                    if (err.errors.purchase_id?.[0]) {
                        setError("purchase_id", {
                            type: "server",
                            message: err.errors.purchase_id[0],
                        });
                    }
                    if (err.errors.price?.[0]) {
                        setError("price", {
                            type: "server",
                            message: err.errors.price[0],
                        });
                    }
                    if (err.errors.start_date?.[0]) {
                        setError("start_date", {
                            type: "server",
                            message: err.errors.start_date[0],
                        });
                    }
                    if (err.errors.end_date?.[0]) {
                        setError("end_date", {
                            type: "server",
                            message: err.errors.end_date[0],
                        });
                    }
                    setServerError(
                        err.message || "Validasi data belanja gagal."
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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PlusCircle className="size-5 text-primary" />
                        Catat Belanja
                    </DialogTitle>
                    <DialogDescription>
                        Tautkan paket belanja atau perpanjangan garansi ke aset
                        ini.
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
                        <Field data-invalid={Boolean(errors.purchase_id)}>
                            <FieldLabel htmlFor="history-purchase">
                                Belanja
                            </FieldLabel>
                            <Controller
                                name="purchase_id"
                                control={control}
                                rules={{
                                    required: "Belanja wajib dipilih",
                                }}
                                render={({ field }) => (
                                    <Select
                                        value={
                                            field.value && field.value !== 0
                                                ? String(field.value)
                                                : ""
                                        }
                                        onValueChange={(val) =>
                                            field.onChange(Number(val))
                                        }
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger
                                            id="history-purchase"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Pilih paket belanja" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {purchases?.map((p) => (
                                                <SelectItem
                                                    key={p.id}
                                                    value={String(p.id)}
                                                >
                                                    Tahun {p.year} (
                                                    {p.type === "modal"
                                                        ? "53 Modal"
                                                        : "52 Pemeliharaan"}
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
                            {errors.purchase_id?.message && (
                                <FieldError
                                    errors={[
                                        {
                                            message: errors.purchase_id.message,
                                        },
                                    ]}
                                />
                            )}
                        </Field>

                        <Field data-invalid={Boolean(errors.name)}>
                            <FieldLabel htmlFor="history-name">
                                Nama Paket Belanja{" "}
                                <span className="text-xs font-normal text-muted-foreground">
                                    (Opsional)
                                </span>
                            </FieldLabel>
                            <Input
                                id="history-name"
                                placeholder="Contoh: Pemeliharaan Tahunan atau Pengadaan"
                                disabled={isSubmitting}
                                {...register("name")}
                            />
                        </Field>

                        <Field data-invalid={Boolean(errors.price)}>
                            <FieldLabel htmlFor="history-price">
                                Nilai Belanja / Kontrak (Rp){" "}
                                <span className="text-xs font-normal text-muted-foreground">
                                    (Opsional)
                                </span>
                            </FieldLabel>
                            <Input
                                id="history-price"
                                type="number"
                                min={0}
                                placeholder="Contoh: 4500000"
                                disabled={isSubmitting}
                                {...register("price", { valueAsNumber: true })}
                            />
                        </Field>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field data-invalid={Boolean(errors.start_date)}>
                                <FieldLabel htmlFor="history-start-date">
                                    Mulai Berlaku{" "}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        (Opsional)
                                    </span>
                                </FieldLabel>
                                <Input
                                    id="history-start-date"
                                    type="date"
                                    disabled={isSubmitting}
                                    {...register("start_date")}
                                />
                            </Field>

                            <Field data-invalid={Boolean(errors.end_date)}>
                                <FieldLabel htmlFor="history-end-date">
                                    Akhir Garansi / Masa Berlaku{" "}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        (Opsional)
                                    </span>
                                </FieldLabel>
                                <Input
                                    id="history-end-date"
                                    type="date"
                                    disabled={isSubmitting}
                                    {...register("end_date")}
                                />
                            </Field>
                        </div>

                        <Field data-invalid={Boolean(errors.notes)}>
                            <FieldLabel htmlFor="history-notes">
                                Catatan / Uraian Kontrak{" "}
                                <span className="text-xs font-normal text-muted-foreground">
                                    (Opsional)
                                </span>
                            </FieldLabel>
                            <Input
                                id="history-notes"
                                placeholder="Contoh: Perpanjangan Smartnet Cisco 2 Tahun"
                                disabled={isSubmitting}
                                {...register("notes")}
                            />
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
                        ) : (
                            "Simpan Riwayat Belanja"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
