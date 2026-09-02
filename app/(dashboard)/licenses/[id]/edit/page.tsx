import type { Metadata } from "next";
import { LicenseForm } from "../../license-form";

export const metadata: Metadata = {
    title: "Edit Lisensi Software | PPKLJ",
    description: "Perbarui data lisensi software dan masa berlaku",
};

interface EditPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditLicensePage({ params }: EditPageProps) {
    const resolvedParams = await params;
    const licenseId = Number(resolvedParams.id);

    return <LicenseForm licenseId={licenseId} />;
}
