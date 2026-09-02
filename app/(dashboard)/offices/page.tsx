import type { Metadata } from "next";
import { OfficesClient } from "./offices-client";

export const metadata: Metadata = {
    title: "Lokasi Kantor | PPKLJ",
    description: "Kelola data lokasi penempatan dan kantor operasional",
};

export default function OfficesPage() {
    return <OfficesClient />;
}
