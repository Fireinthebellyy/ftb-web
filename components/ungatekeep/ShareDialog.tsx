import Link from "next/link";
import { Copy, Facebook, Linkedin, Mail, Twitter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import posthog from "posthog-js";

interface ShareDialogProps {
  shareUrl: string;
  title: string;
  onCopy: () => void;
  postId?: string;
}

export function ShareDialog({ shareUrl, title, onCopy, postId }: ShareDialogProps) {
  const utmParams = `${shareUrl}${shareUrl.includes("?") ? "&" : "?"}utm_source=ftb_web&utm_medium=ungatekeep_card&utm_campaign=ungatekeep_share`;

  const trackShare = (method: string) => {
    posthog.capture("ungatekeep_post_shared", {
      post_id: postId || "",
      post_title: title,
      share_method: method,
    });
  };

  return (
    <>
      <DialogHeader className="px-4 sm:px-6">
        <DialogTitle className="text-base sm:text-lg">
          Share this post
        </DialogTitle>
      </DialogHeader>
      <Input readOnly value={shareUrl} className="w-full px-3 py-2 text-sm" />
      <div className="mt-3 flex flex-wrap gap-2 px-4 sm:px-0">
        <button
          type="button"
          onClick={onCopy}
          title="Copy to clipboard"
          aria-label="Copy link"
          className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 sm:p-3"
        >
          <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <Link
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(utmParams)}&text=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Share to Twitter/X"
          aria-label="Share on Twitter/X"
          className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 sm:p-3"
          onClick={() => trackShare("twitter")}
        >
          <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
        </Link>
        <Link
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(utmParams)}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Share to Facebook"
          aria-label="Share on Facebook"
          className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 sm:p-3"
          onClick={() => trackShare("facebook")}
        >
          <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
        </Link>
        <Link
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(utmParams)}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Share to LinkedIn"
          aria-label="Share on LinkedIn"
          className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 sm:p-3"
          onClick={() => trackShare("linkedin")}
        >
          <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
        </Link>
        <Link
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + utmParams)}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Share to WhatsApp"
          aria-label="Share on WhatsApp"
          className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 sm:p-3"
          onClick={() => trackShare("whatsapp")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 sm:h-5 sm:w-5"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
            <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
          </svg>
        </Link>
        <Link
          href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(utmParams)}`}
          title="Share via Email"
          aria-label="Share via Email"
          className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 sm:p-3"
          onClick={() => trackShare("email")}
        >
          <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
        </Link>
      </div>
    </>
  );
}
