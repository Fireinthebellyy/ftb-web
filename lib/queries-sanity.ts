import sanityClient from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";

export type PageBannerPlacement = "internship" | "ungatekeep";

export type PageBanner = {
  _id: string;
  placement: PageBannerPlacement;
  isActive?: boolean;
  image?: {
    alt?: string;
    asset?: {
      url: string;
    };
  };
};

const privacyPolicyQuery = `*[_type == "privacy"][0]{
    title,
    content,
    lastUpdated
}`;

const termsOfServiceQuery = `*[_type == "terms"][0]{
    title,
    content,
    lastUpdated
}`;

const featuredQuery = `*[_type == "featured"] | order(priority, _createdAt desc) {
    _id,
    title,
    type,
    url,
    description,
    priority,
    thumbnail{
      _type,
      alt,
      asset->{
        _ref,
        _type,
        url
      }
    }
}`;

const pageBannersByPlacementQuery = `*[_type == "pageBanner" && coalesce(isActive, true) == true && placement == $placement] | order(_createdAt desc) {
  _id,
  placement,
  isActive,
  image {
    alt,
    asset->{
      url
    }
  }
}`;

export async function getPrivacyPolicy() {
  try {
    const privacyPolicy = await sanityClient.fetch(privacyPolicyQuery);
    return privacyPolicy;
  } catch (error) {
    console.error("Sanity query error:", error);
    return null;
  }
}

export async function getTermsOfService() {
  try {
    const termsOfService = await sanityClient.fetch(termsOfServiceQuery);
    return termsOfService;
  } catch (error) {
    console.error("Sanity query error:", error);
    return null;
  }
}

export async function getFeatured() {
  try {
    const featuredItems = await sanityClient.fetch(featuredQuery);
    return featuredItems;
  } catch (error) {
    console.error("Sanity query error:", error);
    return [];
  }
}

export async function getPageBannersByPlacement(
  placement: PageBannerPlacement
): Promise<PageBanner[]> {
  try {
    const banners = await sanityClient.fetch<PageBanner[]>(
      pageBannersByPlacementQuery,
      {
        placement,
      }
    );
    return banners;
  } catch (error) {
    console.error("Sanity query error:", error);
    return [];
  }
}

export function useFeatured(limit?: number) {
  return useQuery({
    queryKey: ["featured", limit],
    queryFn: () =>
      limit
        ? getFeatured().then((items) => items.slice(0, limit))
        : getFeatured(),
    staleTime: 1000 * 60 * 15,
  });
}

export function usePageBanners(placement: PageBannerPlacement) {
  return useQuery({
    queryKey: ["page-banners", placement],
    queryFn: () => getPageBannersByPlacement(placement),
    staleTime: 1000 * 60 * 15,
  });
}
