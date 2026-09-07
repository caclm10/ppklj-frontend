import type { Metadata } from "next";
import { MaintenanceForm } from "./maintenance-form";

export const metadata: Metadata = {
    title: "Catat Pemeliharaan Aset | PPKLJ",
    description: "Pencatatan pemeliharaan dan perpanjangan garansi aset dari pos belanja",
};

interface MaintenancePageProps {
    params: Promise<{ id: string }>;
}

export default async function MaintenancePage({
    params,
}: MaintenancePageProps) {
    const resolvedParams = await params;
    const purchaseId = Number(resolvedParams.id);

    return <MaintenanceForm purchaseId={purchaseId} />;
}
