import type { Metadata } from "next";
import { LicensesClient } from "./licenses-client";

export const metadata: Metadata = {
    title: "Lisensi Software | PPKLJ",
    description:
        "Kelola data lisensi perangkat lunak, perpanjangan, dan masa berlaku",
};

export default function LicensesPage() {
    return <LicensesClient />;
}
