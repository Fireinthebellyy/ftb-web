"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Opportunity {
  id: string;
  title: string;
  user?: {
    name: string;
  };
}

export default function OpportunityManagementTable() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-opportunities-management"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/opportunities");
      return res.data.opportunities;
    },
  });

  const deleteOpportunity = async (id: string) => {
    try {
      await axios.delete(`/api/admin/opportunities/${id}`);

      toast.success("Opportunity deleted");

      queryClient.invalidateQueries({
        queryKey: ["admin-opportunities-management"],
      });
    } catch {
      toast.error("Failed to delete opportunity");
    }
  };

  if (isLoading) {
    return <p>Loading opportunities...</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Opportunity Management</h2>

      <table className="w-full border rounded-lg">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Title</th>
            <th className="p-2 text-left">Posted By</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {data?.map((op: Opportunity) => (
            <tr key={op.id} className="border-b">
              <td className="p-2">{op.id}</td>
              <td className="p-2">{op.title}</td>
              <td className="p-2">{op.user?.name}</td>

              <td className="p-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    (window.location.href = `/admin/opportunities/edit/${op.id}`)
                  }
                >
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteOpportunity(op.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}