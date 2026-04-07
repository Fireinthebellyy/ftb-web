import { NextResponse } from "next/server";
import { ZodError, type ZodIssue } from "zod";

export interface ApiErrorBody {
  error: string;
  code?: string;
  fields?: string[];
  details?: unknown;
}

const getIssueField = (issue: ZodIssue): string => {
  if (!issue.path.length) {
    return "request";
  }

  return issue.path.join(".");
};

export const formatZodIssues = (issues: ZodIssue[]): string[] => {
  return issues.map((issue) => {
    const field = getIssueField(issue);
    return `${field}: ${issue.message}`;
  });
};

export const apiError = (status: number, body: ApiErrorBody) => {
  return NextResponse.json(body, { status });
};

export const badRequest = (
  error: string,
  options?: Omit<ApiErrorBody, "error">
) => {
  return apiError(400, { error, ...options });
};

export const validationError = (error: ZodError, message?: string) => {
  const formatted = formatZodIssues(error.issues);
  const finalMessage = message ?? formatted[0] ?? "Validation failed";

  return badRequest(finalMessage, {
    code: "VALIDATION_ERROR",
    details: error.issues,
  });
};
