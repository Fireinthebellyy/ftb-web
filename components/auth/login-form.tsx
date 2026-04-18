"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { z } from "zod";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  INTEREST_PROMPT_STORAGE_KEY,
  type InterestPromptBgVariant,
} from "@/lib/interest-prompt";
import Link from "next/link";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Temporarily disable email/password login and signup
const ENABLE_EMAIL_PASSWORD_LOGIN = false;

export function LoginForm({
  className,
  returnUrlOverride,
  isOverlay = false,
  interestBgVariant,
  ...props
}: React.ComponentProps<"div"> & {
  returnUrlOverride?: string;
  isOverlay?: boolean;
  interestBgVariant?: InterestPromptBgVariant;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<
    "google" | "linkedin" | null
  >(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnUrl = searchParams.get("returnUrl");
  const searchParamReturnUrl =
    rawReturnUrl &&
    rawReturnUrl.startsWith("/") &&
    !rawReturnUrl.startsWith("//")
      ? rawReturnUrl
      : "/";
  const returnUrl = returnUrlOverride ?? searchParamReturnUrl;
  const interestBgParam = searchParams.get("interestBg");

  useEffect(() => {
    if (interestBgVariant) {
      sessionStorage.setItem(INTEREST_PROMPT_STORAGE_KEY, interestBgVariant);
      return;
    }
    if (interestBgParam === "white" || interestBgParam === "blur") {
      sessionStorage.setItem(INTEREST_PROMPT_STORAGE_KEY, interestBgParam);
    }
  }, [interestBgVariant, interestBgParam]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      setLoadingProvider("google");
      if (interestBgVariant) {
        sessionStorage.setItem(INTEREST_PROMPT_STORAGE_KEY, interestBgVariant);
      } else if (interestBgParam === "white" || interestBgParam === "blur") {
        sessionStorage.setItem(INTEREST_PROMPT_STORAGE_KEY, interestBgParam);
      }
      await authClient.signIn.social({
        provider: "google",
        callbackURL: returnUrl,
        newUserCallbackURL: returnUrl,
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const signInWithLinkedIn = async () => {
    try {
      setIsLoading(true);
      setLoadingProvider("linkedin");
      if (interestBgVariant) {
        sessionStorage.setItem(INTEREST_PROMPT_STORAGE_KEY, interestBgVariant);
      } else if (interestBgParam === "white" || interestBgParam === "blur") {
        sessionStorage.setItem(INTEREST_PROMPT_STORAGE_KEY, interestBgParam);
      }
      await authClient.signIn.social({
        provider: "linkedin",
        callbackURL: returnUrl,
        newUserCallbackURL: returnUrl,
      });
    } catch (error) {
      console.error("LinkedIn sign-in error:", error);
      toast.error("LinkedIn sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      await authClient.signIn.email(
        {
          email: values.email,
          password: values.password,
        },
        {
          onSuccess: async (_ctx) => {
            // Check if user has completed onboarding by fetching profile
            try {
              const response = await fetch("/api/onboarding");
              const data = await response.json();

              // User has completed onboarding if profile exists
              const hasCompletedOnboarding = !!data.profile;

              if (hasCompletedOnboarding) {
                router.push(returnUrl);
              } else {
                router.push(returnUrl);
              }
            } catch (error) {
              console.error("Error checking onboarding status:", error);
              router.push(returnUrl);
            }
          },
        }
      );
      toast.success("Logged in. Redirecting...");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Login with your social account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6">
                <div className="flex flex-col gap-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    type="button"
                    onClick={signInWithGoogle}
                    disabled={isLoading}
                  >
                    {loadingProvider === "google" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                    {loadingProvider === "google"
                      ? "Signing in with Google..."
                      : "Login with Google"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    type="button"
                    onClick={signInWithLinkedIn}
                    disabled={isLoading}
                  >
                    {loadingProvider === "linkedin" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-linkedin-icon lucide-linkedin"
                      >
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                        <rect width="4" height="12" x="2" y="9" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                    )}
                    {loadingProvider === "linkedin"
                      ? "Signing in with LinkedIn..."
                      : "Login with LinkedIn"}
                  </Button>
                </div>
                {ENABLE_EMAIL_PASSWORD_LOGIN && (
                  <>
                    <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                      <span className="bg-card text-muted-foreground relative z-10 px-2">
                        Or continue with
                      </span>
                    </div>
                    <div className="grid gap-6">
                      <div className="grid gap-3">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="m@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid gap-3">
                        <div className="flex flex-col gap-2">
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="********"
                                    {...field}
                                    type="password"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Link
                            href="/forgot-password"
                            className="ml-auto text-sm underline-offset-4 hover:underline"
                          >
                            Forgot your password?
                          </Link>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Login"
                        )}
                      </Button>
                    </div>
                  </>
                )}
                {ENABLE_EMAIL_PASSWORD_LOGIN && (
                  <div className="text-center text-sm">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/signup"
                      className="underline underline-offset-4"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div
        className={cn(
          "text-center text-xs text-balance",
          isOverlay
            ? "text-white/90"
            : "text-muted-foreground *:[a]:hover:text-primary"
        )}
      >
        By clicking continue, you agree to our{" "}
        <Link
          href="/terms"
          className={cn(
            "inline-block border-b pb-0.5"
          )}
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className={cn(
            "inline-block border-b pb-0.5",
          )}
        >
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}
