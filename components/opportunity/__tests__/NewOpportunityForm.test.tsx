import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import axios from "axios";
import { toast } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { uploadFileViaSignedUrl } from "@/lib/storage/client";
import { useOpportunitySubmit } from "../hooks/useOpportunitySubmit";
import { FormData } from "../schema";

// Mock dependencies
vi.mock("axios");
vi.mock("sonner");
vi.mock("@/lib/storage/client");

const defaultAttachmentProps = {
  attachmentFiles: [],
  setAttachmentFiles: vi.fn(),
  existingAttachments: [],
  setRemovedAttachmentIds: vi.fn(),
  removedAttachmentIds: [],
};

describe("useOpportunitySubmit", () => {
  const mockToast = {
    error: vi.fn(),
    success: vi.fn(),
  };

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    (toast.error as ReturnType<typeof vi.fn>).mockImplementation(
      mockToast.error
    );
    (toast.success as ReturnType<typeof vi.fn>).mockImplementation(
      mockToast.success
    );
    (uploadFileViaSignedUrl as ReturnType<typeof vi.fn>).mockResolvedValue({
      key: "image-123",
      publicUrl: "https://cdn.example.com/image-123",
    });
    global.URL.revokeObjectURL = vi.fn();
  });

  it("should successfully create a new opportunity without images", async () => {
    const onOpportunityCreated = vi.fn();
    const setFiles = vi.fn();
    const setRemovedImageIds = vi.fn();

    const { result } = renderHook(
      () =>
        useOpportunitySubmit({
          files: [],
          setFiles,
          existingImages: [],
          onOpportunityCreated,
          setRemovedImageIds,
          removedImageIds: [],
          ...defaultAttachmentProps,
        }),
      { wrapper }
    );

    const formData: FormData = {
      type: "internship",
      title: "Test Opportunity",
      description: "Test description",
      tags: "tech, remote",
      location: "Remote",
      organiserInfo: "Test Organiser",
      dateRange: {
        from: new Date("2025-02-01"),
        to: new Date("2025-02-28"),
      },
    };

    const mockAxiosPost = vi.mocked(axios.post);
    mockAxiosPost.mockResolvedValue({
      status: 201,
      data: { id: "123", userRole: "admin" },
    });

    await result.current.onSubmit(formData);

    expect(mockAxiosPost).toHaveBeenCalledWith("/api/opportunities", {
      tags: ["tech", "remote"],
      images: undefined,
      attachments: undefined,
      description: "Test description",
      location: "Remote",
      organiserInfo: "Test Organiser",
      title: "Test Opportunity",
      type: "internship",
      startDate: "2025-02-01T00:00:00.000Z",
      endDate: "2025-02-28T00:00:00.000Z",
    });
    expect(mockToast.success).toHaveBeenCalledWith(
      "Opportunity submitted successfully!"
    );
    expect(onOpportunityCreated).toHaveBeenCalled();
  });

  it("should successfully create a new opportunity with images", async () => {
    const mockFile = new File(["test"], "test.png", { type: "image/png" });
    const files = [
      {
        file: mockFile,
        progress: 0,
        uploading: false,
        name: "test.png",
        size: 1024,
        preview: "blob:url",
        kind: "image" as const,
      },
    ];
    const setFiles = vi.fn();

    const { result } = renderHook(
      () =>
        useOpportunitySubmit({
          files,
          setFiles,
          existingImages: [],
          onOpportunityCreated: vi.fn(),
          setRemovedImageIds: vi.fn(),
          removedImageIds: [],
          ...defaultAttachmentProps,
        }),
      { wrapper }
    );

    const formData: FormData = {
      type: "internship",
      title: "Test Opportunity",
      description: "Test description",
      tags: "tech",
    };

    const mockAxiosPost = vi.mocked(axios.post);
    mockAxiosPost.mockResolvedValue({
      status: 201,
      data: { id: "123", userRole: "admin" },
    });

    await result.current.onSubmit(formData);

    expect(uploadFileViaSignedUrl).toHaveBeenCalled();
    expect(mockAxiosPost).toHaveBeenCalledWith("/api/opportunities", {
      ...formData,
      startDate: undefined,
      endDate: undefined,
      tags: ["tech"],
      images: ["image-123"],
      attachments: undefined,
    });
  });

  it("should handle image upload failure", async () => {
    const mockFile = new File(["test"], "test.png", { type: "image/png" });
    const files = [
      {
        file: mockFile,
        progress: 0,
        uploading: false,
        name: "test.png",
        size: 1024,
        preview: "blob:url",
        kind: "image" as const,
      },
    ];

    const { result } = renderHook(
      () =>
        useOpportunitySubmit({
          files,
          setFiles: vi.fn(),
          existingImages: [],
          onOpportunityCreated: vi.fn(),
          setRemovedImageIds: vi.fn(),
          removedImageIds: [],
          ...defaultAttachmentProps,
        }),
      { wrapper }
    );

    (uploadFileViaSignedUrl as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Upload failed")
    );

    await result.current.onSubmit({
      title: "Test",
      type: "internship",
      description: "Desc",
    });

    expect(mockToast.error).toHaveBeenCalledWith(
      expect.stringMatching(/failed to upload/i)
    );
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should successfully update an existing opportunity", async () => {
    const opportunity = {
      id: "123",
      title: "Old Title",
      images: ["existing-1"],
    } as any;

    const { result } = renderHook(
      () =>
        useOpportunitySubmit({
          opportunity,
          files: [],
          setFiles: vi.fn(),
          existingImages: ["existing-1"],
          onOpportunityCreated: vi.fn(),
          setRemovedImageIds: vi.fn(),
          removedImageIds: [],
          ...defaultAttachmentProps,
        }),
      { wrapper }
    );

    const formData: FormData = {
      type: "internship",
      title: "Updated Opportunity",
      description: "Updated description",
      tags: "tech, updated",
    };

    const mockAxiosPut = vi.mocked(axios.put);
    mockAxiosPut.mockResolvedValue({
      status: 200,
      data: { id: "123" },
    });

    await result.current.onSubmit(formData);

    expect(mockAxiosPut).toHaveBeenCalledWith("/api/opportunities/123", {
      ...formData,
      startDate: undefined,
      endDate: undefined,
      tags: ["tech", "updated"],
      images: ["existing-1"],
      attachments: [],
    });
    expect(mockToast.success).toHaveBeenCalledWith(
      "Opportunity updated successfully!"
    );
  });

  it("should handle API submission failure", async () => {
    const { result } = renderHook(
      () =>
        useOpportunitySubmit({
          files: [],
          setFiles: vi.fn(),
          existingImages: [],
          onOpportunityCreated: vi.fn(),
          setRemovedImageIds: vi.fn(),
          removedImageIds: [],
          ...defaultAttachmentProps,
        }),
      { wrapper }
    );

    const mockAxiosPost = vi.mocked(axios.post);
    mockAxiosPost.mockRejectedValue(new Error("API Error"));

    await result.current.onSubmit({
      title: "Test",
      type: "internship",
      description: "Desc",
    });

    expect(mockToast.error).toHaveBeenCalledWith("API Error");
  });
});
