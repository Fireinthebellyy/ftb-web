import { getPrivacyPolicy } from "@/lib/queries";

type PrivacyPolicy = {
  title: string;
  content: string;
  lastUpdated: string;
};

export default async function PrivacyPage() {
  const privacy: PrivacyPolicy | null = await getPrivacyPolicy();

  if (!privacy) {
    return (
      <main className="max-w-2xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p>Privacy policy information is currently unavailable.</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-4">{privacy.title}</h1>
      <div className="prose mb-6 whitespace-pre-line">{privacy.content}</div>
      <div className="text-sm text-gray-500">
        Last updated:{" "}
        {privacy.lastUpdated
          ? new Date(privacy.lastUpdated).toLocaleDateString()
          : "N/A"}
      </div>
    </main>
  );
}
