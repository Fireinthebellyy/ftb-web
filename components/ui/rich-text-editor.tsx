"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { cn } from "@/lib/utils";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export const defaultQuillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link"],
    ["clean"],
  ],
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  modules?: typeof defaultQuillModules;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  modules = defaultQuillModules,
  className,
}: RichTextEditorProps) {
  const baseClasses =
    "w-full min-w-0 [&_.ql-toolbar.ql-snow]:flex [&_.ql-toolbar.ql-snow]:flex-wrap [&_.ql-toolbar.ql-snow]:gap-1 [&_.ql-toolbar.ql-snow]:overflow-x-hidden [&_.ql-toolbar.ql-snow_.ql-formats]:mr-1 [&_.ql-container.ql-snow]:w-full [&_.ql-container.ql-snow]:min-w-0 [&_.ql-editor]:break-words";

  return (
    <div
      className={cn(
        baseClasses,
        "[&_div.ql-container]:min-h-[220px] [&_div.ql-editor]:max-h-[35vh] [&_div.ql-editor]:min-h-[220px] [&_div.ql-editor]:overflow-y-auto",
        className
      )}
    >
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
}
