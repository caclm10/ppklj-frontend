import type { Metadata } from "next";
import { RmasClient } from "./rmas-client";

export const metadata: Metadata = {
    title: "Tracking RMA & Servis | PPKLJ",
    description:
        "Pelacakan alur pengiriman perbaikan perangkat dan klaim garansi servis",
};

export default function RmasPage() {
    return <RmasClient />;
}
