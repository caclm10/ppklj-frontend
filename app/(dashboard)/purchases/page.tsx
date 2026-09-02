import type { Metadata } from "next";
import { PurchasesClient } from "./purchases-client";

export const metadata: Metadata = {
    title: "Belanja | PPKLJ",
    description:
        "Kelola data anggaran belanja modal (53) dan pemeliharaan (52)",
};

export default function PurchasesPage() {
    return <PurchasesClient />;
}
