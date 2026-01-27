"use client";

import React, { useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ProtectedContentProps {
  children: React.ReactNode;
  className?: string;
}

export default function ProtectedContent({
  children,
  className,
}: ProtectedContentProps) {
  const preventCopy = useCallback((e: ClipboardEvent) => {
    e.preventDefault();
    console.warn("Copying content is not allowed for this protected material.");
  }, []);

  const preventContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  const preventKeyboard = useCallback((e: KeyboardEvent) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "c" || e.key === "C" || e.key === "a" || e.key === "A")
    ) {
      e.preventDefault();
      console.warn("Copying or selecting content is not allowed.");
    }
  }, []);

  useEffect(() => {
    const element = document.getElementById("protected-content");
    if (!element) return;

    element.addEventListener("copy", preventCopy);
    element.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("keydown", preventKeyboard);

    return () => {
      element.removeEventListener("copy", preventCopy);
      element.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("keydown", preventKeyboard);
    };
  }, [preventCopy, preventContextMenu, preventKeyboard]);

  return (
    <div id="protected-content" className={cn("protected-content", className)}>
      {children}
      <style jsx global>{`
        .protected-content {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        .protected-content * {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        .protected-content a {
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
