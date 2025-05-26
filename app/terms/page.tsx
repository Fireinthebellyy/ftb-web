import { getTermsOfService } from "@/lib/queries";

type TermsType = {
  title: string;
  content: string;
  lastUpdated: string;
};

export default async function TermsPage() {
  const terms: TermsType | null = await getTermsOfService();

  if (!terms) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8 my-8 bg-white">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p>Terms of service information is currently unavailable.</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8 my-8 bg-white ">
      <h1 className="text-3xl font-bold mb-4">{terms.title}</h1>
      <div className="prose mb-6 whitespace-pre-line ">{terms.content}</div>
      <div className="text-sm text-gray-500">
        Last updated:{" "}
        {terms.lastUpdated
          ? new Date(terms.lastUpdated).toLocaleDateString()
          : "N/A"}
      </div>
    </main>
  );
}
