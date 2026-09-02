import type { Metadata } from "next";
import { PurchaseDetailView } from "../purchase-detail-view";

export const metadata: Metadata = {
    title: "Detail Belanja | PPKLJ",
    description: "Rincian alokasi belanja dan daftar aset yang dibiayai",
};

interface DetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function PurchaseDetailPage({ params }: DetailPageProps) {
    const resolvedParams = await params;
    const purchaseId = Number(resolvedParams.id);

    return <PurchaseDetailView purchaseId={purchaseId} />;
}
