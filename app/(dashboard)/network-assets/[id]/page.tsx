import type { Metadata } from "next";
import { NetworkAssetDetailView } from "../network-asset-detail-view";

export const metadata: Metadata = {
    title: "Detail Perangkat Jaringan | PPKLJ",
    description: "Informasi spesifikasi dan penempatan perangkat jaringan",
};

interface DetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function NetworkAssetDetailPage({
    params,
}: DetailPageProps) {
    const resolvedParams = await params;
    const assetId = Number(resolvedParams.id);

    return <NetworkAssetDetailView assetId={assetId} />;
}
