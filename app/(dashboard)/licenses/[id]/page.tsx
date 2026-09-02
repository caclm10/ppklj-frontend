import type { Metadata } from "next";
import { LicenseDetailView } from "../license-detail-view";

export const metadata: Metadata = {
    title: "Detail Lisensi Software | PPKLJ",
    description: "Rincian kunci lisensi dan status masa berlaku",
};

interface DetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function LicenseDetailPage({ params }: DetailPageProps) {
    const resolvedParams = await params;
    const licenseId = Number(resolvedParams.id);

    return <LicenseDetailView licenseId={licenseId} />;
}
