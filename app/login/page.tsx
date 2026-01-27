import Link from 'next/link';
import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/login-form';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="bg-muted flex h-full grow flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="text-primary-foreground flex size-6 items-center justify-center rounded bg-white">
            <Image
              width={50}
              height={50}
              src={'/images/fire-logo.png'}
              alt="Fire in the Belly Logo"
              priority
            />
          </div>
          Fire in the Belly
        </Link>
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
