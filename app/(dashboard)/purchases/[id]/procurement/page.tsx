import type { Metadata } from "next";
import { ProcurementForm } from "./procurement-form";

export const metadata: Metadata = {
    title: "Catat Pengadaan Aset | PPKLJ",
    description: "Pencatatan pengadaan aset baru dari paket belanja",
};

interface ProcurementPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProcurementPage({
    params,
}: ProcurementPageProps) {
    const resolvedParams = await params;
    const purchaseId = Number(resolvedParams.id);

    return <ProcurementForm purchaseId={purchaseId} />;
}
