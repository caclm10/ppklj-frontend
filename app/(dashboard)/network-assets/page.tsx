import type { Metadata } from "next";
import { NetworkAssetsClient } from "./network-assets-client";

export const metadata: Metadata = {
    title: "Perangkat Jaringan | PPKLJ",
    description:
        "Kelola data inventaris perangkat jaringan Switch, Router, AP, dan Firewall",
};

export default function NetworkAssetsPage() {
    return <NetworkAssetsClient />;
}
