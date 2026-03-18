"use client";

import { FileText, Download } from "lucide-react";
import { tryGetStoragePublicUrl } from "@/lib/storage/public-url";

interface OpportunityAttachmentsProps {
  attachments?: string[];
}

export function OpportunityAttachments({
  attachments,
}: OpportunityAttachmentsProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-3 pb-2 sm:px-4">
      {attachments.map((fileId) => {
        const viewUrl = tryGetStoragePublicUrl(
          "opportunity-attachments",
          fileId
        );
        return (
          <a
            key={fileId}
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-red-500" />
            <span className="max-w-[120px] truncate">Attachment</span>
            <Download className="h-3 w-3 shrink-0 text-gray-400" />
          </a>
        );
      })}
    </div>
  );
}
