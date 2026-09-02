export interface ApiResponse<T = unknown> {
    success: boolean;
    status: number;
    message?: string;
    data?: T;
}

export interface ApiValidationError {
    success: false;
    status: 422;
    message: string;
    data?: Record<string, string[]>;
}

export interface User {
    id: number;
    name: string;
    username: string;
    created_at?: string;
    updated_at?: string;
}

export interface LoginPayload {
    username: string;
    password: string;
    remember?: boolean;
}

export interface LoginResponseData {
    user: User;
}

export type OfficeType = "vertikal" | "pusat";

export interface Office {
    id: number;
    type: OfficeType;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface OfficePayload {
    type: OfficeType;
    name: string;
}

export type PurchaseType = "modal" | "pemeliharaan";

export interface Purchase {
    id: number;
    type: PurchaseType;
    year: number;
    description?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface PurchasePayload {
    type: PurchaseType;
    year: number;
    description?: string | null;
}

export interface Feature {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface FeaturePayload {
    name: string;
}

export type NetworkAssetStatus = "belum_dipasang" | "aktif" | "tidak_aktif";

export interface AssetPurchaseHistory {
    id: number;
    asset_id: number;
    purchase_id: number;
    price?: number | null;
    quantity?: number;
    start_date?: string | null;
    end_date?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
    purchase?: Purchase;
    asset?: Asset;
}

export interface AssetPurchasePayload {
    asset_id: number;
    purchase_id: number;
    price?: number | null;
    quantity?: number;
    start_date?: string | null;
    end_date?: string | null;
    notes?: string | null;
}

export interface Asset {
    id: number;
    category: "jaringan" | "license";
    name: string;
    number: string;
    unit_price?: number | null;
    end_date?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
    purchases?: AssetPurchaseHistory[];
    network_asset?: NetworkAsset;
}

export interface NetworkAsset {
    id: number;
    asset_id: number;
    office_id?: number | null;
    status: NetworkAssetStatus;
    brand: string;
    model: string;
    type: string;
    ip?: string | null;
    hostname?: string | null;
    created_at?: string;
    updated_at?: string;
    asset?: Asset;
    office?: Office | null;
    features?: Feature[];
}

export interface NetworkAssetPayload {
    // Parent asset fields
    serial_number: string;
    device_name?: string;
    unit_price?: number | null;
    end_date?: string | null;
    purchase_id?: number | null;

    // Network asset fields
    office_id?: number | null;
    status: NetworkAssetStatus;
    brand: string;
    model: string;
    type: string;
    ip?: string | null;
    hostname?: string | null;
    features?: string[];
}

export interface LicensePayload {
    name: string;
    number: string;
    unit_price?: number | null;
    end_date?: string | null;
    notes?: string | null;
    purchase_id?: number | null;
}

export type RmaStatus =
    | "rusak_di_kantor"
    | "pengiriman_ke_pusat"
    | "diterima_di_pusat"
    | "pengiriman_ke_vendor"
    | "diproses_vendor"
    | "diterima_dari_vendor"
    | "pengiriman_ke_kantor"
    | "selesai_dipasang";

export type RmaResolution = "diperbaiki" | "diganti_unit";

export interface AssetRmaTrack {
    id: number;
    asset_rma_id: number;
    status: RmaStatus;
    notes?: string | null;
    tracked_at: string;
    created_at?: string;
    updated_at?: string;
}

export interface AssetRma {
    id: number;
    asset_id: number;
    user_id?: number | null;
    pic_name: string;
    pic_phone?: string | null;
    rma_number?: string | null;
    vendor_name?: string | null;
    current_status: RmaStatus;
    resolution?: RmaResolution | null;
    old_serial_number?: string | null;
    new_serial_number?: string | null;
    problem_description?: string | null;
    completed_at?: string | null;
    created_at?: string;
    updated_at?: string;
    asset?: Asset;
    user?: User | null;
    tracks?: AssetRmaTrack[];
}

export interface CreateAssetRmaPayload {
    asset_id: number;
    pic_name: string;
    pic_phone?: string | null;
    rma_number?: string | null;
    vendor_name?: string | null;
    current_status?: RmaStatus;
    problem_description?: string | null;
    notes?: string | null;
}

export interface AddAssetRmaTrackPayload {
    status: RmaStatus;
    notes?: string | null;
    tracked_at?: string | null;
    resolution?: RmaResolution | null;
    new_serial_number?: string | null;
}
