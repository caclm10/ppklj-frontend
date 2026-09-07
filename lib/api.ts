import type { ApiResponse, LoginPayload, LoginResponseData } from "./types";

export function getApiBaseUrl(): string {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== "undefined") {
        return `http://${window.location.hostname}:8000`;
    }
    return "http://localhost:8000";
}

export const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
    status: number;
    errors?: Record<string, string[]>;

    constructor(
        message: string,
        status: number,
        errors?: Record<string, string[]>
    ) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.errors = errors;
    }
}

export function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(
        new RegExp(`(^|;\\s*)(${name})=([^;]*)`)
    );
    return match ? decodeURIComponent(match[3]) : null;
}

export async function getCsrfCookie(): Promise<void> {
    const baseUrl = getApiBaseUrl();
    await fetch(`${baseUrl}/sanctum/csrf-cookie`, {
        headers: {
            Accept: "application/json",
        },
        credentials: "include",
    });
}

export async function fetcher<T = unknown>(url: string): Promise<T> {
    const baseUrl = getApiBaseUrl();
    const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
    const response = await fetch(fullUrl, {
        headers: {
            Accept: "application/json",
        },
        credentials: "include",
    });

    const payload = await response.json();

    if (!response.ok || !payload.success) {
        throw new ApiError(
            payload.message || "Request failed",
            response.status,
            payload.data
        );
    }

    return (payload.data !== undefined ? payload.data : payload) as T;
}

export async function mutationFetcher<T = unknown>(
    url: string,
    method: "POST" | "PUT" | "PATCH" | "DELETE",
    body?: unknown
): Promise<T> {
    const xsrfToken = getCookie("XSRF-TOKEN");
    const headers: Record<string, string> = {
        Accept: "application/json",
    };
    if (xsrfToken) {
        headers["X-XSRF-TOKEN"] = xsrfToken;
    }
    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    const baseUrl = getApiBaseUrl();
    const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
    const response = await fetch(fullUrl, {
        method,
        headers,
        credentials: "include",
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload.success) {
        const errorData =
            payload.status === 422 && typeof payload.data === "object"
                ? (payload.data as Record<string, string[]>)
                : undefined;

        throw new ApiError(
            payload.message || "Operasi gagal",
            response.status,
            errorData
        );
    }

    return (payload.data !== undefined ? payload.data : payload) as T;
}

export async function loginFetcher(
    url: string,
    { arg }: { arg: LoginPayload }
): Promise<ApiResponse<LoginResponseData>> {
    // 1. Inisialisasi CSRF Cookie terlebih dahulu (Laravel Sanctum)
    await getCsrfCookie();

    const xsrfToken = getCookie("XSRF-TOKEN");
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
    };
    if (xsrfToken) {
        headers["X-XSRF-TOKEN"] = xsrfToken;
    }

    const baseUrl = getApiBaseUrl();
    const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
    const response = await fetch(fullUrl, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(arg),
    });

    const payload =
        (await response.json()) as ApiResponse<LoginResponseData> & {
            data?: LoginResponseData | Record<string, string[]>;
        };

    if (!response.ok || !payload.success) {
        const errorData =
            payload.status === 422 && typeof payload.data === "object"
                ? (payload.data as Record<string, string[]>)
                : undefined;

        throw new ApiError(
            payload.message || "Terjadi kesalahan saat login",
            response.status,
            errorData
        );
    }

    return payload as ApiResponse<LoginResponseData>;
}

export async function logoutFetcher(
    url: string = "/api/logout"
): Promise<ApiResponse<null>> {
    const xsrfToken = getCookie("XSRF-TOKEN");
    const headers: Record<string, string> = {
        Accept: "application/json",
    };
    if (xsrfToken) {
        headers["X-XSRF-TOKEN"] = xsrfToken;
    }

    const baseUrl = getApiBaseUrl();
    const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
    const response = await fetch(fullUrl, {
        method: "POST",
        headers,
        credentials: "include",
    });

    const payload = await response.json();

    if (!response.ok || !payload.success) {
        throw new ApiError(payload.message || "Gagal logout", response.status);
    }

    return payload;
}
