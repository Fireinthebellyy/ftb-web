import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export type Banner = {
    id: string;
    title: string;
    subtitle?: string;
    background?: string;
    imageUrl?: string;
    link?: string;
    priority: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

async function fetchBanners(): Promise<Banner[]> {
    const { data } = await axios.get<Banner[]>("/api/banners");
    return data;
}

export const useBanners = () => {
    return useQuery({
        queryKey: ["banners"],
        queryFn: fetchBanners,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
