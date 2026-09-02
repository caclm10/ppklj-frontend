import type { Metadata } from "next";
import { RmaForm } from "../rma-form";

export const metadata: Metadata = {
    title: "Buka Tiket RMA Baru | PPKLJ",
    description:
        "Pelaporan kerusakan perangkat dan pembuatan tiket tracking servis",
};

interface NewRmaPageProps {
    searchParams: Promise<{ asset_id?: string }>;
}

export default async function NewRmaPage({ searchParams }: NewRmaPageProps) {
    const resolvedParams = await searchParams;
    const defaultAssetId = resolvedParams.asset_id
        ? Number(resolvedParams.asset_id)
        : undefined;

    return <RmaForm defaultAssetId={defaultAssetId} />;
}
