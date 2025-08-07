import Link from "next/link";

import Image from "next/image";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function LoginPage() {
  return (
    <div className="bg-muted flex h-full grow flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Image
              width={50}
              height={50}
              src={"/images/fire-logo.png"}
              alt="Fire in the Belly Logo"
              priority
            />
          </div>
          Fire in the Belly
        </Link>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
