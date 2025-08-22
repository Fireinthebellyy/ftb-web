"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Righteous } from "next/font/google";
import { useState } from "react";
import { Mail, Instagram, Linkedin, Youtube, BadgeCheck } from "lucide-react";
import Link from "next/link";

const righteous = Righteous({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-righteous",
});

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch (_error) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full grow flex-col">
      <main className="flex-1 bg-gradient-to-b from-neutral-50 via-orange-50 to-white">
        <section className="container mx-auto py-36 md:py-28">
          <div className="px-4 text-center">
            <div className="mx-auto max-w-4xl">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`${righteous.className} text-foreground mb-6 text-4xl leading-tight font-semibold tracking-tight md:text-7xl`}
              >
                Because the right{" "}
                <span className="text-orange-600/70 selection:bg-orange-600 selection:text-white">
                  opportunity
                </span>{" "}
                changes everything.
              </motion.h1>

              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="mx-auto max-w-2xl"
                >
                  <div className="text-foreground mb-4 flex flex-wrap items-center justify-center gap-2 text-xl md:text-xl">
                    <BadgeCheck className="inline-block text-green-500" />
                    <p> You are in. Follow us on social media for updates!</p>
                  </div>

                  <div className="flex items-end justify-center gap-4">
                    <Link
                      href="https://www.instagram.com/fireinthebelly_ftb/"
                      aria-label="Follow us on Instagram"
                    >
                      <Instagram />
                    </Link>
                    <Link
                      href="https://www.linkedin.com/company/fireinthebelly/"
                      aria-label="Follow us on LinkedIn"
                    >
                      <Linkedin />
                    </Link>
                    <Link
                      href="https://www.youtube.com/@fireinthebelly11"
                      aria-label="Follow us on YouTube"
                    >
                      <Youtube />
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-muted-foreground mx-auto mb-8 max-w-3xl text-lg"
                  >
                    Be the first to know when we launch our platform for
                    ambitious students. Get early access to hackathons, grants,
                    competitions and stay ahead of every deadline.
                  </motion.p>
                  <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    onSubmit={handleSubmit}
                    className="mx-auto max-w-md"
                  >
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label htmlFor="email" className="sr-only">
                          Email address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 border-2 border-orange-600/70 placeholder:text-orange-800/40"
                          disabled={isSubmitting}
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={isSubmitting}
                        className="h-12 px-8 font-semibold text-shadow-sm"
                      >
                        {isSubmitting ? (
                          "Joining..."
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Join Waitlist
                          </>
                        )}
                      </Button>
                    </div>
                    {error && (
                      <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}
                  </motion.form>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
