import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
    title: "Login | PPKLJ",
    description: "Masuk ke Sistem Pengelolaan Perangkat Jaringan & Lisensi",
};

export default function LoginPage() {
    return (
        <main className="flex min-h-svh w-full items-center justify-center bg-muted/20 p-4 md:p-8">
            <LoginForm />
        </main>
    );
}
