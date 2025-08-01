export type UploadProgress = {
  progress: number;
};

export interface FileItem {
  name: string;
  size: number;
  file: File;
  preview: string;
  uploading?: boolean;
  progress?: number;
  fileId?: string;
  error?: boolean;
}
