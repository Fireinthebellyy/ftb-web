"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supportsAuthOverlay } from "@/lib/auth-overlay-routes";

export default function AuthOverlay() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!supportsAuthOverlay(pathname)) {
    return null;
  }

  const authMode = searchParams.get("auth");
  const isOpen = authMode === "login" || authMode === "signup";

  if (!isOpen) {
    return null;
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  const returnParams = new URLSearchParams(searchParams.toString());
  returnParams.delete("auth");
  const returnUrl = returnParams.toString()
    ? `${pathname}?${returnParams.toString()}`
    : pathname;

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-auto fixed inset-x-0 top-16 bottom-0 z-40 bg-black/25 backdrop-blur-[3px]"
      />
      <Dialog open={isOpen} onOpenChange={handleOpenChange} modal={false}>
        <DialogContent
          className="max-h-[calc(100vh-2rem)] overflow-y-auto border-none bg-transparent p-0 shadow-none sm:max-w-sm"
          overlayClassName="hidden"
          showCloseButton={false}
        >
          {authMode === "signup" ? (
            <SignupForm className="w-full" />
          ) : (
            <LoginForm
              className="w-full"
              returnUrlOverride={returnUrl}
              isOverlay={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

