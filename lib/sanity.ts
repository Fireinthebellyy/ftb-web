import { createClient } from "@sanity/client";

const sanityClient = createClient({
  projectId: "1di16bg2",
  dataset: "production",
  apiVersion: "2023-01-01", // Use a fixed date for API versioning
  useCdn: true, // Use CDN for faster, cacheable responses (suitable for public data)
});

export default sanityClient;
