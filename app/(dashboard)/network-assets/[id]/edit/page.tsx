import type { Metadata } from "next";
import { NetworkAssetForm } from "../../network-asset-form";

export const metadata: Metadata = {
    title: "Edit Perangkat Jaringan | PPKLJ",
    description:
        "Perbarui informasi spesifikasi dan penempatan perangkat jaringan",
};

interface EditPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditNetworkAssetPage({ params }: EditPageProps) {
    const resolvedParams = await params;
    const assetId = Number(resolvedParams.id);

    return <NetworkAssetForm assetId={assetId} />;
}
