import type { Metadata } from "next";
import { LicenseForm } from "../license-form";

export const metadata: Metadata = {
    title: "Tambah Lisensi Software | PPKLJ",
    description: "Daftarkan lisensi software baru ke inventaris sistem",
};

export default function NewLicensePage() {
    return <LicenseForm />;
}
