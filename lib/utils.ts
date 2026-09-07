import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDateIndo(dateStr?: string | null): string {
    if (!dateStr) return "-";
    try {
        const parts = dateStr.split("T")[0].split("-");
        if (parts.length === 3) {
            const [y, m, d] = parts.map(Number);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                const date = new Date(y, m - 1, d);
                return new Intl.DateTimeFormat("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                }).format(date);
            }
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(date);
    } catch {
        return dateStr;
    }
}

export function formatDateTimeIndo(dateStr?: string | null): string {
    if (!dateStr) return "-";
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    } catch {
        return dateStr;
    }
}
