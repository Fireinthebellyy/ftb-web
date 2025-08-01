export type Opportunity = {
  id: string;
  title: string;
  description: string;
  type: string | string[];
  tags?: string[];
  url?: string;
  images?: string[];
  createdAt?: string;
  location?: string;
  organiser_info?: string;
  startDate?: string;
  endDate?: string;
  user: {
    id: string;
    name: string;
    image: string;
  };
};

export interface OpportunityPostProps {
  opportunity: Opportunity;
  onBookmarkChange?: (id: string, isBookmarked: boolean) => void;
}

export type ProfileUser = {
  id: string;
  name: string;
  email: string;
  image: string;
};

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

export type PrivacyPolicy = {
  title: string;
  content: string;
  lastUpdated: string;
};

export type TermsType = {
  title: string;
  content: string;
  lastUpdated: string;
};
