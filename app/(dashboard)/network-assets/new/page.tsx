import type { Metadata } from "next";
import { NetworkAssetForm } from "../network-asset-form";

export const metadata: Metadata = {
    title: "Tambah Perangkat Jaringan | PPKLJ",
    description: "Daftarkan perangkat jaringan baru ke inventaris sistem",
};

export default function NewNetworkAssetPage() {
    return <NetworkAssetForm />;
}
