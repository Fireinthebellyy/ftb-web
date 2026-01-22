"use client";

import { useState } from "react";

export default function WhatsAppWidget() {
  const [open, setOpen] = useState(false);

  const options = [
    "Appreciate the team",
    "Report a problem",
    "Share an idea",
    "Other inquiries",
  ];

  return (
    <>
      {/* WhatsApp Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-[72px] z-50 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 shadow-md hover:bg-neutral-200 md:bottom-6 md:h-12 md:w-12"
        aria-label="Chat on WhatsApp"
>

        <svg

        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="h-6 w-6 md:h-7 md:w-7"
        fill="currentColor"
      >
  <path d="M16.04 2.003c-7.72 0-13.997 6.277-13.997 13.997 0 2.47.648 4.885 1.877 7.01L2 30l7.16-1.88a13.93 13.93 0 0 0 6.88 1.83h.01c7.72 0 13.997-6.277 13.997-13.997S23.76 2.003 16.04 2.003zm0 25.49c-2.15 0-4.25-.58-6.08-1.67l-.44-.26-4.25 1.12 1.13-4.14-.29-.43a11.47 11.47 0 0 1-1.77-6.12c0-6.36 5.18-11.54 11.54-11.54 3.08 0 5.98 1.2 8.16 3.38a11.48 11.48 0 0 1 3.38 8.16c0 6.36-5.18 11.54-11.54 11.54zm6.33-8.66c-.35-.18-2.07-1.02-2.39-1.14-.32-.12-.55-.18-.78.18-.23.35-.9 1.14-1.1 1.38-.2.23-.4.26-.75.09-.35-.18-1.46-.54-2.78-1.72-1.03-.92-1.72-2.06-1.92-2.41-.2-.35-.02-.54.15-.71.16-.16.35-.4.52-.6.18-.2.23-.35.35-.58.12-.23.06-.44-.03-.61-.09-.18-.78-1.88-1.07-2.57-.28-.68-.57-.59-.78-.6h-.66c-.23 0-.61.09-.93.44-.32.35-1.22 1.19-1.22 2.91 0 1.72 1.25 3.38 1.43 3.61.18.23 2.46 3.76 5.96 5.27.83.36 1.48.57 1.99.73.84.27 1.61.23 2.22.14.68-.1 2.07-.85 2.36-1.67.29-.82.29-1.52.2-1.67-.09-.15-.32-.23-.67-.41z"/>
 </svg>
</button>

      {/* Popup */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-80 rounded-xl bg-white p-4">
            <h3 className="mb-3 text-lg font-semibold">How can we help?</h3>

            {options.map((type) => {
              const source =
                typeof window !== "undefined"
                  ? window.location.pathname
                  : "";

              const link = `https://wa.me/917014885565?text=${encodeURIComponent(
                `Type: ${type}\nSource: ${source}\n\nPlease describe your feedback:`
              )}`;

              return (
                <a
                  key={type}
                  href={link}
                  target="_blank"
                  className="mb-2 block rounded bg-neutral-100 p-2 hover:bg-neutral-200"
                >
                  {type}
                </a>
              );
            })}

            <button
              onClick={() => setOpen(false)}
              className="mt-3 w-full rounded bg-orange-500 p-2 text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
