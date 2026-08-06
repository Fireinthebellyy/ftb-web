"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Toolkit } from "@/types/interfaces";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { uploadFileViaSignedUrl } from "@/lib/storage/client";

interface SessionApplicationModalProps {
  toolkit: Toolkit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function SessionApplicationModal({
  toolkit,
  open,
  onOpenChange,
  onSuccess,
}: SessionApplicationModalProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = toolkit.sessionQuestions || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required questions
    for (const q of questions) {
      if (q.required && !answers[q.id] && !files[q.id]) {
        toast.error(`Please answer the question: ${q.question}`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const finalAnswers = { ...answers };

      // Upload files
      for (const [qId, file] of Object.entries(files)) {
        if (file) {
          const uploadedFile = await uploadFileViaSignedUrl({
            domain: "ungatekeep-images",
            file,
          });
          finalAnswers[qId] = uploadedFile.publicUrl;
        }
      }

      await axios.post("/api/toolkits/session-apply", {
        toolkitId: toolkit.id,
        answers: finalAnswers,
      });

      toast.success("Application submitted successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to submit application", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for Session: {toolkit.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {questions.map((q) => (
            <div key={q.id} className="space-y-3">
              <Label>
                {q.question} {q.required && <span className="text-red-500">*</span>}
              </Label>
              {q.type === "text" && (
                <Input
                  required={q.required}
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="Your answer"
                />
              )}
              {q.type === "mcq" && (
                <RadioGroup
                  required={q.required}
                  value={answers[q.id] || ""}
                  onValueChange={(val) => setAnswers({ ...answers, [q.id]: val })}
                >
                  {q.options?.map((opt: string, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt} id={`${q.id}-${idx}`} />
                      <Label htmlFor={`${q.id}-${idx}`}>{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {q.type === "file" && (
                <Input
                  type="file"
                  required={q.required && !files[q.id]}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFiles({ ...files, [q.id]: file });
                    }
                  }}
                />
              )}
            </div>
          ))}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Application
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
