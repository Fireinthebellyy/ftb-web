"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const opportunityTypes = [
  "hackathon",
  "grant application",
  "competition",
  "ideathon",
];

interface FormState {
  type: string[];
  title: string;
  description: string;
  url: string;
  image: string;
  tags: string;
  location: string;
  organiserInfo: string;
  startDate: string;
  endDate: string;
}

export default function ClientNewOpportunityForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    type: [],
    title: "",
    description: "",
    url: "",
    image: "",
    tags: "",
    location: "",
    organiserInfo: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleTypeChange(type: string) {
    setForm((prev) => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter((t) => t !== type)
        : [...prev.type, type],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Failed to create opportunity");
      router.push("/opportunities");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <h2 className="text-2xl font-bold mb-2">Create New Opportunity</h2>
          <div>
            <label className="block font-medium mb-1">Type</label>
            <div className="flex flex-wrap gap-2">
              {opportunityTypes.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={form.type.includes(type) ? "default" : "outline"}
                  onClick={() => handleTypeChange(type)}
                  size="sm"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Title</label>
            <Input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">URL</label>
            <Input
              name="url"
              value={form.url}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Image URL</label>
            <Input name="image" value={form.image} onChange={handleChange} />
          </div>
          <div>
            <label className="block font-medium mb-1">
              Tags (comma separated)
            </label>
            <Input name="tags" value={form.tags} onChange={handleChange} />
          </div>
          <div>
            <label className="block font-medium mb-1">Location</label>
            <Input
              name="location"
              value={form.location}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Organiser Info</label>
            <Input
              name="organiserInfo"
              value={form.organiserInfo}
              onChange={handleChange}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-medium mb-1">Start Date</label>
              <Input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
              />
            </div>
            <div className="flex-1">
              <label className="block font-medium mb-1">End Date</label>
              <Input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
              />
            </div>
          </div>
          {error && <div className="text-red-600">{error}</div>}
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Opportunity"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
