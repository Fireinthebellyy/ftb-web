import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { toast } from "sonner";
import {
  createOpportunityStorage,
  getAppwriteErrorMessage,
} from "@/lib/appwrite";
import type { FormData } from "../schema";

// Mock dependencies
vi.mock("axios");
vi.mock("sonner");
vi.mock("@/lib/appwrite");
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

// Mock the onSubmit function logic
describe("NewOpportunityForm onSubmit", () => {
  const mockToast = {
    error: vi.fn(),
    success: vi.fn(),
  };

  const mockStorage = {
    createFile: vi.fn(),
    deleteFile: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (toast.error as ReturnType<typeof vi.fn>).mockImplementation(
      mockToast.error
    );
    (toast.success as ReturnType<typeof vi.fn>).mockImplementation(
      mockToast.success
    );
    (createOpportunityStorage as ReturnType<typeof vi.fn>).mockReturnValue(
      mockStorage
    );
  });

  // Mock implementation of onSubmit function
  async function mockOnSubmit(
    data: FormData,
    options: {
      files?: Array<{ file: File; fileId?: string; name: string }>;
      existingImages?: string[];
      removedImageIds?: string[];
      opportunityId?: string;
      onOpportunityCreated?: () => void;
      queryClientInvalidate?: () => void;
    } = {}
  ) {
    const {
      files = [],
      existingImages = [],
      removedImageIds = [],
      opportunityId,
      onOpportunityCreated = vi.fn(),
      queryClientInvalidate = vi.fn(),
    } = options;

    try {
      // Mock image upload
      const uploadedFileIds: string[] = [];
      let hasError = false;

      for (const file of files) {
        try {
          const res = await mockStorage.createFile(
            "bucket-id",
            "unique()",
            file.file,
            [],
            vi.fn()
          );
          uploadedFileIds.push(res.$id);
        } catch (err) {
          hasError = true;
          const errorMessage = getAppwriteErrorMessage(err);
          mockToast.error(
            `Failed to upload "${file.file.name}": ${errorMessage}`
          );
        }
      }

      if (hasError) {
        mockToast.error(
          `One or more images failed to upload. Fix the failed uploads and try again. ${
            opportunityId ? "Post was not updated." : "Post was not created."
          }`
        );
        throw new Error(
          "One or more images failed to upload. Post was not updated/created."
        );
      }

      // Combine existing images with newly uploaded images
      const finalImages = [...existingImages, ...uploadedFileIds];

      const normalizedPublishAt =
        data.publishAt && data.publishAt.trim().length > 0
          ? new Date(data.publishAt).toISOString()
          : undefined;

      // Prepare payload
      const payload = {
        ...data,
        startDate: data.dateRange?.from?.toISOString(),
        endDate: data.dateRange?.to?.toISOString(),
        tags:
          data.tags
            ?.split(",")
            .map((t) => t.trim())
            .filter(Boolean) || [],
        images: opportunityId
          ? finalImages
          : uploadedFileIds.length > 0
            ? uploadedFileIds
            : undefined,
        ...(normalizedPublishAt !== undefined
          ? { publishAt: normalizedPublishAt }
          : {}),
      };

      // Mock API call
      let res;
      if (opportunityId) {
        res = await axios.put(`/api/opportunities/${opportunityId}`, payload);
        if (res.status !== 200) throw new Error("Failed to update opportunity");

        // Delete removed images
        for (const imageId of removedImageIds) {
          try {
            await mockStorage.deleteFile("bucket-id", imageId);
          } catch (err) {
            console.error(`Failed to delete image ${imageId}:`, err);
          }
        }
      } else {
        res = await axios.post("/api/opportunities", payload);
        if (res.status !== 200 && res.status !== 201)
          throw new Error("Failed to create opportunity");
      }

      // Check user role to show appropriate message
      const userRole = res.data?.userRole || "user";
      const needsReview = userRole === "user";
      const isScheduled =
        typeof payload.publishAt === "string" &&
        new Date(payload.publishAt).getTime() > Date.now();

      mockToast.success(
        opportunityId
          ? "Opportunity updated successfully!"
          : needsReview
            ? "Opportunity submitted for review! It will be visible once approved by an admin."
            : isScheduled
              ? "Opportunity scheduled successfully!"
              : "Opportunity submitted successfully!"
      );

      queryClientInvalidate();
      onOpportunityCreated();

      return { success: true, data: res.data };
    } catch (err: unknown) {
      if (err instanceof Error) {
        mockToast.error(err.message);
      } else {
        mockToast.error("Unknown error occurred");
      }
      throw err;
    }
  }

  it("should successfully create a new opportunity without images", async () => {
    const formData: FormData = {
      type: "internship",
      title: "Test Opportunity",
      description: "This is a test opportunity description",
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

    const onOpportunityCreated = vi.fn();
    const queryClientInvalidate = vi.fn();

    const result = await mockOnSubmit(formData, {
      onOpportunityCreated,
      queryClientInvalidate,
    });

    expect(result.success).toBe(true);
    expect(mockAxiosPost).toHaveBeenCalledWith("/api/opportunities", {
      ...formData,
      startDate: "2025-02-01T00:00:00.000Z",
      endDate: "2025-02-28T00:00:00.000Z",
      tags: ["tech", "remote"],
      images: undefined,
    });
    expect(mockToast.success).toHaveBeenCalledWith(
      "Opportunity submitted successfully!"
    );
    expect(onOpportunityCreated).toHaveBeenCalled();
    expect(queryClientInvalidate).toHaveBeenCalled();
  });

  it("should successfully create a new opportunity with images", async () => {
    const formData: FormData = {
      type: "internship",
      title: "Test Opportunity",
      description: "This is a test opportunity description",
      tags: "tech",
    };

    const mockFile = new File(["test"], "test.png", { type: "image/png" });
    const files = [{ file: mockFile, name: mockFile.name }];

    const mockAxiosPost = vi.mocked(axios.post);
    mockAxiosPost.mockResolvedValue({
      status: 201,
      data: { id: "123", userRole: "admin" },
    });

    mockStorage.createFile.mockResolvedValue({ $id: "image-123" });

    const result = await mockOnSubmit(formData, { files });

    expect(result.success).toBe(true);
    expect(mockStorage.createFile).toHaveBeenCalled();
    expect(mockAxiosPost).toHaveBeenCalledWith("/api/opportunities", {
      ...formData,
      startDate: undefined,
      endDate: undefined,
      tags: ["tech"],
      images: ["image-123"],
    });
  });

  it("should handle image upload failure", async () => {
    const formData: FormData = {
      type: "internship",
      title: "Test Opportunity",
      description: "This is a test opportunity description",
      tags: "tech",
    };

    const mockFile = new File(["test"], "test.png", { type: "image/png" });
    const files = [{ file: mockFile, name: mockFile.name }];

    mockStorage.createFile.mockRejectedValue(
      new Error("CORS Error: Domain not whitelisted")
    );

    await expect(mockOnSubmit(formData, { files })).rejects.toThrow(
      "One or more images failed to upload"
    );

    expect(mockToast.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to upload")
    );
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should successfully update an existing opportunity", async () => {
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

    const result = await mockOnSubmit(formData, {
      existingImages: ["existing-1"],
      opportunityId: "123",
    });

    expect(result.success).toBe(true);
    expect(mockAxiosPut).toHaveBeenCalledWith("/api/opportunities/123", {
      ...formData,
      startDate: undefined,
      endDate: undefined,
      tags: ["tech", "updated"],
      images: ["existing-1"],
    });
    expect(mockToast.success).toHaveBeenCalledWith(
      "Opportunity updated successfully!"
    );
  });

  it("should delete removed images when updating", async () => {
    const formData: FormData = {
      type: "internship",
      title: "Updated Opportunity",
      description: "Updated description",
      tags: "tech",
    };

    const mockAxiosPut = vi.mocked(axios.put);
    mockAxiosPut.mockResolvedValue({
      status: 200,
      data: { id: "123" },
    });

    mockStorage.deleteFile.mockResolvedValue(undefined);

    await mockOnSubmit(formData, {
      existingImages: ["existing-1"],
      removedImageIds: ["removed-1", "removed-2"],
      opportunityId: "123",
    });

    expect(mockStorage.deleteFile).toHaveBeenCalledTimes(2);
    expect(mockStorage.deleteFile).toHaveBeenCalledWith(
      "bucket-id",
      "removed-1"
    );
    expect(mockStorage.deleteFile).toHaveBeenCalledWith(
      "bucket-id",
      "removed-2"
    );
  });

  it("should show review message for regular users", async () => {
    const formData: FormData = {
      type: "internship",
      title: "Test Opportunity",
      description: "This is a test opportunity description",
      tags: "tech",
    };

    const mockAxiosPost = vi.mocked(axios.post);
    mockAxiosPost.mockResolvedValue({
      status: 201,
      data: { id: "123", userRole: "user" },
    });

    await mockOnSubmit(formData);

    expect(mockToast.success).toHaveBeenCalledWith(
      "Opportunity submitted for review! It will be visible once approved by an admin."
    );
  });

  it("should handle API errors gracefully", async () => {
    const formData: FormData = {
      type: "internship",
      title: "Test Opportunity",
      description: "This is a test opportunity description",
      tags: "tech",
    };

    const mockAxiosPost = vi.mocked(axios.post);
    mockAxiosPost.mockRejectedValue(new Error("Network error"));

    await expect(mockOnSubmit(formData)).rejects.toThrow("Network error");
    expect(mockToast.error).toHaveBeenCalledWith("Network error");
  });

  it("should show scheduled message when publishAt is in future", async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const formData: FormData = {
      type: "internship",
      title: "Scheduled Opportunity",
      description: "This is a scheduled opportunity description",
      tags: "tech",
      publishAt: `${tomorrow.getFullYear()}-${String(
        tomorrow.getMonth() + 1
      ).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}T10:00`,
    };

    const mockAxiosPost = vi.mocked(axios.post);
    mockAxiosPost.mockResolvedValue({
      status: 201,
      data: { id: "123", userRole: "admin" },
    });

    await mockOnSubmit(formData);

    expect(mockToast.success).toHaveBeenCalledWith(
      "Opportunity scheduled successfully!"
    );
  });
});
