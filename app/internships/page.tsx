import { Briefcase } from "lucide-react";

export default function InternshipsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Briefcase className="mb-4 h-16 w-16 text-neutral-300" />
        <h1 className="mb-2 text-2xl font-bold text-neutral-800">
          Internships
        </h1>
        <p className="text-neutral-500">
          Coming soon! Browse opportunities in the meantime.
        </p>
      </div>
    </div>
  );
}
