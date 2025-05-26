import sanityClient from "@/lib/sanity";

export const privacyPolicyQuery = `*[_type == "privacy"][0]{
    title,
    content,
    lastUpdated
}`;

export const getPrivacyPolicy = async () => {
  try {
    const privacyPolicy = await sanityClient.fetch(privacyPolicyQuery);
    return privacyPolicy;
  } catch (error) {
    console.error("Sanity query error:", error);
    return null;
  }
};
