import type { Metadata } from "next";
import { FeaturesClient } from "./features-client";

export const metadata: Metadata = {
    title: "Master Fitur | PPKLJ",
    description: "Kelola master tag fitur teknis perangkat jaringan",
};

export default function FeaturesPage() {
    return <FeaturesClient />;
}
