import type { Metadata } from "next";
import { NetworkAssetsClient } from "./network-assets-client";

export const metadata: Metadata = {
    title: "Perangkat Jaringan | PPKLJ",
    description:
        "Kelola data inventaris perangkat jaringan Access Point, Switch, dan Controller",
};

export default function NetworkAssetsPage() {
    return <NetworkAssetsClient />;
}
