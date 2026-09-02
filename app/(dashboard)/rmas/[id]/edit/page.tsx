import type { Metadata } from "next";
import { RmaForm } from "../../rma-form";

export const metadata: Metadata = {
    title: "Edit Tiket RMA | PPKLJ",
    description: "Perbarui data kontak dan rincian tiket servis",
};

interface EditRmaPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditRmaPage({ params }: EditRmaPageProps) {
    const resolvedParams = await params;
    const rmaId = Number(resolvedParams.id);

    return <RmaForm rmaId={rmaId} />;
}
