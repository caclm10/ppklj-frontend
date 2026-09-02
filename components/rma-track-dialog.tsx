"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { Loader2, AlertCircle, PlusCircle, CheckCircle2 } from "lucide-react";

import type { AddAssetRmaTrackPayload, RmaStatus } from "@/lib/types";
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

interface RmaTrackDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rmaId: number;
    currentStatus?: RmaStatus;
    onSuccess: () => void;
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

export function RmaTrackDialog({
    open,
    onOpenChange,
    rmaId,
    currentStatus,
    onSuccess,
}: RmaTrackDialogProps) {
    const formId = React.useId();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [serverError, setServerError] = React.useState<string | null>(null);

    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<AddAssetRmaTrackPayload>({
        values: {
            status: currentStatus ?? "pengiriman_ke_pusat",
            notes: "",
            tracked_at: new Date().toISOString().slice(0, 16),
            resolution: null,
            new_serial_number: "",
        },
    });

    const selectedStatus = watch("status");
    const selectedResolution = watch("resolution");
    const isCompleted = selectedStatus === "selesai_dipasang";

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setServerError(null);
            clearErrors();
            reset();
        }
        onOpenChange(newOpen);
    };

    async function onSubmit(data: AddAssetRmaTrackPayload) {
        setServerError(null);
        clearErrors();

        if (data.status === "selesai_dipasang" && !data.resolution) {
            setError("resolution", {
                type: "manual",
                message:
                    "Hasil penyelesaian (resolusi) wajib dipilih jika status selesai",
            });
            return;
        }

        if (
            data.status === "selesai_dipasang" &&
            data.resolution === "diganti_unit" &&
            !data.new_serial_number?.trim()
        ) {
            setError("new_serial_number", {
                type: "manual",
                message: "Nomor seri baru wajib diisi untuk penggantian unit",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await mutationFetcher(`/api/asset-rmas/${rmaId}/tracks`, "POST", {
                status: data.status,
                notes: data.notes?.trim() || null,
                tracked_at: data.tracked_at || null,
                resolution:
                    data.status === "selesai_dipasang" ? data.resolution : null,
                new_serial_number:
                    data.status === "selesai_dipasang" &&
                    data.resolution === "diganti_unit"
                        ? data.new_serial_number?.trim()
                        : null,
            });

            onSuccess();
            handleOpenChange(false);
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                if (err.status === 422 && err.errors) {
                    if (err.errors.status?.[0]) {
                        setError("status", {
                            type: "server",
                            message: err.errors.status[0],
                        });
                    }
                    if (err.errors.resolution?.[0]) {
                        setError("resolution", {
                            type: "server",
                            message: err.errors.resolution[0],
                        });
                    }
                    if (err.errors.new_serial_number?.[0]) {
                        setError("new_serial_number", {
                            type: "server",
                            message: err.errors.new_serial_number[0],
                        });
                    }
                    setServerError(
                        err.message || "Validasi pembaruan status RMA gagal."
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
                        Perbarui Status Perjalanan RMA
                    </DialogTitle>
                    <DialogDescription>
                        Catat milestone pengiriman, status di vendor, atau
                        penyelesaian servis unit.
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
                        <Field data-invalid={Boolean(errors.status)}>
                            <FieldLabel htmlFor="track-status">
                                Tahapan Status Baru
                            </FieldLabel>
                            <Controller
                                name="status"
                                control={control}
                                rules={{ required: "Status wajib dipilih" }}
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger
                                            id="track-status"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Pilih tahapan status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.status?.message && (
                                <FieldError
                                    errors={[
                                        { message: errors.status.message },
                                    ]}
                                />
                            )}
                        </Field>

                        <Field data-invalid={Boolean(errors.tracked_at)}>
                            <FieldLabel htmlFor="track-date">
                                Tanggal &amp; Waktu Kejadian
                            </FieldLabel>
                            <Input
                                id="track-date"
                                type="datetime-local"
                                disabled={isSubmitting}
                                {...register("tracked_at")}
                            />
                        </Field>

                        <Field data-invalid={Boolean(errors.notes)}>
                            <FieldLabel htmlFor="track-notes">
                                Catatan / Resi Ekspedisi{" "}
                                <span className="text-xs font-normal text-muted-foreground">
                                    (Opsional)
                                </span>
                            </FieldLabel>
                            <Input
                                id="track-notes"
                                placeholder="Contoh: Dikirim via JNE Cargo Resi: 123456789"
                                disabled={isSubmitting}
                                {...register("notes")}
                            />
                        </Field>

                        {/* Additional fields if status is selesai_dipasang */}
                        {isCompleted && (
                            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                    <CheckCircle2 className="size-4" />
                                    Penyelesaian &amp; Hasil Servis Unit
                                </div>

                                <Field
                                    data-invalid={Boolean(errors.resolution)}
                                >
                                    <FieldLabel htmlFor="track-resolution">
                                        Hasil Servis (Resolusi)
                                    </FieldLabel>
                                    <Controller
                                        name="resolution"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value || undefined}
                                                onValueChange={field.onChange}
                                                disabled={isSubmitting}
                                            >
                                                <SelectTrigger
                                                    id="track-resolution"
                                                    className="w-full bg-background"
                                                >
                                                    <SelectValue placeholder="Pilih hasil penyelesaian" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="diperbaiki">
                                                        Diperbaiki (Nomor Seri
                                                        Tetap Sama)
                                                    </SelectItem>
                                                    <SelectItem value="diganti_unit">
                                                        Diganti Unit Baru (Nomor
                                                        Seri Berubah)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.resolution?.message && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message:
                                                        errors.resolution
                                                            .message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>

                                {selectedResolution === "diganti_unit" && (
                                    <Field
                                        data-invalid={Boolean(
                                            errors.new_serial_number
                                        )}
                                    >
                                        <FieldLabel htmlFor="new-serial-number">
                                            Nomor Seri (SN) Unit Baru Pengganti
                                        </FieldLabel>
                                        <Input
                                            id="new-serial-number"
                                            placeholder="Contoh: WS-C2960X-48FPS-L-NEW-SN999"
                                            disabled={isSubmitting}
                                            className="bg-background font-mono"
                                            {...register("new_serial_number")}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Nomor seri pada master aset
                                            perangkat akan otomatis diperbarui.
                                        </p>
                                        {errors.new_serial_number?.message && (
                                            <FieldError
                                                errors={[
                                                    {
                                                        message:
                                                            errors
                                                                .new_serial_number
                                                                .message,
                                                    },
                                                ]}
                                            />
                                        )}
                                    </Field>
                                )}
                            </div>
                        )}
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
                            "Simpan Milestone Status"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
