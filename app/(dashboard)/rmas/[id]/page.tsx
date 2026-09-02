import type { Metadata } from "next";
import { RmaDetailView } from "../rma-detail-view";

export const metadata: Metadata = {
    title: "Detail & Tracking RMA | PPKLJ",
    description: "Kronologi pelacakan pengiriman dan penanganan servis aset",
};

interface RmaDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function RmaDetailPage({ params }: RmaDetailPageProps) {
    const resolvedParams = await params;
    const rmaId = Number(resolvedParams.id);

    return <RmaDetailView rmaId={rmaId} />;
}
