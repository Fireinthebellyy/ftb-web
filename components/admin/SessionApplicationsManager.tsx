"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toolkit } from "./types";
import { AdminDataTable } from "./AdminDataTable";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SessionApplicationsManagerProps {
  toolkit: Toolkit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SessionApplicationsManager({
  toolkit,
  open,
  onOpenChange,
}: SessionApplicationsManagerProps) {
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["admin", "session-applications", toolkit?.id],
    queryFn: async () => {
      if (!toolkit?.id) return [];
      const res = await axios.get(`/api/admin/toolkits/${toolkit.id}/applications`);
      return res.data;
    },
    enabled: open && !!toolkit?.id,
  });

  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  const columns = [
    {
      accessorKey: "userName",
      header: "Name",
    },
    {
      accessorKey: "userEmail",
      header: "Email",
    },
    {
      accessorKey: "createdAt",
      header: "Applied At",
      cell: ({ row }: any) =>
        format(new Date(row.original.createdAt), "MMM d, yyyy h:mm a"),
    },
  ];

  const handleDownloadCSV = () => {
    if (!applications.length) return;

    // Get all unique question IDs from all applications
    const questionKeys = new Set<string>();
    applications.forEach((app: any) => {
      Object.keys(app.answers || {}).forEach((key) => questionKeys.add(key));
    });

    const headers = ["Name", "Email", "Applied At", ...Array.from(questionKeys)].map(h => `"${h.replace(/"/g, '""')}"`);
    const csvContent = [
      headers.join(","),
      ...applications.map((app: any) => {
        const row = [
          `"${(app.userName || "").replace(/"/g, '""')}"`,
          `"${(app.userEmail || "").replace(/"/g, '""')}"`,
          `"${format(new Date(app.createdAt), "yyyy-MM-dd HH:mm")}"`,
          ...Array.from(questionKeys).map((key) => {
            const val = app.answers?.[key];
            let strVal = typeof val === "object" ? JSON.stringify(val) : String(val || "");
            if (/^[=+\-@]/.test(strVal)) {
              strVal = "'" + strVal;
            }
            return `"${strVal.replace(/"/g, '""')}"`;
          }),
        ];
        return row.join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `applications-${toolkit?.title}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Applications - {toolkit?.title}</DialogTitle>
          </div>
          {applications.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleDownloadCSV}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          )}
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <AdminDataTable 
              columns={columns} 
              data={applications} 
              emptyMessage="No applications found for this session." 
              onRowClick={(row) => setSelectedApp(row.original)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
      <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Answers - {selectedApp?.userName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 mt-4 max-h-[60vh] pr-4">
          <div className="space-y-6">
            {selectedApp?.answers ? (
              Object.entries(selectedApp.answers).map(([questionId, answer]) => {
                const isUrl = typeof answer === "string" && (answer.startsWith("http://") || answer.startsWith("https://"));
                return (
                  <div key={questionId} className="space-y-1">
                    <p className="font-semibold text-sm text-gray-900">{questionId}</p>
                    {isUrl ? (
                      <a href={answer as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                        {answer as string}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{String(answer)}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">No answers provided.</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
    </>
  );
}
