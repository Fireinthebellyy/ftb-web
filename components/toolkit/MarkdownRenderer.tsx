"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import ProtectedContent from "./ProtectedContent";

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  protected?: boolean;
}

export default function MarkdownRenderer({
  content,
  className,
  protected: isProtected = false,
}: MarkdownRendererProps) {
  const markdownContent = (
    <div
      className={cn(
        "prose prose-gray prose-lg max-w-none",
        "prose-headings:font-semibold prose-headings:text-gray-900",
        "prose-p:text-gray-700 prose-p:leading-relaxed",
        "prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline",
        "prose-strong:text-gray-900 prose-strong:font-semibold",
        "prose-code:text-orange-600 prose-code:bg-orange-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm",
        "prose-pre:bg-gray-900 prose-pre:text-gray-100",
        "prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:bg-orange-50 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:italic prose-blockquote:text-gray-700",
        "prose-ul:list-disc prose-ul:marker:text-orange-500",
        "prose-ol:list-decimal prose-ol:marker:text-orange-500",
        "prose-img:rounded-lg prose-img:shadow-md",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ inline, className, children, ...props }: CodeProps) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <div className="not-prose my-4 overflow-hidden rounded-lg">
                <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
                  <span className="text-xs text-gray-400">{match[1]}</span>
                  <span className="text-xs text-gray-500">Code</span>
                </div>
                <pre className="bg-gray-900 p-4 text-sm">
                  <code {...props} className={className}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code
                className={cn(
                  "rounded-md bg-orange-50 px-1.5 py-0.5 text-sm text-orange-600",
                  className
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
          img({ alt, ...props }) {
            return (
              <figure className="my-6">
                {/* eslint-disable @next/next/no-img-element */}
                <img
                  {...props}
                  alt={alt || "Article image"}
                  className="w-full rounded-lg shadow-md"
                  loading="lazy"
                />
                {/* eslint-enable @next/next/no-img-element */}
                {alt && (
                  <figcaption className="mt-2 text-center text-sm text-gray-500 italic">
                    {alt}
                  </figcaption>
                )}
              </figure>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  if (isProtected) {
    return <ProtectedContent>{markdownContent}</ProtectedContent>;
  }

  return markdownContent;
}
