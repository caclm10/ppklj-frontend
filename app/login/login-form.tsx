"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface LoginFormValues {
    username: string;
    password: string;
    remember: boolean;
}

export function LoginForm() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading } = useAuth();
    const formId = React.useId();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [systemError, setSystemError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace("/");
        }
    }, [isLoading, isAuthenticated, router]);

    const {
        register,
        handleSubmit,
        control,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<LoginFormValues>({
        defaultValues: {
            username: "",
            password: "",
            remember: false,
        },
    });

    if (isLoading || isAuthenticated) {
        return (
            <Card className="w-full max-w-md border-border/60 shadow-lg">
                <CardHeader className="gap-2 pb-2 text-center">
                    <Skeleton className="mx-auto size-12 rounded-xl" />
                    <Skeleton className="mx-auto mt-1 h-6 w-40 rounded-md" />
                    <Skeleton className="mx-auto h-4 w-64 rounded-md" />
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pt-4">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-8 w-full rounded-lg" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-8 w-full rounded-lg" />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                        <Skeleton className="size-4 rounded" />
                        <Skeleton className="h-4 w-44" />
                    </div>
                </CardContent>
                <CardFooter className="pt-2">
                    <Skeleton className="h-10 w-full rounded-lg" />
                </CardFooter>
            </Card>
        );
    }

    async function onSubmit(data: LoginFormValues) {
        setSystemError(null);
        clearErrors();
        setIsSubmitting(true);

        try {
            const response = await login({
                username: data.username.trim(),
                password: data.password,
                remember: data.remember,
            });

            if (response.success) {
                router.push("/");
                router.refresh();
            }
        } catch (err: unknown) {
            if (err instanceof ApiError) {
                const hasFieldErrors =
                    err.status === 422 &&
                    err.errors &&
                    Object.keys(err.errors).length > 0;

                if (hasFieldErrors) {
                    if (err.errors?.username?.[0]) {
                        setError("username", {
                            type: "server",
                            message: err.errors.username[0],
                        });
                    }
                    if (err.errors?.password?.[0]) {
                        setError("password", {
                            type: "server",
                            message: err.errors.password[0],
                        });
                    }
                    if (!err.errors?.username && !err.errors?.password) {
                        setSystemError(err.message || "Validasi data gagal.");
                    }
                } else {
                    setSystemError(
                        err.message ||
                            "Terjadi kendala pada server. Silakan coba kembali."
                    );
                }
            } else if (err instanceof Error) {
                setSystemError(
                    err.message || "Tidak dapat terhubung ke server."
                );
            } else {
                setSystemError("Terjadi kesalahan sistem yang tidak terduga.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="w-full max-w-md border-border/60 shadow-lg">
            <CardHeader className="gap-2 pb-2 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="size-6" />
                </div>
                <CardTitle className="text-xl font-semibold tracking-tight">
                    Masuk ke PPKLJ
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                    Sistem Pengelolaan Perangkat Jaringan &amp; Lisensi
                </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
                <form
                    id={formId}
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-4"
                >
                    {systemError && (
                        <Alert variant="destructive">
                            <AlertCircle data-icon="inline-start" />
                            <AlertTitle>Kesalahan Sistem</AlertTitle>
                            <AlertDescription>{systemError}</AlertDescription>
                        </Alert>
                    )}

                    <FieldGroup>
                        <Field data-invalid={Boolean(errors.username)}>
                            <FieldLabel htmlFor="username">Username</FieldLabel>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Masukkan username"
                                autoComplete="username"
                                disabled={isSubmitting}
                                aria-invalid={Boolean(errors.username)}
                                {...register("username", {
                                    required: "Username wajib diisi",
                                })}
                            />
                            {errors.username?.message && (
                                <FieldError
                                    errors={[
                                        { message: errors.username.message },
                                    ]}
                                />
                            )}
                        </Field>

                        <Field data-invalid={Boolean(errors.password)}>
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Masukkan kata sandi"
                                    autoComplete="current-password"
                                    disabled={isSubmitting}
                                    aria-invalid={Boolean(errors.password)}
                                    className="pr-10"
                                    {...register("password", {
                                        required: "Password wajib diisi",
                                    })}
                                />
                                <button
                                    type="button"
                                    aria-label={
                                        showPassword
                                            ? "Sembunyikan sandi"
                                            : "Tampilkan sandi"
                                    }
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none"
                                    disabled={isSubmitting}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password?.message && (
                                <FieldError
                                    errors={[
                                        { message: errors.password.message },
                                    ]}
                                />
                            )}
                        </Field>

                        <Field orientation="horizontal" className="pt-1">
                            <Controller
                                name="remember"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        id="remember"
                                        checked={field.value}
                                        disabled={isSubmitting}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <FieldLabel
                                htmlFor="remember"
                                className="cursor-pointer text-sm font-normal text-muted-foreground select-none"
                            >
                                Ingat saya di perangkat ini
                            </FieldLabel>
                        </Field>
                    </FieldGroup>
                </form>
            </CardContent>

            <CardFooter className="pt-2">
                <Button
                    form={formId}
                    type="submit"
                    className="h-10 w-full text-sm font-medium"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2
                                data-icon="inline-start"
                                className="animate-spin"
                            />
                            Memverifikasi...
                        </>
                    ) : (
                        "Masuk"
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
